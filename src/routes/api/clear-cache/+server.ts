import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { clearCache } from '$lib/server/cache'

export const POST: RequestHandler = async ({ locals }) => {
	// SECURITY: Require authentication
	const { user } = await locals.safeGetSession()
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 })
	}
	
	// Check if user is admin
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.single()
	
	if (profile?.role !== 'admin') {
		return json({ error: 'Forbidden - Admin access required' }, { status: 403 })
	}
	
	// Clear all cache
	clearCache()
	
	return json({ success: true, message: 'Cache cleared' })
}