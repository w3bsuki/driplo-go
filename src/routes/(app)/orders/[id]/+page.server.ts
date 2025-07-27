import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
    const { session } = await locals.safeGetSession();
    
    if (!session) {
        redirect(302, '/login');
    }

    const orderId = params.id;
    
    if (!orderId) {
        error(404, 'Order not found');
    }

    // Load order data server-side for better performance and SEO
    const { data: order, error: orderError } = await locals.supabase
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

    if (orderError || !order) {
        error(404, 'Order not found or access denied');
    }

    return {
        order,
        session
    };
};