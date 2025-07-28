import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
    const supabase = locals.supabase;
    const { session } = await locals.safeGetSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!query || query.trim().length < 2) {
        return json({ error: 'Search query must be at least 2 characters' }, { status: 400 });
    }

    try {
        // Search messages in conversations where the user is a participant
        const { data: messages, error: searchError } = await supabase
            .from('messages')
            .select(`
                *,
                sender:profiles!messages_sender_id_fkey (
                    id,
                    username,
                    avatar_url
                ),
                conversation:conversations!inner (
                    id,
                    listing_id,
                    buyer_id,
                    seller_id,
                    listing:listings!inner (
                        title,
                        images
                    )
                )
            `)
            .textSearch('message_text', query.trim())
            .or(`conversation.buyer_id.eq.${session.user.id},conversation.seller_id.eq.${session.user.id}`)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (searchError) {
            console.error('Search error:', searchError);
            return json({ error: 'Search failed' }, { status: 500 });
        }

        // Group results by conversation
        const conversationMap = new Map();
        messages?.forEach(message => {
            const convId = message.conversation.id;
            if (!conversationMap.has(convId)) {
                conversationMap.set(convId, {
                    conversation: message.conversation,
                    messages: []
                });
            }
            conversationMap.get(convId).messages.push(message);
        });

        const results = Array.from(conversationMap.values());

        return json({
            results,
            hasMore: messages?.length === limit,
            total: messages?.length || 0
        });
    } catch (error) {
        console.error('Error searching messages:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};