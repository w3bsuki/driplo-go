import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.safeGetSession()
	
	if (!session?.user) {
		redirect(303, '/login')
	}

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('username')
		.eq('id', session.user.id)
		.single()

	if (!profile?.username) {
		redirect(303, '/profile/settings')
	}

	redirect(303, `/profile/${profile.username}`)
}