import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();
	
	if (!user) {
		redirect(303, '/login');
	}

	// Check if user is a brand
	const { data: profile } = await supabase
		.from('profiles')
		.select('account_type')
		.eq('id', user.id)
		.single();

	if (!profile || profile?.account_type !== 'brand') {
		error(403, 'Access denied. Brand account required.');
	}

	// Get brand profile
	const { data: brandProfile } = await supabase
		.from('brand_profiles')
		.select('*')
		.eq('user_id', user.id)
		.single();

	if (!brandProfile) {
		redirect(303, '/brands/settings');
	}

	// Fetch analytics data
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	// Get orders/sales
	const { data: orders } = await supabase
		.from('orders')
		.select(`
			*,
			buyer:profiles!orders_buyer_id_fkey (
				username,
				full_name,
				avatar_url
			),
			listing:listings (
				title,
				price,
				images:listing_images (
					image_url
				)
			)
		`)
		.eq('seller_id', user.id)
		.order('created_at', { ascending: false })
		.limit(20);

	// Get sales stats
	const { data: salesStats } = await supabase
		.rpc('get_brand_sales_stats', {
			user_id_param: user.id,
			start_date: thirtyDaysAgo.toISOString()
		});

	// Get listing performance
	const { data: listingStats } = await supabase
		.from('listings')
		.select('id, title, price, views, favorites_count, status')
		.eq('user_id', user.id)
		.order('views', { ascending: false })
		.limit(10);

	// Get review stats
	const { data: reviewStats } = await supabase
		.from('reviews')
		.select('rating')
		.eq('seller_id', user.id);

	const avgRating = reviewStats?.length 
		? reviewStats.reduce((sum, r) => sum + r.rating, 0) / reviewStats.length 
		: 0;

	const ratingDistribution = {
		5: reviewStats?.filter(r => r.rating === 5).length || 0,
		4: reviewStats?.filter(r => r.rating === 4).length || 0,
		3: reviewStats?.filter(r => r.rating === 3).length || 0,
		2: reviewStats?.filter(r => r.rating === 2).length || 0,
		1: reviewStats?.filter(r => r.rating === 1).length || 0
	};

	return {
		brandProfile,
		orders: orders || [],
		salesStats: salesStats?.[0] || {
			total_sales: 0,
			total_revenue: 0,
			avg_order_value: 0,
			total_orders: 0
		},
		listingStats: listingStats || [],
		reviewStats: {
			totalReviews: reviewStats?.length || 0,
			averageRating: avgRating,
			distribution: ratingDistribution
		}
	};
};