import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = await locals.safeGetSession();
	
	if (!session) {
		throw redirect(303, '/login');
	}

	const userId = session.user.id;

	// Get user's orders (both as buyer and seller)
	const { data: orders, error } = await locals.supabase
		.from('transactions')
		.select(`
			*,
			listing:listings (
				id,
				title,
				price,
				images,
				condition,
				size
			),
			buyer:profiles!buyer_id (
				username,
				avatar_url
			),
			seller:profiles!seller_id (
				username,
				avatar_url
			)
		`)
		.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error loading orders:', error);
		return {
			orders: []
		};
	}

	return {
		orders: orders || []
	};
};