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
	
	// Load user's listings
	const { data: listings } = await locals.supabase
		.from('listings')
		.select('*')
		.eq('seller_id', profileData.id)
		.eq('status', 'active')
		.order('created_at', { ascending: false })
		.limit(12)
	
	// Check if current user follows this profile
	let isFollowing = false
	if (session?.user && session.user.id !== profileData.id) {
		const { data: followData } = await locals.supabase
			.from('user_follows')
			.select('id')
			.eq('follower_id', session.user.id)
			.eq('following_id', profileData.id)
			.maybeSingle()
		
		isFollowing = !!followData
	}
	
	// Load social media accounts
	const { data: socialAccounts } = await locals.supabase
		.from('social_media_accounts')
		.select('*')
		.eq('user_id', profileData.id)
	
	// Calculate stats
	const { count: totalListings } = await locals.supabase
		.from('listings')
		.select('*', { count: 'exact', head: true })
		.eq('seller_id', profileData.id)
	
	const { data: likesData } = await locals.supabase
		.from('favorites')
		.select('id')
		.in('listing_id', listings?.map(l => l.id) || [])
	
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
			totalListings: totalListings || 0,
			totalLikes: likesData?.length || 0,
			followers: profileData.followers_count || 0,
			following: profileData.following_count || 0
		},
		isOwnProfile: session?.user?.id === profileData.id,
		user: session?.user || null
	}
}