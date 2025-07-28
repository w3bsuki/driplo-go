import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const supabase = locals.supabase;
	try {
		const { 
			payout_method, 
			revtag, 
			bank_account_name,
			bank_account_number,
			bank_routing_number,
			bank_name,
			paypal_email
		} = await request.json();

		// Check if user is authenticated
		const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = user.id;

		// Validate based on payout method
		if (!payout_method || !['revolut', 'bank_transfer', 'paypal'].includes(payout_method)) {
			return json({ error: 'Invalid payout method' }, { status: 400 });
		}

		// Validate method-specific fields
		if (payout_method === 'revolut') {
			if (!revtag || !revtag.startsWith('@') || !/^@[a-zA-Z0-9_]+$/.test(revtag)) {
				return json({ 
					error: 'Invalid Revtag format. Must start with @ and contain only letters, numbers, and underscores.' 
				}, { status: 400 });
			}
		} else if (payout_method === 'bank_transfer') {
			if (!bank_account_name || !bank_account_number || !bank_routing_number || !bank_name) {
				return json({ error: 'All bank account fields are required' }, { status: 400 });
			}
		} else if (payout_method === 'paypal') {
			if (!paypal_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypal_email)) {
				return json({ error: 'Valid PayPal email is required' }, { status: 400 });
			}
		}

		// Check if user already has a payment account
		const { data: existingAccount } = await supabase
			.from('payment_accounts')
			.select('*')
			.eq('user_id', userId)
			.single();

		if (existingAccount) {
			// Update existing account
			const updateData: any = {
				payout_method,
				verified: false, // Reset verification when details change
				updated_at: new Date().toISOString()
			};

			// Add method-specific fields
			if (payout_method === 'revolut') {
				updateData.revtag = revtag;
				// Clear other method fields
				updateData.bank_account_name = null;
				updateData.bank_account_number = null;
				updateData.bank_routing_number = null;
				updateData.bank_name = null;
				updateData.paypal_email = null;
			} else if (payout_method === 'bank_transfer') {
				updateData.bank_account_name = bank_account_name;
				updateData.bank_account_number = bank_account_number;
				updateData.bank_routing_number = bank_routing_number;
				updateData.bank_name = bank_name;
				// Clear other method fields
				updateData.revtag = null;
				updateData.paypal_email = null;
			} else if (payout_method === 'paypal') {
				updateData.paypal_email = paypal_email;
				// Clear other method fields
				updateData.revtag = null;
				updateData.bank_account_name = null;
				updateData.bank_account_number = null;
				updateData.bank_routing_number = null;
				updateData.bank_name = null;
			}

			const { data: updatedAccount, error: updateError } = await supabase
				.from('payment_accounts')
				.update(updateData)
				.eq('user_id', userId)
				.select()
				.single();

			if (updateError) {
				console.error('Payment account update error:', updateError);
				return json({ error: 'Failed to update payment account' }, { status: 500 });
			}

			return json({
				success: true,
				payment_account: updatedAccount,
				message: 'Payment account updated successfully'
			});
		} else {
			// Create new payment account
			const insertData: any = {
				user_id: userId,
				payout_method,
				verified: false,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};

			// Add method-specific fields
			if (payout_method === 'revolut') {
				insertData.revtag = revtag;
			} else if (payout_method === 'bank_transfer') {
				insertData.bank_account_name = bank_account_name;
				insertData.bank_account_number = bank_account_number;
				insertData.bank_routing_number = bank_routing_number;
				insertData.bank_name = bank_name;
			} else if (payout_method === 'paypal') {
				insertData.paypal_email = paypal_email;
			}

			const { data: newAccount, error: createError } = await supabase
				.from('payment_accounts')
				.insert(insertData)
				.select()
				.single();

			if (createError) {
				console.error('Payment account creation error:', createError);
				return json({ error: 'Failed to create payment account' }, { status: 500 });
			}

			return json({
				success: true,
				payment_account: newAccount,
				message: 'Payment account created successfully'
			});
		}

	} catch (error: any) {
		console.error('Payment account setup error:', error);
		return json({ 
			error: 'Internal server error', 
			details: error.message,
			stack: error.stack 
		}, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ locals }) => {
	const supabase = locals.supabase;
	try {
		// Check if user is authenticated
		const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = user.id;

		// Get user's payment account
		const { data: paymentAccount, error } = await supabase
			.from('payment_accounts')
			.select('*')
			.eq('user_id', userId)
			.single();

		if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
			console.error('Payment account fetch error:', error);
			return json({ error: 'Failed to fetch payment account' }, { status: 500 });
		}

		return json({
			payment_account: paymentAccount || null,
			has_payment_account: !!paymentAccount
		});

	} catch (error) {
		console.error('Payment account fetch error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};