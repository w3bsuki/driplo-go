import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { clearCache } from '$lib/server/cache'

export const POST: RequestHandler = async () => {
	// Clear all cache
	clearCache()
	
	return json({ success: true, message: 'Cache cleared' })
}