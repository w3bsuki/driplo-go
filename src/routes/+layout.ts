import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import { createBrowserClient, isBrowser } from '@supabase/ssr'
import type { LayoutLoad } from './$types'
import type { Database } from '$lib/types/database.types'

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
	/**
	 * Declare a dependency so the layout can be invalidated, for example, on
	 * session refresh.
	 */
	depends('supabase:auth')

	// Create browser client for client-side operations
	const supabase = createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: {
			fetch,
		},
		auth: {
			persistSession: true,
			detectSessionInUrl: true,
			flowType: 'pkce'
		}
	})

	// Always use the data passed from the server layout
	// The server has already validated the session
	return {
		session: data.session,
		supabase,
		user: data.user,
		categories: data.categories || []
	}
}