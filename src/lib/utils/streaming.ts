import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Utility for implementing streaming responses in SvelteKit
 * Allows fast initial page load with data streaming in afterwards
 */

export interface StreamedData<T> {
	initial: T | null
	promise: Promise<T>
}

/**
 * Create a streamed data object that can be returned from load functions
 * The initial data loads immediately, while the full data streams in
 */
export function createStreamedData<T>(
	initial: T | null,
	promise: Promise<T>
): StreamedData<T> {
	return {
		initial,
		promise
	}
}

/**
 * Helper to create a deferred promise that can be resolved later
 */
export function createDeferredPromise<T>() {
	let resolve: (value: T) => void
	let reject: (error: any) => void
	
	const promise = new Promise<T>((res, rej) => {
		resolve = res
		reject = rej
	})
	
	return {
		promise,
		resolve: resolve!,
		reject: reject!
	}
}

/**
 * Stream large result sets with pagination
 */
export async function* streamPaginatedResults<T>(
	supabase: SupabaseClient,
	table: string,
	query: {
		select?: string
		filters?: Array<{ column: string; op: string; value: any }>
		orderBy?: { column: string; ascending?: boolean }
		pageSize?: number
	}
) {
	const pageSize = query.pageSize || 100
	let offset = 0
	let hasMore = true
	
	while (hasMore) {
		let baseQuery = supabase
			.from(table)
			.select(query.select || '*')
			.range(offset, offset + pageSize - 1)
		
		// Apply filters
		if (query.filters) {
			for (const filter of query.filters) {
				baseQuery = baseQuery.filter(filter.column, filter.op, filter.value)
			}
		}
		
		// Apply ordering
		if (query.orderBy) {
			baseQuery = baseQuery.order(query.orderBy.column, {
				ascending: query.orderBy.ascending ?? true
			})
		}
		
		const { data, error } = await baseQuery
		
		if (error) throw error
		
		if (data && data.length > 0) {
			yield data as T[]
			offset += pageSize
			hasMore = data.length === pageSize
		} else {
			hasMore = false
		}
	}
}

/**
 * Create a streaming response for dashboard statistics
 * Returns quick counts immediately, detailed data streams in
 */
export interface DashboardStats {
	quickCounts: {
		totalUsers?: number
		activeListings?: number
		verifiedBrands?: number
		monthlyRevenue?: number
	}
	detailedData: {
		pendingBrands?: any[]
		recentActivity?: any[]
		topSellers?: any[]
		popularProducts?: any[]
	}
}

export function createStreamedDashboard(
	quickCounts: DashboardStats['quickCounts'],
	detailedDataPromise: Promise<DashboardStats['detailedData']>
): StreamedData<DashboardStats> {
	return {
		initial: {
			quickCounts,
			detailedData: {}
		},
		promise: detailedDataPromise.then(detailedData => ({
			quickCounts,
			detailedData
		}))
	}
}

/**
 * Utility to handle streamed data in Svelte components
 */
export function handleStreamedData<T>(
	streamedData: StreamedData<T>,
	onUpdate: (data: T) => void,
	onError?: (error: Error) => void
) {
	// Use initial data if available
	if (streamedData.initial) {
		onUpdate(streamedData.initial)
	}
	
	// Update when promise resolves
	streamedData.promise
		.then(onUpdate)
		.catch(error => {
			console.error('Streaming data error:', error)
			if (onError) {
				onError(error)
			}
		})
}