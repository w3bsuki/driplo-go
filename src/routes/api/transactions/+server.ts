import type { RequestHandler } from './$types';
import { apiSuccess, apiError, requireAuth, getPagination } from '$lib/server/api-utils';

export const GET: RequestHandler = async ({ url, locals }) => {
    try {
        // Check authentication
        const auth = await requireAuth(locals);
        if (!auth) {
            return apiError('Authentication required', 401);
        }

        const { page, limit, offset } = getPagination(url);
        const role = url.searchParams.get('role') || 'all';
        const status = url.searchParams.get('status');
        const dateFrom = url.searchParams.get('from');
        const dateTo = url.searchParams.get('to');

        // Build query
        let query = locals.supabase
            .from('transactions')
            .select(`
                *,
                listing:listings!inner(
                    id,
                    title,
                    images,
                    price
                ),
                buyer:profiles!transactions_buyer_id_fkey(
                    id,
                    username,
                    avatar_url
                ),
                seller:profiles!transactions_seller_id_fkey(
                    id,
                    username,
                    avatar_url
                )
            `, { count: 'exact' });

        // Apply role filter
        if (role === 'buyer') {
            query = query.eq('buyer_id', auth.userId);
        } else if (role === 'seller') {
            query = query.eq('seller_id', auth.userId);
        } else {
            // For 'all', show transactions where user is either buyer or seller
            query = query.or(`buyer_id.eq.${auth.userId},seller_id.eq.${auth.userId}`);
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
            // Add one day to include the entire end date
            const endDate = new Date(dateTo);
            endDate.setDate(endDate.getDate() + 1);
            query = query.lt('created_at', endDate.toISOString());
        }

        // Apply pagination and ordering
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data: transactions, error, count } = await query;

        if (error) {
            console.error('Error fetching transactions:', error);
            return apiError('Failed to fetch transactions', 500);
        }

        return apiSuccess({
            data: transactions || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                hasMore: (count || 0) > offset + limit
            }
        });

    } catch (error) {
        console.error('Transactions API error:', error);
        return apiError('Internal server error', 500);
    }
};