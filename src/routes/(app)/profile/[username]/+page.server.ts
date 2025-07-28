import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
	const { username } = params
	const session = await locals.safeGetSession()
	
	// Load profile data
	const { data: profileData, error: profileError } = await locals.supabase
		.from('profiles')
		.select('*')
		.eq('username', username)
		.maybeSingle()
	
	if (profileError || !profileData) {
		error(404, 'Profile not found')
	}
	
	// If it's a brand account, fetch brand profile data
	let brandProfile = null
	if (profileData.account_type === 'brand') {
		const { data: brandData } = await locals.supabase
			.from('brand_profiles')
			.select('*')
			.eq('user_id', profileData.id)
			.maybeSingle()
		
		brandProfile = brandData
	}
	
	// Use optimized RPC function to get profile listings with stats
	const { data: profileListingsData, error: profileListingsError } = await locals.supabase
		.rpc('get_profile_listings_with_stats', {
			p_seller_id: profileData.id,
			p_viewer_id: session?.user?.id || null,
			p_limit: 12
		})

	if (profileListingsError) {
		console.error('Error loading profile listings:', profileListingsError)
	}

	// Extract listings from RPC result
	const profileResult = profileListingsData?.[0] || {}
	const listings = profileResult.listings || []
	
	// Check if current user follows this profile and load other data in parallel
	const parallelQueries = []
	
	// Following check
	if (session?.user && session.user.id !== profileData.id) {
		parallelQueries.push(
			locals.supabase
				.from('user_follows')
				.select('id')
				.eq('follower_id', session.user.id)
				.eq('following_id', profileData.id)
				.maybeSingle()
		)
	}
	
	// Social media accounts
	parallelQueries.push(
		locals.supabase
			.from('social_media_accounts')
			.select('*')
			.eq('user_id', profileData.id)
	)
	
	const results = await Promise.all(parallelQueries)
	
	let isFollowing = false
	let socialAccounts = []
	
	if (session?.user && session.user.id !== profileData.id) {
		isFollowing = !!results[0]?.data
		socialAccounts = results[1]?.data || []
	} else {
		socialAccounts = results[0]?.data || []
	}

	// Get stats from RPC result (already optimized)
	const totalListings = profileResult.total_listings || 0
	const totalLikes = profileResult.total_likes || 0
	
	return {
		profile: {
			...profileData,
			achievements: [],
			member_since: profileData.created_at,
			seller_rating: profileData.seller_rating || 0,
			seller_rating_count: profileData.seller_rating_count || 0,
			response_time_hours: 24,
			total_sales: profileData.total_sales || 0,
			verification_badges: profileData.badges || []
		},
		brandProfile,
		listings: listings || [],
		reviews: [],
		socialAccounts: socialAccounts || [],
		isFollowing,
		stats: {
			totalListings,
			totalLikes,
			followers: profileData.follower_count || 0,
			following: profileData.following_count || 0
		},
		isOwnProfile: session?.user?.id === profileData.id,
		user: session?.user || null
	}
}