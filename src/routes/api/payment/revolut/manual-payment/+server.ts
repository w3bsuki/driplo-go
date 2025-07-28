import type { RequestHandler } from './$types';
import { apiError, apiSuccess, ApiErrorType, requireAuth, validateRequest, ApiError } from '$lib/server/api-utils';
import { z } from 'zod';

const createPaymentSchema = z.object({
	listing_id: z.string().uuid()
});

export const POST: RequestHandler = async ({ request, locals }) => {
	const requestId = crypto.randomUUID();
	
	try {
		// Check authentication
		const auth = await requireAuth(locals);
		if (!auth) {
			return apiError('Unauthorized', 401, ApiErrorType.AUTHENTICATION, undefined, requestId);
		}
		
		// Validate request body
		const { listing_id } = await validateRequest(request, createPaymentSchema);

		// Get listing details
		const { data: listing, error: listingError } = await locals.supabase
			.from('listings')
			.select('*')
			.eq('id', listing_id)
			.single();

		if (listingError || !listing) {
			return apiError('Listing not found', 404, ApiErrorType.NOT_FOUND, undefined, requestId);
		}

		// Check if user is not buying their own item
		if (listing.seller_id === auth.userId) {
			return apiError(
				'Cannot buy your own item',
				400,
				ApiErrorType.VALIDATION,
				{ reason: 'self_purchase' },
				requestId
			);
		}

		// Get seller's payment account (optional - we'll contact them later for payout)
		const { data: sellerPaymentAccount, error: paymentError } = await locals.supabase
			.from('payment_accounts')
			.select('*')
			.eq('user_id', listing.seller_id)
			.single();

		// If seller doesn't have payment account, we'll handle it during payout
		// Payment still goes to platform account for buyer protection

		// Calculate marketplace fees
		const itemPrice = listing.price;
		const shippingPrice = listing.shipping_cost || 0;
		const subtotal = itemPrice + shippingPrice;
		
		// Buyer protection fee: 5% + $1.00
		const buyerFeePercentage = 5.0;
		const buyerFeeFixed = 1.00;
		const buyerFeeAmount = (subtotal * buyerFeePercentage / 100) + buyerFeeFixed;
		
		// Total amount buyer pays
		const totalAmount = subtotal + buyerFeeAmount;
		
		// Amount seller will receive (full item price + shipping)
		const sellerPayoutAmount = subtotal;

		// Generate unique order reference
		const orderRef = `DRIPLO-${Date.now()}-${listing_id.slice(-4)}`;

		// Create transaction record with escrow system
		const { data: transaction, error: transactionError } = await locals.supabase
			.from('transactions')
			.insert({
				id: orderRef,
				listing_id: listing_id,
				buyer_id: auth.userId,
				seller_id: listing.seller_id,
				amount: subtotal,
				currency: 'USD',
				status: 'pending',
				payment_method: 'revolut_manual',
				seller_revtag_encrypted: sellerPaymentAccount?.revtag || null, // Store encrypted in production
				buyer_fee_amount: buyerFeeAmount,
				buyer_fee_percentage: buyerFeePercentage,
				platform_fee_amount: buyerFeeAmount, // Platform keeps the buyer fee
				seller_payout_amount: sellerPayoutAmount,
				seller_payout_status: 'pending',
				created_at: new Date().toISOString(),
			})
			.select()
			.single();

		if (transactionError) {
			return apiError(
				'Failed to create transaction',
				500,
				ApiErrorType.DATABASE,
				undefined,
				requestId
			);
		}

		// Create seller payout record for admin tracking
		const { error: payoutError } = await locals.supabase
			.from('seller_payouts')
			.insert({
				transaction_id: orderRef,
				seller_id: listing.seller_id,
				amount: sellerPayoutAmount,
				seller_revtag: sellerPaymentAccount?.revtag || 'NOT_SET', // Will be updated when seller sets up account
				status: 'pending',
				created_at: new Date().toISOString(),
			});

		if (payoutError) {
			// Don't fail the transaction, just log the error
			console.warn(`[${requestId}] Payout record creation warning:`, payoutError.message);
		}

		return apiSuccess({
			transaction_id: transaction.id,
			order_reference: orderRef,
			item_price: itemPrice,
			shipping_cost: shippingPrice,
			subtotal: subtotal,
			buyer_fee: buyerFeeAmount,
			total_amount: totalAmount,
			currency: 'USD',
			fee_breakdown: {
				buyer_fee_percentage: buyerFeePercentage,
				buyer_fee_fixed: buyerFeeFixed,
				buyer_fee_total: buyerFeeAmount
			},
			payment_instructions: {
				// TODO: Replace with proper business payment solution
				error: "Manual payments temporarily disabled - payment integration pending",
				reference: orderRef
			},
		}, 201, requestId);

	} catch (error) {
		if (error instanceof ApiError) {
			return apiError(error.message, error.status, error.type, error.details, requestId);
		}
		return apiError(
			'Failed to create payment',
			500,
			ApiErrorType.INTERNAL,
			undefined,
			requestId
		);
	}
};

const confirmPaymentSchema = z.object({
	transaction_id: z.string()
});

// Endpoint to confirm manual payment
export const PATCH: RequestHandler = async ({ request, locals }) => {
	const requestId = crypto.randomUUID();
	
	try {
		// Check authentication
		const auth = await requireAuth(locals);
		if (!auth) {
			return apiError('Unauthorized', 401, ApiErrorType.AUTHENTICATION, undefined, requestId);
		}
		
		// Validate request body
		const { transaction_id } = await validateRequest(request, confirmPaymentSchema);

		// Update transaction with proof of payment
		const { data: transaction, error: updateError } = await locals.supabase
			.from('transactions')
			.update({
				status: 'payment_submitted', // Status indicating payment proof submitted
				updated_at: new Date().toISOString(),
			})
			.eq('id', transaction_id)
			.eq('buyer_id', auth.userId) // Ensure user can only update their own transactions
			.select()
			.single();

		if (updateError || !transaction) {
			return apiError(
				'Transaction not found or access denied',
				404,
				ApiErrorType.NOT_FOUND,
				undefined,
				requestId
			);
		}

		return apiSuccess({
			success: true,
			transaction_id: transaction.id,
			status: 'payment_submitted',
			message: 'Payment proof submitted successfully. We will verify and confirm your order.',
		}, 200, requestId);

	} catch (error) {
		if (error instanceof ApiError) {
			return apiError(error.message, error.status, error.type, error.details, requestId);
		}
		return apiError(
			'Failed to confirm payment',
			500,
			ApiErrorType.INTERNAL,
			undefined,
			requestId
		);
	}
};