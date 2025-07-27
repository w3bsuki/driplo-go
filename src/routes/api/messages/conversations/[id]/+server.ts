import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params, url }) => {
    const supabase = locals.supabase;
    const { session } = await locals.safeGetSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const before = url.searchParams.get('before');

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)
        .single();

    if (convError || !conversation) {
        return json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Build query for messages
    let query = supabase
        .from('messages')
        .select(`
            *,
            sender:profiles!messages_sender_id_fkey (
                id,
                username,
                avatar_url
            )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (before) {
        query = query.lt('created_at', before);
    }

    const { data: messages, error: msgError } = await query;

    if (msgError) {
        console.error('Error fetching messages:', msgError);
        return json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Mark messages as read
    if (messages && messages.length > 0) {
        await supabase.rpc('mark_messages_as_read', {
            p_conversation_id: conversationId,
            p_user_id: session.user.id
        });
    }

    return json({
        conversation,
        messages: messages?.reverse() || [],
        hasMore: messages?.length === limit
    });
};