import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.safeGetSession()
	
	if (!session?.user) {
		redirect(302, '/login')
	}

	// Use optimized RPC function to get favorites with all related data in single query
	const { data: favoritesData, error: favoritesError } = await locals.supabase
		.rpc('get_user_favorites_with_listings', {
			p_user_id: session.user.id,
			p_limit: 50,
			p_offset: 0
		})

	if (favoritesError) {
		console.error('Error fetching favorites:', favoritesError)
		return {
			favorites: []
		}
	}

	// Transform RPC result to match expected format
	const favorites = (favoritesData || []).map((item: any) => ({
		id: item.favorite_id,
		created_at: item.created_at,
		listing_id: item.listing_data.id,
		listings: {
			...item.listing_data,
			// Map 'images' from RPC (image_urls) to match expected format
			images: item.listing_data.images,
			profiles: item.listing_data.profiles
		}
	}))

	return {
		favorites
	}
}