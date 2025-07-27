import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
    const supabase = locals.supabase;
    const { session } = await locals.safeGetSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messageId = params.id;

    // Get message with sender info
    const { data: message, error } = await supabase
        .from('messages')
        .select(`
            *,
            sender:profiles!messages_sender_id_fkey (
                id,
                username,
                avatar_url
            )
        `)
        .eq('id', messageId)
        .single();

    if (error || !message) {
        return json({ error: 'Message not found' }, { status: 404 });
    }

    // Verify user has access to this message
    const { data: conversation } = await supabase
        .from('conversations')
        .select('buyer_id, seller_id')
        .eq('id', message.conversation_id)
        .single();

    if (!conversation || 
        (session.user.id !== conversation.buyer_id && 
         session.user.id !== conversation.seller_id)) {
        return json({ error: 'Unauthorized' }, { status: 403 });
    }

    return json({ message });
};