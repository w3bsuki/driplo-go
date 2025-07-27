import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ cookies, locals }) => {
	// Sign out from Supabase
	await locals.supabase.auth.signOut()
	
	// Clear all cookies
	const allCookies = cookies.getAll()
	for (const cookie of allCookies) {
		cookies.delete(cookie.name, { path: '/' })
	}
	
	return json({ success: true })
}