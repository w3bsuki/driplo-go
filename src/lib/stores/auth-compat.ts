// Compatibility layer for gradual migration from old auth store to new context
import { writable } from 'svelte/store'
import { browser } from '$app/environment'
import type { User, Session } from '@supabase/supabase-js'
import type { Database } from '$lib/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

// Create placeholder functions that will try to get context when called
const createDeferredAuthMethod = (methodName: string) => {
	return async (...args: any[]) => {
		if (!browser) {
			throw new Error('Auth operations must be performed in the browser')
		}
		
		// Try to get the auth context when the method is actually called
		try {
			const { getAuthContext } = await import('./auth-context.svelte')
			const context = getAuthContext()
			if (context && typeof context[methodName] === 'function') {
				return context[methodName](...args)
			}
		} catch (e) {
			console.error(`Failed to get auth context for ${methodName}:`, e)
		}
		
		throw new Error(`Auth method ${methodName} not available`)
	}
}

// Create reactive stores that are updated from the auth context
// We'll manage these manually instead of using polling
const userStore = writable<User | null>(null)
const sessionStore = writable<Session | null>(null)
const profileStore = writable<Profile | null>(null)
const loadingStore = writable(false)

// Custom event system for auth state changes
const AUTH_STATE_CHANGE = 'auth-state-change'

// Event listener for auth state changes
function updateStoresFromEvent(event: CustomEvent) {
	const { user, session, profile, loading } = event.detail
	userStore.set(user)
	sessionStore.set(session)
	profileStore.set(profile)
	loadingStore.set(loading)
}

// Set up context subscription when in browser
if (browser) {
	// Listen for custom auth events
	window.addEventListener(AUTH_STATE_CHANGE, updateStoresFromEvent)
	
	// Import the auth context and set up reactive updates
	import('./auth-context.svelte').then(module => {
		const context = module.getAuthContext()
		if (context) {
			// Set initial values
			userStore.set(context.user)
			sessionStore.set(context.session)
			profileStore.set(context.profile)
			loadingStore.set(context.loading)
		}
	}).catch(() => {
		// Context not available, use fallback values
	})
}

// Export function for auth context to trigger updates
export function notifyAuthStateChange(user: User | null, session: Session | null, profile: Profile | null, loading: boolean) {
	if (browser) {
		const event = new CustomEvent(AUTH_STATE_CHANGE, {
			detail: { user, session, profile, loading }
		})
		window.dispatchEvent(event)
	}
}

// Fallback stores for server-side rendering
const fallbackStores = {
	user: userStore,
	session: sessionStore,
	profile: profileStore,
	loading: loadingStore,
	auth: {
		user: userStore,
		session: sessionStore,
		profile: profileStore,
		loading: loadingStore,
		signUp: createDeferredAuthMethod('signUp'),
		signIn: createDeferredAuthMethod('signIn'),
		signInWithProvider: createDeferredAuthMethod('signInWithProvider'),
		signOut: createDeferredAuthMethod('signOut'),
		resetPassword: createDeferredAuthMethod('resetPassword'),
		updatePassword: createDeferredAuthMethod('updatePassword'),
		updateProfile: createDeferredAuthMethod('updateProfile')
	}
}

// Create derived stores that mirror the old API but use the new context
export function createAuthStores() {
	// Return the same stores for both server and browser
	// The browser-specific setup happens above
	return fallbackStores
}