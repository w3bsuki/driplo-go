import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.safeGetSession()
	
	if (!session?.user) {
		redirect(303, '/login')
	}

	const { data: profile, error } = await locals.supabase
		.from('profiles')
		.select('*')
		.eq('id', session.user.id)
		.single()

	if (error) {
		console.error('Error loading profile:', error)
	}

	return {
		profile: profile || {
			id: session.user.id,
			full_name: '',
			username: '',
			bio: '',
			location: '',
			website: '',
			avatar_url: null,
			cover_url: null
		}
	}
}