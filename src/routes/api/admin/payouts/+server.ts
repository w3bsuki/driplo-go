import type { RequestHandler } from './$types';
import { 
  apiError, 
  apiSuccess, 
  requireAdmin, 
  parseRequestBody,
  validateUUID,
  getPagination,
  paginatedResponse,
  handleDatabaseError 
} from '$lib/server/api-utils';
import { logAdminAction, AdminActions, ResourceTypes } from '$lib/server/audit';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		// Require admin authentication
		const auth = await requireAdmin(locals);
		if (!auth) {
			return apiError('Admin access required', 403);
		}

		const status = url.searchParams.get('status') || 'all';
		const { page, limit, offset } = getPagination(url);

		// Build query
		let query = locals.supabase
			.from('seller_payouts')
			.select(`
				*,
				transaction:transactions(
					id,
					amount,
					currency,
					status,
					created_at,
					listing:listings(
						id,
						title,
						price,
						images
					),
					buyer:buyer_id(
						id,
						email
					)
				),
				seller:seller_id(
					id,
					email
				)
			`)
			.order('created_at', { ascending: false })
			.range(offset, offset + limit - 1);

		if (status !== 'all') {
			query = query.eq('status', status);
		}

		const { data: payouts, error } = await query;

		if (error) {
			handleDatabaseError(error);
		}

		// Get total count for pagination
		let countQuery = locals.supabase
			.from('seller_payouts')
			.select('*', { count: 'exact', head: true });

		if (status !== 'all') {
			countQuery = countQuery.eq('status', status);
		}

		const { count, error: countError } = await countQuery;

		if (countError) {
			handleDatabaseError(countError);
		}

		return apiSuccess({
			payouts: payouts || [],
			pagination: {
				page,
				limit,
				total: count || 0,
				totalPages: Math.ceil((count || 0) / limit)
			}
		});

	} catch (error) {
		// Check if it's already an API error
		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}
		return apiError('Failed to fetch payouts', 500);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Require admin authentication
		const auth = await requireAdmin(locals);
		if (!auth) {
			return apiError('Admin access required', 403);
		}

		// Parse and validate request
		const body = await parseRequestBody<{ payout_id: string; action: string; notes?: string }>(request);
		const { payout_id, action, notes } = body;

		if (!payout_id || !validateUUID(payout_id)) {
			return apiError('Invalid payout ID', 400);
		}

		if (!action || !['approve', 'reject'].includes(action)) {
			return apiError('Invalid action. Must be "approve" or "reject"', 400);
		}

		const userId = auth.userId;

		if (action === 'approve') {
			// Update payout status to completed
			const { data: updatedPayout, error: payoutError } = await locals.supabase
				.from('seller_payouts')
				.update({
					status: 'completed',
					processed_by: userId,
					processed_at: new Date().toISOString(),
					notes: notes || null,
					updated_at: new Date().toISOString()
				})
				.eq('id', payout_id)
				.select()
				.single();

			if (payoutError) {
				handleDatabaseError(payoutError);
			}

			// Update transaction payout status
			const { error: transactionError } = await locals.supabase
				.from('transactions')
				.update({
					seller_payout_status: 'completed',
					payout_processed_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				})
				.eq('id', updatedPayout.transaction_id);

			if (transactionError) {
				console.error('Transaction update error:', transactionError);
				// Don't fail the request, just log the error
			}

			// Log admin action
			await logAdminAction(locals.supabase, {
				action: AdminActions.PAYOUT_APPROVE,
				resourceType: ResourceTypes.PAYOUT,
				resourceId: payout_id,
				details: {
					amount: updatedPayout.amount,
					seller_id: updatedPayout.seller_id,
					transaction_id: updatedPayout.transaction_id,
					notes
				}
			});

			return apiSuccess({
				payout: updatedPayout,
				message: 'Payout approved successfully'
			});

		} else if (action === 'reject') {
			// Update payout status to failed
			const { data: updatedPayout, error: payoutError } = await locals.supabase
				.from('seller_payouts')
				.update({
					status: 'failed',
					processed_by: userId,
					processed_at: new Date().toISOString(),
					notes: notes || null,
					updated_at: new Date().toISOString()
				})
				.eq('id', payout_id)
				.select()
				.single();

			if (payoutError) {
				handleDatabaseError(payoutError);
			}

			// Update transaction payout status
			const { error: transactionError } = await locals.supabase
				.from('transactions')
				.update({
					seller_payout_status: 'failed',
					updated_at: new Date().toISOString()
				})
				.eq('id', updatedPayout.transaction_id);

			if (transactionError) {
				console.error('Transaction update error:', transactionError);
				// Don't fail the request, just log the error
			}

			// Log admin action
			await logAdminAction(locals.supabase, {
				action: AdminActions.PAYOUT_REJECT,
				resourceType: ResourceTypes.PAYOUT,
				resourceId: payout_id,
				details: {
					amount: updatedPayout.amount,
					seller_id: updatedPayout.seller_id,
					transaction_id: updatedPayout.transaction_id,
					notes
				}
			});

			return apiSuccess({
				payout: updatedPayout,
				message: 'Payout rejected successfully'
			});

		}

	} catch (error) {
		// Check if it's already an API error
		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}
		return apiError('Failed to process payout action', 500);
	}
};