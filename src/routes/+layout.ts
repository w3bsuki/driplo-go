import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import { createBrowserClient, isBrowser } from '@supabase/ssr'
import type { LayoutLoad } from './$types'
import type { Database } from '$lib/types/database'
import { createRoutePreloader } from '$lib/utils/lazy-load'

// Create route preloader for heavy routes
const routePreloader = isBrowser ? createRoutePreloader({
	'/messages': () => import('$lib/components/messaging/MessageThread.svelte'),
	'/sell': () => import('$lib/components/listings/CreateListingForm/CreateListingForm.svelte'),
	'/checkout': () => import('$lib/components/checkout/CheckoutFlow.svelte'),
	'/profile/setup': () => import('$lib/components/onboarding/ProfileSetupWizard.svelte')
}) : null;

export const load: LayoutLoad = async ({ data, depends, fetch, url }) => {
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

	// Preload routes based on current path
	if (isBrowser && routePreloader) {
		// Preload related routes
		routePreloader.preloadMatchingRoutes(url.pathname);
		
		// Preload commonly accessed routes after initial page load
		if (url.pathname === '/') {
			setTimeout(() => {
				routePreloader.preloadRoute('/messages');
				routePreloader.preloadRoute('/sell');
			}, 3000);
		}
	}

	// Always use the data passed from the server layout
	// The server has already validated the session
	return {
		session: data.session,
		supabase,
		user: data.user,
		categories: data.categories || []
	}
}