import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { emailService } from '$lib/server/email';

export const POST: RequestHandler = async ({ request, locals }) => {
	const supabase = locals.supabase;
	try {
		const { transaction_id, tracking_number } = await request.json();

		// Check if user is authenticated with secure validation
		const { data: { session } } = await locals.supabase.auth.getSession();
		if (!session) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Validate the JWT by calling getUser()
		const { data: { user }, error: userError } = await locals.supabase.auth.getUser();
		if (userError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = user.id;

		// Get transaction details and verify seller
		const { data: transaction, error: transactionError } = await supabase
			.from('transactions')
			.select('*')
			.eq('id', transaction_id)
			.eq('seller_id', userId)
			.single();

		if (transactionError || !transaction) {
			return json({ error: 'Transaction not found or unauthorized' }, { status: 404 });
		}

		// Check if transaction is paid
		if (transaction.status !== 'paid') {
			return json({ error: 'Transaction must be paid before marking as shipped' }, { status: 400 });
		}

		// Check if already shipped
		if (transaction.item_shipped_at) {
			return json({ error: 'Item already marked as shipped' }, { status: 400 });
		}

		// Update transaction to mark as shipped
		const { data: updatedTransaction, error: updateError } = await supabase
			.from('transactions')
			.update({
				item_shipped_at: new Date().toISOString(),
				seller_payout_status: 'processing',
				updated_at: new Date().toISOString()
			})
			.eq('id', transaction_id)
			.select()
			.single();

		if (updateError) {
			console.error('Transaction update error:', updateError);
			return json({ error: 'Failed to update transaction' }, { status: 500 });
		}

		// Update seller payout status
		const { error: payoutUpdateError } = await supabase
			.from('seller_payouts')
			.update({
				status: 'processing',
				updated_at: new Date().toISOString()
			})
			.eq('transaction_id', transaction_id);

		if (payoutUpdateError) {
			console.error('Payout update error:', payoutUpdateError);
			// Don't fail the request, just log the error
		}

		// Mark listing as sold
		const { error: listingError } = await supabase
			.from('listings')
			.update({
				status: 'sold',
				sold_at: new Date().toISOString()
			})
			.eq('id', transaction.listing_id);

		if (listingError) {
			console.error('Listing update error:', listingError);
			// Don't fail the request, just log the error
		}

		// Get buyer and listing details for shipping email
		const { data: shippingData } = await supabase
			.from('transactions')
			.select(`
				*,
				buyer:buyer_id(id, username, email),
				listing:listing_id(id, title, price)
			`)
			.eq('id', transaction_id)
			.single();

		if (shippingData && shippingData.buyer && shippingData.listing) {
			await emailService.sendShippingUpdate(
				shippingData.buyer,
				shippingData.listing,
				tracking_number
			);
		}

		return json({
			success: true,
			transaction: updatedTransaction,
			message: 'Item marked as shipped successfully. Payout will be processed by admin.'
		});

	} catch (error) {
		console.error('Mark shipped error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};