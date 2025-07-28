import { createAuthStores } from './auth-compat'
import type { User, Session } from '@supabase/supabase-js'

// Create compatibility stores that use the new auth context
const stores = createAuthStores()

// Export individual stores for backward compatibility
export const user = stores.user
export const session = stores.session
export const profile = stores.profile
export const loading = stores.loading

// Initialize auth state - kept for backward compatibility
// The actual initialization now happens in the auth context
export function initializeAuth(_initialUser: User | null, _initialSession: Session | null) {
	// This function is now a no-op as initialization happens in the context
	// Kept for backward compatibility
}

// Export auth object from compatibility layer
export const auth = stores.auth