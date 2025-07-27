import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
    const supabase = locals.supabase;
    const { session } = await locals.safeGetSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const archived = url.searchParams.get('archived') === 'true';

    // Build query for conversations
    let query = supabase
        .from('conversations')
        .select(`
            *,
            listing:listings!inner (
                id,
                title,
                images,
                price
            ),
            buyer:profiles!conversations_buyer_id_fkey (
                id,
                username,
                avatar_url
            ),
            seller:profiles!conversations_seller_id_fkey (
                id,
                username,
                avatar_url
            ),
            last_message:messages (
                id,
                message_text,
                created_at,
                sender_id
            )
        `)
        .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`);

    // Filter based on archived status and user role
    if (archived) {
        // Show only archived conversations for current user
        query = query.or(`and(buyer_id.eq.${session.user.id},archived_by_buyer.eq.true),and(seller_id.eq.${session.user.id},archived_by_seller.eq.true)`);
    } else {
        // Show only non-archived conversations for current user
        query = query.or(`and(buyer_id.eq.${session.user.id},or(archived_by_buyer.is.null,archived_by_buyer.eq.false)),and(seller_id.eq.${session.user.id},or(archived_by_seller.is.null,archived_by_seller.eq.false))`);
    }

    const { data: conversations, error } = await query
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching conversations:', error);
        return json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    // Get unread message counts
    const conversationIds = conversations?.map(c => c.id) || [];
    const { data: unreadCounts } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds)
        .eq('is_read', false)
        .neq('sender_id', session.user.id);

    // Count unread messages per conversation
    const unreadMap = new Map<string, number>();
    unreadCounts?.forEach(msg => {
        const count = unreadMap.get(msg.conversation_id) || 0;
        unreadMap.set(msg.conversation_id, count + 1);
    });

    // Add unread counts to conversations
    const conversationsWithUnread = conversations?.map(conv => ({
        ...conv,
        unread_count: unreadMap.get(conv.id) || 0,
        last_message: conv.last_message?.[0] || null
    }));

    return json({
        conversations: conversationsWithUnread || [],
        hasMore: conversations?.length === limit
    });
};

export const POST: RequestHandler = async ({ locals, request }) => {
    const supabase = locals.supabase;
    const { session } = await locals.safeGetSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listing_id, message } = await request.json();

    if (!listing_id || !message) {
        return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get listing details
    const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('id, seller_id')
        .eq('id', listing_id)
        .single();

    if (listingError || !listing) {
        return json({ error: 'Listing not found' }, { status: 404 });
    }

    // Determine buyer and seller
    const isBuyer = session.user.id !== listing.seller_id;
    const buyer_id = isBuyer ? session.user.id : null;
    const seller_id = listing.seller_id;

    if (!buyer_id) {
        return json({ error: 'Cannot message your own listing' }, { status: 400 });
    }

    try {
        // Start a transaction
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .upsert({
                listing_id,
                buyer_id,
                seller_id,
                last_message_at: new Date().toISOString()
            }, {
                onConflict: 'listing_id,buyer_id,seller_id',
                ignoreDuplicates: false
            })
            .select()
            .single();

        if (convError) throw convError;

        // Create the initial message
        const { data: newMessage, error: msgError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversation.id,
                sender_id: session.user.id,
                message_text: message,
                is_read: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (msgError) throw msgError;

        // Send email notification to seller (async, don't await to avoid blocking the response)
        try {
            const { emailService } = await import('$lib/server/email');
            
            // Get seller profile
            const { data: sellerProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', seller_id)
                .single();
            
            // Get buyer profile
            const { data: buyerProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', buyer_id)
                .single();
            
            // Get listing details
            const { data: listingDetails } = await supabase
                .from('listings')
                .select('*')
                .eq('id', listing_id)
                .single();
            
            if (sellerProfile && buyerProfile && listingDetails) {
                emailService.sendMessageNotification(
                    sellerProfile,
                    buyerProfile,
                    listingDetails,
                    message,
                    conversation.id
                ).catch(error => {
                    console.error('Failed to send email notification:', error);
                });
            }
        } catch (error) {
            console.error('Failed to load email service:', error);
        }

        return json({
            conversation: conversation,
            message: newMessage
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating conversation:', error);
        return json({ error: 'Failed to create conversation' }, { status: 500 });
    }
};