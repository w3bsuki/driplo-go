import type { RequestHandler } from './$types';
import { apiError, apiSuccess, ApiErrorType, requireAuth, validateRequest } from '$lib/server/api-utils';
import { z } from 'zod';
import type { MessageSendResponse } from '$lib/types/api.types';

// Simple rate limiting - 30 messages per user per minute
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = rateLimiter.get(userId);
    
    if (!userLimit || now > userLimit.resetTime) {
        rateLimiter.set(userId, { count: 1, resetTime: now + 60000 }); // 1 minute
        return true;
    }
    
    if (userLimit.count >= 30) {
        return false;
    }
    
    userLimit.count++;
    return true;
}

const messageSchema = z.object({
    conversation_id: z.string().uuid(),
    content: z.string().min(1).max(5000),
    attachments: z.array(z.string()).optional().default([])
});

export const POST: RequestHandler = async ({ locals, request }) => {
    const requestId = crypto.randomUUID();
    
    try {
        // Check authentication
        const auth = await requireAuth(locals);
        if (!auth) {
            return apiError('Unauthorized', 401, ApiErrorType.AUTHENTICATION, undefined, requestId);
        }

        // Check rate limit
        if (!checkRateLimit(auth.userId)) {
            return apiError(
                'Rate limit exceeded. Please wait before sending more messages.',
                429,
                ApiErrorType.RATE_LIMIT,
                { retryAfter: 60 },
                requestId
            );
        }

        // Validate request body
        const { conversation_id, content, attachments } = await validateRequest(request, messageSchema);

        // Verify user has access to this conversation
        const { data: conversation, error: convError } = await locals.supabase
            .from('conversations')
            .select(`
                *,
                buyer:profiles!conversations_buyer_id_fkey (
                    id,
                    username,
                    email
                ),
                seller:profiles!conversations_seller_id_fkey (
                    id,
                    username,
                    email
                ),
                listing:listings!inner (
                    title
                )
            `)
            .eq('id', conversation_id)
            .or(`buyer_id.eq.${auth.userId},seller_id.eq.${auth.userId}`)
            .single();

        if (convError || !conversation) {
            return apiError(
                'Conversation not found or access denied',
                404,
                ApiErrorType.NOT_FOUND,
                undefined,
                requestId
            );
        }

        // Create the message
        const { data: message, error: msgError } = await locals.supabase
            .from('messages')
            .insert({
                conversation_id,
                sender_id: auth.userId,
                message_text: content,
                attachments: attachments || [],
                is_read: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select(`
                *,
                sender:profiles!messages_sender_id_fkey (
                    id,
                    username,
                    avatar_url
                )
            `)
            .single();

        if (msgError) {
            return apiError(
                'Failed to send message',
                500,
                ApiErrorType.DATABASE,
                undefined,
                requestId
            );
        }

        // Send email notification to recipient
        const isBuyer = auth.userId === conversation.buyer_id;
        const recipient = isBuyer ? conversation.seller : conversation.buyer;
        const sender = isBuyer ? conversation.buyer : conversation.seller;

        // Send email notification (async, don't await to avoid blocking the response)
        try {
            const { emailService } = await import('$lib/server/email');
            emailService.sendMessageNotification(
                recipient,
                sender,
                conversation.listing,
                content,
                conversation_id
            ).catch(error => {
                console.error(`[${requestId}] Failed to send email notification:`, error);
            });
        } catch (error) {
            console.error(`[${requestId}] Failed to load email service:`, error);
        }

        const response: MessageSendResponse = {
            message,
            conversation_id
        };

        return apiSuccess(response, 201, requestId);
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