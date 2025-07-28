import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { get2FAStatus } from '$lib/server/two-factor';

// Routes that require authentication but not 2FA verification
const AUTH_ONLY_ROUTES = [
  '/api/auth/2fa/enable',
  '/api/auth/2fa/verify',
  '/2fa-verify'
];

// Routes that don't require any authentication
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/confirm',
  '/auth/callback',
  '/api/auth/resend-verification'
];

export const check2FAMiddleware: Handle = async ({ event, resolve }) => {
  try {
    const { cookies, url } = event;
    
    // Skip public routes
    if (PUBLIC_ROUTES.some(route => url.pathname.startsWith(route))) {
      return await resolve(event);
    }
    
    // Skip if no supabase client available
    if (!event.locals.supabase) {
      return await resolve(event);
    }
    
    const supabase = event.locals.supabase;
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (!user || authError) {
    // User not authenticated, let SvelteKit handle the redirect
    return await resolve(event);
  }
  
  // Skip 2FA check for auth-only routes
  if (AUTH_ONLY_ROUTES.some(route => url.pathname.startsWith(route))) {
    return await resolve(event);
  }
  
  // Check if user has 2FA enabled
  const twoFactorStatus = await get2FAStatus(supabase, user.id);
  
  if (twoFactorStatus.enabled) {
    // Check if 2FA is verified in this session
    const twoFactorVerified = cookies.get('2fa_verified');
    
    if (!twoFactorVerified || twoFactorVerified !== 'true') {
      // User has 2FA enabled but hasn't verified it yet
      // Store the original URL they were trying to access
      cookies.set('2fa_redirect', url.pathname + url.search, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 10, // 10 minutes
        path: '/'
      });
      
      // Redirect to 2FA verification page
      if (url.pathname !== '/2fa-verify') {
        throw redirect(303, '/2fa-verify');
      }
    }
  }
  
  return await resolve(event);
  } catch (error) {
    console.error('2FA middleware error:', error);
    // Continue with request even if middleware fails
    return await resolve(event);
  }
};