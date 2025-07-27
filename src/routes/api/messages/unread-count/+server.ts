import type { RequestHandler } from './$types';
import { apiError, apiSuccess, ApiErrorType, requireAuth } from '$lib/server/api-utils';
import type { UnreadCountResponse } from '$lib/types/api.types';

export const GET: RequestHandler = async ({ locals }) => {
    const requestId = crypto.randomUUID();
    
    try {
        // Check authentication
        const auth = await requireAuth(locals);
        if (!auth) {
            return apiError('Unauthorized', 401, ApiErrorType.AUTHENTICATION, undefined, requestId);
        }

        // Get user's conversations first
        const { data: conversations, error: convError } = await locals.supabase
            .from('conversations')
            .select('id')
            .or(`buyer_id.eq.${auth.userId},seller_id.eq.${auth.userId}`);

        if (convError) {
            return apiError(
                'Failed to fetch conversations',
                500,
                ApiErrorType.DATABASE,
                undefined,
                requestId
            );
        }

        const conversationIds = conversations?.map(c => c.id) || [];

        if (conversationIds.length === 0) {
            const response: UnreadCountResponse = { count: 0 };
            return apiSuccess(response, 200, requestId);
        }

        // Get total unread message count for the current user
        const { count, error } = await locals.supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false)
            .neq('sender_id', auth.userId)
            .in('conversation_id', conversationIds);

        if (error) {
            return apiError(
                'Failed to fetch unread count',
                500,
                ApiErrorType.DATABASE,
                undefined,
                requestId
            );
        }

        const response: UnreadCountResponse = { count: count || 0 };
        return apiSuccess(response, 200, requestId);
    } catch (error) {
        return apiError(
            'An unexpected error occurred',
            500,
            ApiErrorType.INTERNAL,
            undefined,
            requestId
        );
    }
};