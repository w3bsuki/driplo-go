import type { RequestEvent } from '@sveltejs/kit'

export interface CacheConfig {
	/**
	 * Cache-Control max-age in seconds for browser cache
	 */
	maxAge?: number
	/**
	 * Cache-Control s-maxage in seconds for CDN/proxy cache
	 */
	sMaxAge?: number
	/**
	 * Whether the response must be revalidated with the origin server
	 */
	mustRevalidate?: boolean
	/**
	 * Allow caching of responses with Set-Cookie headers
	 */
	private?: boolean
	/**
	 * Prevent caching entirely
	 */
	noStore?: boolean
	/**
	 * Custom Cache-Control directives
	 */
	custom?: string
}

/**
 * Set cache headers for a response
 */
export function setCacheHeaders(event: RequestEvent, config: CacheConfig) {
	if (config.noStore) {
		event.setHeaders({
			'cache-control': 'no-store'
		})
		return
	}

	if (config.custom) {
		event.setHeaders({
			'cache-control': config.custom
		})
		return
	}

	const directives: string[] = []

	if (config.private) {
		directives.push('private')
	} else {
		directives.push('public')
	}

	if (config.maxAge !== undefined) {
		directives.push(`max-age=${config.maxAge}`)
	}

	if (config.sMaxAge !== undefined) {
		directives.push(`s-maxage=${config.sMaxAge}`)
	}

	if (config.mustRevalidate) {
		directives.push('must-revalidate')
	}

	event.setHeaders({
		'cache-control': directives.join(', ')
	})
}

/**
 * Common cache configurations
 */
export const cachePresets = {
	/**
	 * No caching - for user-specific or sensitive data
	 */
	noCache: { noStore: true },

	/**
	 * Static assets - long cache with immutable
	 */
	static: { 
		maxAge: 31536000, // 1 year
		custom: 'public, max-age=31536000, immutable' 
	},

	/**
	 * API responses - short browser cache, longer CDN cache
	 */
	api: { 
		maxAge: 0, 
		sMaxAge: 60, // 1 minute CDN cache
		mustRevalidate: true 
	},

	/**
	 * Browse pages - moderate caching
	 */
	browse: { 
		maxAge: 300, // 5 minutes browser
		sMaxAge: 3600 // 1 hour CDN
	},

	/**
	 * Product/listing pages - longer caching
	 */
	product: { 
		maxAge: 600, // 10 minutes browser
		sMaxAge: 86400 // 24 hours CDN
	},

	/**
	 * User profiles - shorter caching
	 */
	profile: { 
		maxAge: 60, // 1 minute browser
		sMaxAge: 300 // 5 minutes CDN
	},

	/**
	 * Search results - very short caching
	 */
	search: { 
		maxAge: 60, // 1 minute browser
		sMaxAge: 300, // 5 minutes CDN
		mustRevalidate: true
	},

	/**
	 * Private user data - browser cache only
	 */
	private: { 
		private: true,
		maxAge: 0,
		mustRevalidate: true
	}
} as const