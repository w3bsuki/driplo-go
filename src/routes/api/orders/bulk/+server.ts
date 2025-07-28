import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
    const { session } = await locals.safeGetSession();
    
    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, orderIds } = await request.json();

    if (!action || !Array.isArray(orderIds) || orderIds.length === 0) {
        return json({ error: 'Invalid request' }, { status: 400 });
    }

    try {
        let successCount = 0;
        let failureCount = 0;
        const results = [];

        for (const orderId of orderIds) {
            try {
                // Verify user has permission to perform this action on this order
                const { data: order, error: orderError } = await locals.supabase
                    .from('orders')
                    .select('id, status, seller_id, buyer_id')
                    .eq('id', orderId)
                    .single();

                if (orderError || !order) {
                    failureCount++;
                    results.push({ orderId, error: 'Order not found' });
                    continue;
                }

                // Check permissions based on action
                if (action === 'mark_shipped' && session.user.id !== order.seller_id) {
                    failureCount++;
                    results.push({ orderId, error: 'Only seller can mark as shipped' });
                    continue;
                }

                if (action === 'cancel' && session.user.id !== order.seller_id && session.user.id !== order.buyer_id) {
                    failureCount++;
                    results.push({ orderId, error: 'Not authorized to cancel this order' });
                    continue;
                }

                // Perform the action
                if (action === 'mark_shipped') {
                    if (!['confirmed', 'processing'].includes(order.status)) {
                        failureCount++;
                        results.push({ orderId, error: 'Order cannot be shipped in current status' });
                        continue;
                    }

                    // Update order status to shipped
                    await locals.supabase.rpc('update_order_status', {
                        p_order_id: orderId,
                        p_new_status: 'shipped',
                        p_user_id: session.user.id,
                        p_reason: 'Bulk action: marked as shipped',
                        p_metadata: { bulk_action: true }
                    });

                    // Update order with shipped timestamp
                    await locals.supabase
                        .from('orders')
                        .update({
                            shipped_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', orderId);

                    successCount++;
                    results.push({ orderId, success: true });

                } else if (action === 'cancel') {
                    if (!['pending', 'confirmed', 'processing'].includes(order.status)) {
                        failureCount++;
                        results.push({ orderId, error: 'Order cannot be cancelled in current status' });
                        continue;
                    }

                    // Update order status to cancelled
                    await locals.supabase.rpc('update_order_status', {
                        p_order_id: orderId,
                        p_new_status: 'cancelled',
                        p_user_id: session.user.id,
                        p_reason: 'Bulk action: cancelled',
                        p_metadata: { bulk_action: true }
                    });

                    // Update order with cancellation details
                    await locals.supabase
                        .from('orders')
                        .update({
                            status: 'cancelled',
                            cancelled_at: new Date().toISOString(),
                            cancellation_reason: 'Bulk cancellation',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', orderId);

                    successCount++;
                    results.push({ orderId, success: true });
                }

            } catch (error) {
                failureCount++;
                results.push({ orderId, error: 'Processing failed' });
                console.error(`Error processing order ${orderId}:`, error);
            }
        }

        return json({
            success: true,
            message: `Bulk action completed: ${successCount} succeeded, ${failureCount} failed`,
            successCount,
            failureCount,
            results
        });

    } catch (error) {
        console.error('Bulk action error:', error);
        return json({ error: 'Bulk action failed' }, { status: 500 });
    }
};