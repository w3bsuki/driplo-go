import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, params, request }) => {
    const supabase = locals.supabase;
    const { session } = await locals.safeGetSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = params.id;
    const { reason } = await request.json();

    // Get order details
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
            *,
            buyer:profiles!orders_buyer_id_fkey (
                id,
                username,
                email
            ),
            seller:profiles!orders_seller_id_fkey (
                id,
                username,
                email
            ),
            order_items (
                *,
                listing:listings (
                    id,
                    title,
                    seller_id
                )
            ),
            transaction:transactions (
                id,
                stripe_payment_intent_id,
                stripe_charge_id,
                amount
            )
        `)
        .eq('id', orderId)
        .single();

    if (orderError || !order) {
        return json({ error: 'Order not found' }, { status: 404 });
    }

    // Check permissions - buyer or seller can cancel
    if (session.user.id !== order.buyer_id && session.user.id !== order.seller_id) {
        return json({ error: 'Not authorized to cancel this order' }, { status: 403 });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed', 'processing'].includes(order.status)) {
        return json({ error: 'Order cannot be cancelled in current status' }, { status: 400 });
    }

    try {
        // Update order status to cancelled
        await supabase.rpc('update_order_status', {
            p_order_id: orderId,
            p_new_status: 'cancelled',
            p_user_id: session.user.id,
            p_reason: reason || 'Order cancelled',
            p_metadata: {
                cancelled_by: session.user.id === order.buyer_id ? 'buyer' : 'seller'
            }
        });

        // Update order with cancellation details
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                cancellation_reason: reason,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (updateError) throw updateError;

        // If order had a transaction, initiate refund
        if (order.transaction && order.transaction.stripe_payment_intent_id) {
            // Note: This would require Stripe integration for actual refunds
            // For now, we'll just mark it as needing refund processing
            await supabase
                .from('transactions')
                .update({
                    status: 'refund_pending',
                    refund_reason: reason || 'Order cancelled',
                    updated_at: new Date().toISOString()
                })
                .eq('id', order.transaction.id);
        }

        // Restore listing availability if items were reserved
        for (const item of order.order_items) {
            if (item.listing && item.listing.seller_id === order.seller_id) {
                await supabase.rpc('increment_listing_quantity', {
                    listing_id: item.listing.id,
                    quantity_increment: item.quantity
                });
            }
        }

        // TODO: Send email notifications when email service is configured

        return json({ 
            success: true,
            message: 'Order cancelled successfully',
            refund_required: !!order.transaction
        });
    } catch (error) {
        console.error('Error cancelling order:', error);
        return json({ error: 'Failed to cancel order' }, { status: 500 });
    }
};