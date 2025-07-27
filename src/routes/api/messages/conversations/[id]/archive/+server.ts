import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, params }) => {
    const supabase = locals.supabase;
    const { session } = await locals.safeGetSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;

    try {
        // Get conversation to check user access
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('buyer_id, seller_id')
            .eq('id', conversationId)
            .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)
            .single();

        if (convError || !conversation) {
            return json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Determine which field to update based on user role
        const isBuyer = session.user.id === conversation.buyer_id;
        const archiveField = isBuyer ? 'archived_by_buyer' : 'archived_by_seller';

        // Archive the conversation
        const { error: updateError } = await supabase
            .from('conversations')
            .update({
                [archiveField]: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', conversationId);

        if (updateError) {
            console.error('Error archiving conversation:', updateError);
            return json({ error: 'Failed to archive conversation' }, { status: 500 });
        }

        return json({ success: true });
    } catch (error) {
        console.error('Error archiving conversation:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
    const supabase = locals.supabase;
    const { session } = await locals.safeGetSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;

    try {
        // Get conversation to check user access
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('buyer_id, seller_id')
            .eq('id', conversationId)
            .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)
            .single();

        if (convError || !conversation) {
            return json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Determine which field to update based on user role
        const isBuyer = session.user.id === conversation.buyer_id;
        const archiveField = isBuyer ? 'archived_by_buyer' : 'archived_by_seller';

        // Unarchive the conversation
        const { error: updateError } = await supabase
            .from('conversations')
            .update({
                [archiveField]: false,
                updated_at: new Date().toISOString()
            })
            .eq('id', conversationId);

        if (updateError) {
            console.error('Error unarchiving conversation:', updateError);
            return json({ error: 'Failed to unarchive conversation' }, { status: 500 });
        }

        return json({ success: true });
    } catch (error) {
        console.error('Error unarchiving conversation:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};