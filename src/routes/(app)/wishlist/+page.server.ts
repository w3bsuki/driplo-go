import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.safeGetSession()
	
	if (!session?.user) {
		redirect(302, '/login')
	}

	const { data: favorites, error: favoritesError } = await locals.supabase
		.from('favorites')
		.select(`
			id,
			created_at,
			listing_id,
			listings (
				id,
				title,
				price,
				images,
				size,
				brand,
				condition,
				seller_id,
				profiles (
					username,
					avatar_url
				)
			)
		`)
		.eq('user_id', session.user.id)
		.order('created_at', { ascending: false })

	if (favoritesError) {
		console.error('Error fetching favorites:', favoritesError)
		return {
			favorites: []
		}
	}

	return {
		favorites: favorites || []
	}
}