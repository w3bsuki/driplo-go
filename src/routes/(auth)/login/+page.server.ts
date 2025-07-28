import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ locals, url }) => {
	try {
		// Use locals directly and add error handling
		if (locals.safeGetSession) {
			const { session } = await locals.safeGetSession()
			
			// If already logged in, redirect to home
			if (session) {
				throw redirect(303, '/')
			}
		}
	} catch (error) {
		// If it's a redirect from SvelteKit, rethrow it
		if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
			throw error
		}
		// Log other errors but don't break the page
		console.error('Error checking session:', error)
	}
	
	// Return empty object to satisfy preloading
	return {}
}