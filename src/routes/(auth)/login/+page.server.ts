import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ locals: { safeGetSession }, url }) => {
	const { session } = await safeGetSession()
	
	// If already logged in, redirect to home
	if (session) {
		throw redirect(303, '/')
	}
	
	// Return empty object to satisfy preloading
	return {}
}