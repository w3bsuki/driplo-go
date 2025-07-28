import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// For startup phase, we show ALL sellers, brands, etc.
	// Later we can add filters for top performers only
	
	// Fetch all sellers (personal accounts)
	const sellersResult = await locals.supabase
		.from('profiles')
		.select(`
			id,
			user_id: id,
			username,
			full_name,
			avatar_url,
			badges,
			total_sales,
			seller_rating,
			average_rating: seller_rating,
			rating_count: seller_rating_count,
			total_revenue: total_earned,
			listings_count,
			created_at,
			account_type,
			is_verified,
			followers_count
		`)
		.eq('account_type', 'personal')
		.order('total_sales', { ascending: false });
		
	// Fetch all brand profiles with their associated profile data
	const brandsResult = await locals.supabase
		.from('brand_profiles')
		.select('*');
		
	// Get profile data for brands separately
	const brandUserIds = brandsResult.data?.map(b => b.user_id) || [];
	const brandProfilesResult = brandUserIds.length > 0 
		? await locals.supabase
			.from('profiles')
			.select('*')
			.in('id', brandUserIds)
		: { data: [] };
	
	// Handle any errors
	if (sellersResult.error) {
		console.error('Error fetching sellers:', sellersResult.error);
	}
	if (brandsResult.error) {
		console.error('Error fetching brands:', brandsResult.error);
	}
	if (brandProfilesResult.error) {
		console.error('Error fetching brand profiles:', brandProfilesResult.error);
	}
	
	// Create a map of profile data by user_id
	const profileMap = new Map();
	brandProfilesResult.data?.forEach(profile => {
		profileMap.set(profile.id, profile);
	});
	
	// Process brand data to combine brand_profiles with profiles data
	const brands = (brandsResult.data || []).map(brand => {
		const profile = profileMap.get(brand.user_id) || {};
		return {
			brand_id: brand.id,
			brand_name: brand.brand_name,
			brand_slug: brand.brand_slug,
			brand_logo_url: brand.brand_logo_url,
			verification_status: brand.verification_status,
			created_at: brand.created_at,
			username: profile.username, // Add username for profile page
			avatar_url: profile.avatar_url, // Add avatar for consistency
			total_sales: profile.total_sales || 0,
			average_rating: profile.seller_rating || 0,
			rating_count: profile.seller_rating_count || 0,
			total_revenue: profile.total_earned || 0,
			followers_count: profile.followers_count || 0,
			badges: profile.badges || []
		};
	});
	
	console.log('Processed brands:', brands);
	
	// For now, we'll use the same data structure as before but with all sellers
	return {
		topSellers: sellersResult.data || [],
		topBrands: brands,
		recentReviews: [], // We can add this later if needed
		initialTimePeriod: 'all'
	};
};