import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ cookies, locals }) => {
	// This endpoint is for user logout - no admin check needed
	// but we should verify the user is authenticated before allowing logout
	const { user } = await locals.safeGetSession()
	if (!user) {
		return json({ error: 'Not authenticated' }, { status: 401 })
	}
	
	// Sign out from Supabase
	await locals.supabase.auth.signOut()
	
	// Clear all cookies
	const allCookies = cookies.getAll()
	for (const cookie of allCookies) {
		cookies.delete(cookie.name, { path: '/' })
	}
	
	return json({ success: true })
}