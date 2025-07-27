import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import { createServerClient } from '@supabase/ssr'
import type { Handle } from '@sveltejs/kit'
import type { Database } from '$lib/types/database'
import { sequence } from '@sveltejs/kit/hooks'
import { setLocale, isLocale } from '$lib/paraglide/runtime.js'
import { dev } from '$app/environment'

const handleI18n: Handle = async ({ event, resolve }) => {
	// Get language from cookie or Accept-Language header
	// Paraglide uses PARAGLIDE_LOCALE as the cookie name
	const cookieLocale = event.cookies.get('PARAGLIDE_LOCALE') || event.cookies.get('locale')
	const acceptLanguage = event.request.headers.get('accept-language')?.split(',')[0]?.split('-')[0]
	
	// Determine which language to use
	let locale = 'en' // default
	
	if (cookieLocale && isLocale(cookieLocale)) {
		locale = cookieLocale
	} else if (acceptLanguage && isLocale(acceptLanguage)) {
		locale = acceptLanguage
	}
	
	// Set the language for this request
	setLocale(locale as 'en' | 'bg', { reload: false })
	
	// Store locale for use in components
	event.locals.locale = locale
	
	// Resolve the request
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => {
			// Replace html lang attribute
			return html.replace('<html lang="en">', `<html lang="${locale}">`)
		}
	})
	
	// Set cookie if it's not already set or if locale changed
	if (!cookieLocale || cookieLocale !== locale) {
		// Set PARAGLIDE_LOCALE cookie for Paraglide runtime
		response.headers.append('set-cookie', event.cookies.serialize('PARAGLIDE_LOCALE', locale, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 365, // 1 year
			secure: !dev
		}))
	}
	
	return response
}

const handleSupabase: Handle = async ({ event, resolve }) => {
	/**
	 * Creates a Supabase client specific to this server request.
	 * The Supabase client gets the Auth token from the request cookies.
	 */
	event.locals.supabase = createServerClient<Database>(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				get: (key) => event.cookies.get(key),
				set: (key, value, options) => {
					event.cookies.set(key, value, { 
						...options, 
						path: '/',
						httpOnly: true,
						secure: !dev,
						sameSite: 'lax',
						maxAge: options?.maxAge ?? 60 * 60 * 24 * 30 // 30 days default
					})
				},
				remove: (key, _options) => {
					// Ensure complete cookie removal with all necessary options
					event.cookies.delete(key, { 
						path: '/',
						httpOnly: true,
						secure: !dev,
						sameSite: 'lax'
					})
				}
			}
		}
	)

	/**
	 * Unlike `supabase.auth.getSession()`, which returns the session _without_
	 * validating the JWT, this function also calls `getUser()` to validate the
	 * JWT before returning the session.
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession()
		
		if (!session) {
			return { session: null, user: null }
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser()
		
		if (error) {
			// JWT validation has failed
			return { session: null, user: null }
		}

		return { session, user }
	}

	// Check if user needs to complete profile setup
	const { user } = await event.locals.safeGetSession()
	if (user && !event.url.pathname.startsWith('/onboarding') && !event.url.pathname.startsWith('/api')) {
		// Check if profile setup is complete
		const { data: profile } = await event.locals.supabase
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.single()
		
		// Only redirect to onboarding for truly new users who need setup
		const needsOnboarding = profile && (
			// User has a temporary username (ends with numbers)
			((profile as any).username && (profile as any).username.match(/[0-9]+$/) && (profile as any).username.length < 20) ||
			// User explicitly needs username setup
			(profile as any).needs_username_setup === true ||
			// User is very new (created within last hour) and hasn't completed onboarding
			(!(profile as any).onboarding_completed && 
			 new Date((profile as any).created_at).getTime() > Date.now() - 60 * 60 * 1000)
		)
		
		if (needsOnboarding) {
			// Redirect to onboarding if profile setup is not complete
			// Skip redirect for auth pages, brand pages (for existing brands), and static assets
			if (!event.url.pathname.startsWith('/login') && 
				!event.url.pathname.startsWith('/register') &&
				!event.url.pathname.startsWith('/callback') &&
				!event.url.pathname.startsWith('/_app') &&
				!event.url.pathname.includes('.') &&
				// Don't redirect brand accounts from brand pages
				!((profile as any).account_type === 'brand' && event.url.pathname.startsWith('/brands/'))) {
				return new Response(null, {
					status: 302,
					headers: {
						location: '/onboarding'
					}
				})
			}
		}
	}

	const response = await resolve(event, {
		filterSerializedResponseHeaders(name) {
			/**
			 * Supabase libraries use the `content-range` and `x-supabase-api-version`
			 * headers, so we need to tell SvelteKit to pass it through.
			 */
			return name === 'content-range' || name === 'x-supabase-api-version'
		}
	})

	// Add security headers
	response.headers.set('X-Content-Type-Options', 'nosniff')
	response.headers.set('X-Frame-Options', 'DENY')
	response.headers.set('X-XSS-Protection', '1; mode=block')
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
	response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
	
	// Add CSP header for reCAPTCHA and Stripe
	response.headers.set('Content-Security-Policy', 
		"default-src 'self'; " +
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://js.stripe.com https://checkout.stripe.com; " +
		"frame-src 'self' https://www.google.com https://checkout.stripe.com; " +
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
		"font-src 'self' https://fonts.gstatic.com; " +
		"img-src 'self' data: https: blob:; " +
		"connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google.com https://api.stripe.com"
	)
	
	// Only set HSTS in production
	if (event.url.protocol === 'https:') {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
	}

	return response
}

const handleCaching: Handle = async ({ event, resolve }) => {
	const response = await resolve(event)
	
	// Skip caching for non-GET requests
	if (event.request.method !== 'GET') {
		return response
	}
	
	// Skip if cache headers already set by route
	if (response.headers.has('cache-control')) {
		return response
	}
	
	const path = event.url.pathname
	
	// Apply caching based on route patterns
	if (path.startsWith('/_app/') || path.startsWith('/images/') || path.endsWith('.js') || path.endsWith('.css')) {
		// Static assets - long cache
		response.headers.set('cache-control', 'public, max-age=31536000, immutable')
	} else if (path.startsWith('/api/')) {
		// API routes - short cache
		response.headers.set('cache-control', 'public, max-age=0, s-maxage=60, must-revalidate')
	} else if (path.startsWith('/auth/') || path.startsWith('/account/') || path.startsWith('/dashboard/')) {
		// Private routes - no cache
		response.headers.set('cache-control', 'no-store')
	} else if (path === '/' || path.startsWith('/browse')) {
		// Browse pages - moderate cache
		response.headers.set('cache-control', 'public, max-age=300, s-maxage=3600')
	} else if (path.startsWith('/listings/')) {
		// Product pages - longer cache
		response.headers.set('cache-control', 'public, max-age=600, s-maxage=86400')
	} else if (path.startsWith('/sellers/') || path.startsWith('/brands/')) {
		// Profile pages - short cache
		response.headers.set('cache-control', 'public, max-age=60, s-maxage=300')
	} else {
		// Default - short cache
		response.headers.set('cache-control', 'public, max-age=60, s-maxage=300')
	}
	
	// Add Vary header for proper caching with different representations
	const vary = response.headers.get('vary')
	const varyHeaders = ['Accept-Encoding', 'Accept-Language']
	if (vary) {
		varyHeaders.unshift(vary)
	}
	response.headers.set('vary', varyHeaders.join(', '))
	
	return response
}

export const handle = sequence(handleI18n, handleSupabase, handleCaching)