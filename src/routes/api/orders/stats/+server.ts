import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
    const { session } = await locals.safeGetSession();
    
    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = url.searchParams.get('role') || 'all';
    
    try {
        let buyerFilter = '';
        let sellerFilter = '';
        
        if (role === 'buyer') {
            buyerFilter = `buyer_id.eq.${session.user.id}`;
        } else if (role === 'seller') {
            sellerFilter = `seller_id.eq.${session.user.id}`;
        } else {
            buyerFilter = `buyer_id.eq.${session.user.id}`;
            sellerFilter = `seller_id.eq.${session.user.id}`;
        }

        // Get order counts by status
        const { data: statusCounts, error: statusError } = await locals.supabase
            .from('orders')
            .select('status')
            .or(role === 'all' ? `${buyerFilter},${sellerFilter}` : 
                role === 'buyer' ? buyerFilter : sellerFilter);

        if (statusError) throw statusError;

        // Get total revenue (for sellers)
        const { data: revenueData, error: revenueError } = await locals.supabase
            .from('orders')
            .select('total_amount, status')
            .eq('seller_id', session.user.id)
            .in('status', ['delivered', 'shipped']);

        if (revenueError) throw revenueError;

        // Get recent orders
        const { data: recentOrders, error: recentError } = await locals.supabase
            .from('orders')
            .select(`
                id,
                order_number,
                status,
                total_amount,
                created_at,
                buyer:profiles!orders_buyer_id_fkey (username),
                seller:profiles!orders_seller_id_fkey (username)
            `)
            .or(role === 'all' ? `${buyerFilter},${sellerFilter}` : 
                role === 'buyer' ? buyerFilter : sellerFilter)
            .order('created_at', { ascending: false })
            .limit(5);

        if (recentError) throw recentError;

        // Calculate statistics
        const stats = {
            totalOrders: statusCounts?.length || 0,
            ordersByStatus: statusCounts?.reduce((acc: any, order: any) => {
                acc[order.status] = (acc[order.status] || 0) + 1;
                return acc;
            }, {}) || {},
            totalRevenue: revenueData?.reduce((sum: number, order: any) => sum + order.total_amount, 0) || 0,
            averageOrderValue: revenueData?.length ? 
                (revenueData.reduce((sum: number, order: any) => sum + order.total_amount, 0) / revenueData.length) : 0,
            recentOrders: recentOrders || []
        };

        // Get monthly trends (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const { data: monthlyData, error: monthlyError } = await locals.supabase
            .from('orders')
            .select('created_at, total_amount, status')
            .or(role === 'all' ? `${buyerFilter},${sellerFilter}` : 
                role === 'buyer' ? buyerFilter : sellerFilter)
            .gte('created_at', sixMonthsAgo.toISOString());

        if (monthlyError) throw monthlyError;

        // Group by month
        const monthlyStats = monthlyData?.reduce((acc: any, order: any) => {
            const month = new Date(order.created_at).toISOString().substring(0, 7);
            if (!acc[month]) {
                acc[month] = { orders: 0, revenue: 0 };
            }
            acc[month].orders++;
            acc[month].revenue += order.total_amount;
            return acc;
        }, {}) || {};

        stats.monthlyTrends = Object.keys(monthlyStats)
            .sort()
            .map(month => ({
                month,
                orders: monthlyStats[month].orders,
                revenue: monthlyStats[month].revenue
            }));

        return json(stats);
    } catch (error) {
        console.error('Error fetching order statistics:', error);
        return json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }
};