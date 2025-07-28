// Simple in-memory cache for server-side caching
// In production, this could be replaced with Redis or similar

interface CacheEntry<T> {
	data: T
	timestamp: number
	ttl: number
}

class ServerCache {
	private cache = new Map<string, CacheEntry<any>>()
	
	// Get cached data if still valid
	get<T>(key: string): T | null {
		const entry = this.cache.get(key)
		if (!entry) return null
		
		const now = Date.now()
		if (now - entry.timestamp > entry.ttl) {
			this.cache.delete(key)
			return null
		}
		
		return entry.data as T
	}
	
	// Set cached data with TTL in milliseconds
	set<T>(key: string, data: T, ttl: number): void {
		this.cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl
		})
	}
	
	// Delete cached data
	delete(key: string): void {
		this.cache.delete(key)
	}
	
	// Clear all cache
	clear(): void {
		this.cache.clear()
	}
	
	// Get all cache keys
	keys(): IterableIterator<string> {
		return this.cache.keys()
	}
	
	// Get cache statistics
	getStats() {
		return {
			size: this.cache.size,
			entries: Array.from(this.cache.keys())
		}
	}
	
	// Clean up expired entries
	cleanup(): void {
		const now = Date.now()
		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp > entry.ttl) {
				this.cache.delete(key)
			}
		}
	}
}

// Singleton cache instance
export const serverCache = new ServerCache()

// Cache key builders
export const cacheKeys = {
	homepage: 'homepage-data',
	homepage_critical: 'homepage-critical', // Categories + featured listings only
	homepage_secondary: 'homepage-secondary', // Popular + top sellers
	categories: 'categories-nav',
	categoryPage: (slug: string) => `category-page-${slug}`,
	browseResults: (filters: any) => `browse-${JSON.stringify(filters)}`,
	topSellers: (categoryId?: string) => `top-sellers-${categoryId || 'all'}`,
	featuredListings: 'featured-listings',
	popularListings: 'popular-listings'
}

// Cache TTL configurations (in milliseconds)
export const cacheTTL = {
	homepage: 15 * 60 * 1000, // 15 minutes
	categories: 60 * 60 * 1000, // 1 hour
	categoryPage: 10 * 60 * 1000, // 10 minutes
	browseResults: 5 * 60 * 1000, // 5 minutes
	topSellers: 30 * 60 * 1000, // 30 minutes
	featuredListings: 15 * 60 * 1000, // 15 minutes
	popularListings: 10 * 60 * 1000 // 10 minutes
}

// Helper function to get or set cached data
export async function getCachedData<T>(
	key: string,
	fetcher: () => Promise<T>,
	ttl: number
): Promise<T> {
	// Try to get from cache first
	const cached = serverCache.get<T>(key)
	if (cached) {
		return cached
	}
	
	// Fetch fresh data
	const data = await fetcher()
	
	// Cache the result
	serverCache.set(key, data, ttl)
	
	return data
}

// Cleanup expired entries every 10 minutes
setInterval(() => {
	serverCache.cleanup()
}, 10 * 60 * 1000)

// Export cache clearing function
export function clearCache() {
	serverCache.clear()
}