import type { RequestHandler } from './$types';
import { apiError, apiSuccess, ApiErrorType, requireAuth, validateRequest, getPagination } from '$lib/server/api-utils';
import { z } from 'zod';
import type { OrderResponse, OrderCreateRequest } from '$lib/types/api.types';

const orderFiltersSchema = z.object({
    status: z.string().optional(),
    role: z.enum(['buyer', 'seller']).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional()
});

export const GET: RequestHandler = async ({ locals, url }) => {
    const requestId = crypto.randomUUID();
    
    try {
        // Check authentication
        const auth = await requireAuth(locals);
        if (!auth) {
            return apiError('Unauthorized', 401, ApiErrorType.AUTHENTICATION, undefined, requestId);
        }

        // Get pagination
        const { page, limit } = getPagination(url, 20);
        const offset = (page - 1) * limit;
        
        // Validate filters
        const filters = orderFiltersSchema.parse({
            status: url.searchParams.get('status'),
            role: url.searchParams.get('role'),
            dateFrom: url.searchParams.get('from'),
            dateTo: url.searchParams.get('to')
        });

        let query = locals.supabase
        .from('orders')
        .select(`
            *,
            buyer:profiles!orders_buyer_id_fkey (
                id,
                username,
                avatar_url
            ),
            seller:profiles!orders_seller_id_fkey (
                id,
                username,
                avatar_url
            ),
            order_items (
                *,
                listing:listings (
                    id,
                    title,
                    images
                )
            ),
            transaction:transactions (
                id,
                stripe_payment_intent_id,
                stripe_charge_id
            )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

        // Filter by role
        if (filters.role === 'buyer') {
            query = query.eq('buyer_id', auth.userId);
        } else if (filters.role === 'seller') {
            query = query.eq('seller_id', auth.userId);
        } else {
            query = query.or(`buyer_id.eq.${auth.userId},seller_id.eq.${auth.userId}`);
        }

        // Filter by status
        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        // Filter by date range
        if (filters.dateFrom) {
            query = query.gte('created_at', filters.dateFrom);
        }
        if (filters.dateTo) {
            query = query.lte('created_at', filters.dateTo + 'T23:59:59.999Z');
        }

        const { data: orders, error } = await query;

        if (error) {
            return apiError(
                'Failed to fetch orders',
                500,
                ApiErrorType.DATABASE,
                undefined,
                requestId
            );
        }

        return apiSuccess({
            orders: orders || [],
            pagination: {
                page,
                limit,
                total: -1, // Would need count query
                hasMore: orders?.length === limit,
                nextPage: orders?.length === limit ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null
            }
        }, 200, requestId);
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

const createOrderSchema = z.object({
    listing_id: z.string().uuid(),
    transaction_id: z.string().uuid(),
    shipping_address: z.object({
        line1: z.string().min(1),
        line2: z.string().optional(),
        city: z.string().min(1),
        state: z.string().min(1),
        postal_code: z.string().min(1),
        country: z.string().min(1)
    }),
    shipping_method: z.string().optional().default('standard')
});

export const POST: RequestHandler = async ({ locals, request }) => {
    const requestId = crypto.randomUUID();
    
    try {
        // Check authentication
        const auth = await requireAuth(locals);
        if (!auth) {
            return apiError('Unauthorized', 401, ApiErrorType.AUTHENTICATION, undefined, requestId);
        }
        
        // Validate request body
        const data = await validateRequest(request, createOrderSchema);

        // Get listing and transaction details
        const [listingResult, transactionResult] = await Promise.all([
            locals.supabase
                .from('listings')
                .select('*, seller:profiles!listings_seller_id_fkey(id, username, email)')
                .eq('id', data.listing_id)
                .single(),
            locals.supabase
                .from('transactions')
                .select('*')
                .eq('id', data.transaction_id)
                .eq('buyer_id', auth.userId)
                .single()
        ]);

        if (listingResult.error || !listingResult.data) {
            return apiError('Listing not found', 404, ApiErrorType.NOT_FOUND, undefined, requestId);
        }

        if (transactionResult.error || !transactionResult.data) {
            return apiError('Transaction not found', 404, ApiErrorType.NOT_FOUND, undefined, requestId);
        }

        const listing = listingResult.data;
        const transaction = transactionResult.data;

        // Generate order number
        const { data: orderNumber } = await locals.supabase.rpc('generate_order_number');

        // Calculate totals
        const subtotal = listing.price;
        const shipping_cost = listing.shipping_cost || 0;
        const total_amount = subtotal + shipping_cost;

        // Create order
        const { data: order, error: orderError } = await locals.supabase
            .from('orders')
            .insert({
                order_number: orderNumber,
                buyer_id: auth.userId,
                seller_id: listing.seller_id,
                transaction_id: data.transaction_id,
                status: 'confirmed',
                shipping_address: data.shipping_address,
                shipping_method: data.shipping_method,
                subtotal,
                shipping_cost,
                tax_amount: 0,
                total_amount,
                confirmed_at: new Date().toISOString()
            })
            .select()
            .single();

        if (orderError) {
            return apiError(
                'Failed to create order',
                500,
                ApiErrorType.DATABASE,
                undefined,
                requestId
            );
        }

        // Create order item
        const { error: itemError } = await locals.supabase
            .from('order_items')
            .insert({
                order_id: order.id,
                listing_id: listing.id,
                quantity: 1,
                price: listing.price,
                total: listing.price,
                item_snapshot: {
                    title: listing.title,
                    description: listing.description,
                    images: listing.images,
                    size: listing.size,
                    condition: listing.condition,
                    brand: listing.brand
                }
            });

        if (itemError) {
            return apiError(
                'Failed to create order item',
                500,
                ApiErrorType.DATABASE,
                undefined,
                requestId
            );
        }

        // Add status history entry
        await locals.supabase
            .from('order_status_history')
            .insert({
                order_id: order.id,
                to_status: 'confirmed',
                changed_by: auth.userId,
                reason: 'Order placed successfully'
            });

        // Update listing status to sold
        await locals.supabase
            .from('listings')
            .update({ status: 'sold' })
            .eq('id', data.listing_id);

        const response: OrderResponse = order;
        return apiSuccess(response, 201, requestId);
    } catch (error) {
        if (error instanceof ApiError) {
            return apiError(error.message, error.status, error.type, error.details, requestId);
        }
        return apiError(
            'Failed to create order',
            500,
            ApiErrorType.INTERNAL,
            undefined,
            requestId
        );
    }
};