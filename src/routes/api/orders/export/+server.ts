import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
    const { session } = await locals.safeGetSession();
    
    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const format = url.searchParams.get('format') || 'csv';
    const role = url.searchParams.get('role') || 'all';
    const status = url.searchParams.get('status');
    const dateFrom = url.searchParams.get('from');
    const dateTo = url.searchParams.get('to');
    
    try {
        let query = locals.supabase
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
                        title
                    )
                )
            `);

        // Apply role filter
        if (role === 'buyer') {
            query = query.eq('buyer_id', session.user.id);
        } else if (role === 'seller') {
            query = query.eq('seller_id', session.user.id);
        } else {
            query = query.or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`);
        }

        // Apply status filter
        if (status) {
            query = query.eq('status', status);
        }

        // Apply date filters
        if (dateFrom) {
            query = query.gte('created_at', dateFrom);
        }
        if (dateTo) {
            query = query.lte('created_at', dateTo);
        }

        const { data: orders, error } = await query.order('created_at', { ascending: false });

        if (error) {
            return json({ error: 'Failed to fetch orders' }, { status: 500 });
        }

        if (format === 'csv') {
            const csv = generateCSV(orders);
            return new Response(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename="orders.csv"'
                }
            });
        } else if (format === 'pdf') {
            // For PDF, we'll return JSON with instructions since we don't have a PDF library
            return json({ 
                error: 'PDF export not implemented yet. Please use CSV format.',
                orders: orders.length 
            }, { status: 501 });
        }

        return json({ error: 'Invalid format' }, { status: 400 });
    } catch (error) {
        console.error('Export error:', error);
        return json({ error: 'Export failed' }, { status: 500 });
    }
};

function generateCSV(orders: any[]): string {
    const headers = [
        'Order Number',
        'Status',
        'Total Amount',
        'Buyer',
        'Seller',
        'Items',
        'Created At',
        'Updated At'
    ];

    const rows = orders.map(order => [
        order.order_number,
        order.status,
        (order.total_amount / 100).toFixed(2),
        order.buyer?.username || '',
        order.seller?.username || '',
        order.order_items?.map((item: any) => `${item.listing?.title || 'Unknown'} (${item.quantity})`).join('; ') || '',
        new Date(order.created_at).toLocaleDateString(),
        new Date(order.updated_at).toLocaleDateString()
    ]);

    return [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
}