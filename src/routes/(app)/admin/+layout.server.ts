import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession()
	
	if (!user) {
		throw redirect(303, '/login')
	}
	
	// Check if user is admin
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('is_admin, role')
		.eq('id', user.id)
		.single()
	
	if (!profile?.is_admin || profile.role !== 'admin') {
		throw redirect(303, '/')
	}
	
	return {
		user,
		profile
	}
}