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
                amount,
                platform_fee,
                seller_amount
            )
        `)
        .eq('id', orderId)
        .single();

    if (orderError || !order) {
        return json({ error: 'Order not found' }, { status: 404 });
    }

    // Check permissions - only buyer can mark as delivered
    if (session.user.id !== order.buyer_id) {
        return json({ error: 'Only the buyer can mark an order as delivered' }, { status: 403 });
    }

    // Check if order can be completed
    if (order.status !== 'shipped') {
        return json({ error: 'Order must be shipped before it can be marked as delivered' }, { status: 400 });
    }

    try {
        // Update order status to delivered
        await supabase.rpc('update_order_status', {
            p_order_id: orderId,
            p_new_status: 'delivered',
            p_user_id: session.user.id,
            p_reason: reason || 'Order delivered and confirmed by buyer',
            p_metadata: {
                delivered_by: 'buyer'
            }
        });

        // Update order with delivery details
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                status: 'delivered',
                delivered_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (updateError) throw updateError;

        // Add shipping event for delivery confirmation
        await supabase
            .from('shipping_events')
            .insert({
                order_id: orderId,
                event_type: 'delivered',
                event_description: 'Package delivered and confirmed by buyer',
                location: 'Destination',
                carrier_data: {
                    confirmed_by: 'buyer'
                }
            });

        // Create payout for seller if transaction exists
        if (order.transaction && order.transaction.seller_amount) {
            const payoutAmount = order.transaction.seller_amount;
            
            // Create payout record
            await supabase
                .from('payouts')
                .insert({
                    seller_id: order.seller_id,
                    order_id: orderId,
                    transaction_id: order.transaction.id,
                    amount: payoutAmount,
                    currency: 'usd',
                    status: 'pending',
                    description: `Payout for order #${order.order_number}`,
                    scheduled_for: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days delay
                });

            // Update transaction to mark as ready for payout
            await supabase
                .from('transactions')
                .update({
                    status: 'completed',
                    payout_eligible_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', order.transaction.id);
        }

        // TODO: Send email notifications when email service is configured

        return json({ 
            success: true,
            message: 'Order marked as delivered successfully',
            payout_scheduled: !!order.transaction
        });
    } catch (error) {
        console.error('Error completing order:', error);
        return json({ error: 'Failed to complete order' }, { status: 500 });
    }
};