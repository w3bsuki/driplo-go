import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
    const supabase = locals.supabase;
    const { session } = await locals.safeGetSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = params.id;

    const { data: order, error } = await supabase
        .from('orders')
        .select(`
            *,
            buyer:profiles!orders_buyer_id_fkey (
                id,
                username,
                email,
                avatar_url
            ),
            seller:profiles!orders_seller_id_fkey (
                id,
                username,
                email,
                avatar_url
            ),
            order_items (
                *,
                listing:listings (
                    id,
                    title,
                    images,
                    seller_id
                )
            ),
            transaction:transactions (
                id,
                stripe_payment_intent_id,
                stripe_charge_id,
                amount
            ),
            status_history:order_status_history (
                *,
                changed_by_user:profiles!order_status_history_changed_by_fkey (
                    username
                )
            ),
            shipping_events (
                *
            ),
            disputes (
                *,
                initiated_by_user:profiles!disputes_initiated_by_fkey (
                    username
                )
            )
        `)
        .eq('id', orderId)
        .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)
        .single();

    if (error || !order) {
        return json({ error: 'Order not found' }, { status: 404 });
    }

    return json({ order });
};

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
    const supabase = locals.supabase;
    const { session } = await locals.safeGetSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = params.id;
    const updates = await request.json();

    // Verify user has permission to update this order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('buyer_id, seller_id, status')
        .eq('id', orderId)
        .single();

    if (orderError || !order) {
        return json({ error: 'Order not found' }, { status: 404 });
    }

    // Only seller can update certain fields
    if (session.user.id !== order.seller_id) {
        return json({ error: 'Only seller can update order' }, { status: 403 });
    }

    try {
        // Handle status updates separately
        if (updates.status) {
            await supabase.rpc('update_order_status', {
                p_order_id: orderId,
                p_new_status: updates.status,
                p_user_id: session.user.id,
                p_reason: updates.status_reason || null,
                p_metadata: updates.status_metadata || null
            });
        }

        // Update other allowed fields
        const allowedUpdates: any = {};
        const allowedFields = ['shipping_carrier', 'tracking_number', 'shipping_label_url', 'notes'];
        
        for (const field of allowedFields) {
            if (field in updates) {
                allowedUpdates[field] = updates[field];
            }
        }

        if (Object.keys(allowedUpdates).length > 0) {
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    ...allowedUpdates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId);

            if (updateError) throw updateError;
        }

        // Fetch updated order
        const { data: updatedOrder, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (fetchError) throw fetchError;

        return json({ order: updatedOrder });
    } catch (error) {
        console.error('Error updating order:', error);
        return json({ error: 'Failed to update order' }, { status: 500 });
    }
};