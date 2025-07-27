import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { slug } = params;

	// Fetch brand profile
	const { data: brandProfile, error: brandError } = await supabase
		.from('brand_profiles')
		.select('*')
		.eq('brand_slug', slug)
		.single();

	if (brandError || !brandProfile) {
		console.error('Brand fetch error:', brandError);
		error(404, 'Brand not found');
	}

	// Fetch user profile separately
	const { data: userProfile, error: userError } = await supabase
		.from('profiles')
		.select(`
			id,
			username,
			full_name,
			avatar_url,
			bio,
			location,
			seller_rating,
			seller_rating_count,
			account_type,
			is_verified,
			badges
		`)
		.eq('id', brandProfile.user_id)
		.single();

	if (userError || !userProfile) {
		console.error('User profile fetch error:', userError);
		error(404, 'User profile not found');
	}

	// Combine the data
	brandProfile.user = userProfile;

	// Fetch brand's listings
	const { data: listings } = await supabase
		.from('listings')
		.select(`
			*,
			images:listing_images (
				id,
				image_url,
				display_order
			)
		`)
		.eq('user_id', brandProfile.user_id)
		.eq('status', 'active')
		.order('created_at', { ascending: false })
		.limit(12);

	// Fetch brand stats
	const { data: stats } = await supabase
		.rpc('get_user_stats', { user_id_param: brandProfile.user_id });

	// Fetch reviews
	const { data: reviews } = await supabase
		.from('reviews')
		.select(`
			*,
			reviewer:profiles!reviews_reviewer_id_fkey (
				username,
				full_name,
				avatar_url
			)
		`)
		.eq('seller_id', brandProfile.user_id)
		.order('created_at', { ascending: false })
		.limit(5);

	return {
		brandProfile,
		listings: listings || [],
		stats: stats?.[0] || {
			total_sales: 0,
			total_listings: 0,
			avg_rating: 0,
			total_reviews: 0
		},
		reviews: reviews || []
	};
};