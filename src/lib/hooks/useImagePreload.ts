// Image preloading hooks

import { browser } from '$app/environment'
import { preloadImage, preloadImages, type ImageConfig } from '$lib/utils/image-optimization'

interface PreloadOptions extends ImageConfig {
	priority?: 'high' | 'low'
	timeout?: number
}

/**
 * Preload a single image
 */
export function useImagePreload(url: string, options: PreloadOptions = {}) {
	const { priority = 'low', timeout = 5000, ...config } = options
	
	let preloadPromise: Promise<void> | null = null
	let isLoaded = false
	let hasError = false
	
	function preload() {
		if (!browser || !url || isLoaded || preloadPromise) return
		
		preloadPromise = Promise.race([
			preloadImage(url, config),
			new Promise<void>((_, reject) => 
				setTimeout(() => reject(new Error('Preload timeout')), timeout)
			)
		])
		
		preloadPromise
			.then(() => {
				isLoaded = true
				hasError = false
			})
			.catch(() => {
				hasError = true
				isLoaded = false
			})
			.finally(() => {
				preloadPromise = null
			})
		
		return preloadPromise
	}
	
	// Auto-preload high priority images
	if (priority === 'high') {
		preload()
	}
	
	return {
		preload,
		isLoaded,
		hasError
	}
}

/**
 * Preload multiple images
 */
export function useImageBatchPreload(urls: string[], options: PreloadOptions = {}) {
	const { priority = 'low', timeout = 5000, ...config } = options
	
	let preloadPromise: Promise<void[]> | null = null
	let loadedCount = 0
	let errorCount = 0
	let isComplete = false
	
	function preload() {
		if (!browser || !urls.length || isComplete || preloadPromise) return
		
		preloadPromise = Promise.race([
			preloadImages(urls, config),
			new Promise<void[]>((_, reject) => 
				setTimeout(() => reject(new Error('Batch preload timeout')), timeout)
			)
		])
		
		preloadPromise
			.then(() => {
				loadedCount = urls.length
				errorCount = 0
				isComplete = true
			})
			.catch(() => {
				errorCount = urls.length - loadedCount
				isComplete = true
			})
			.finally(() => {
				preloadPromise = null
			})
		
		return preloadPromise
	}
	
	// Auto-preload high priority images
	if (priority === 'high') {
		preload()
	}
	
	return {
		preload,
		loadedCount,
		errorCount,
		isComplete,
		progress: urls.length > 0 ? loadedCount / urls.length : 0
	}
}

/**
 * Preload images on intersection (lazy preload)
 */
export function useIntersectionPreload(
	element: HTMLElement | null,
	urls: string[],
	options: PreloadOptions & { rootMargin?: string; threshold?: number } = {}
) {
	const { rootMargin = '50px', threshold = 0.1, ...preloadOptions } = options
	
	const batchPreload = useImageBatchPreload(urls, preloadOptions)
	
	function setupObserver() {
		if (!browser || !element || !urls.length) return
		
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						batchPreload.preload()
						observer.disconnect()
					}
				})
			},
			{
				rootMargin,
				threshold
			}
		)
		
		observer.observe(element)
		
		return () => observer.disconnect()
	}
	
	return {
		...batchPreload,
		setupObserver
	}
}

/**
 * Smart image preloading based on connection type
 */
export function useSmartPreload(urls: string[], options: PreloadOptions = {}) {
	const batchPreload = useImageBatchPreload(urls, options)
	
	function shouldPreload(): boolean {
		if (!browser) return false
		
		// Check if user prefers reduced data usage
		if ('connection' in navigator) {
			const connection = (navigator as any).connection
			if (connection) {
				// Don't preload on slow connections
				if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
					return false
				}
				
				// Don't preload when data saver is enabled
				if (connection.saveData) {
					return false
				}
			}
		}
		
		// Check if user prefers reduced motion (might indicate performance concerns)
		if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			return false
		}
		
		return true
	}
	
	function smartPreload() {
		if (shouldPreload()) {
			return batchPreload.preload()
		}
	}
	
	return {
		...batchPreload,
		smartPreload,
		shouldPreload
	}
}

/**
 * Preload images with retry logic
 */
export function useRetryPreload(
	urls: string[],
	options: PreloadOptions & { maxRetries?: number; retryDelay?: number } = {}
) {
	const { maxRetries = 3, retryDelay = 1000, ...preloadOptions } = options
	
	let retryCount = 0
	let isRetrying = false
	
	const batchPreload = useImageBatchPreload(urls, preloadOptions)
	
	async function preloadWithRetry(): Promise<void> {
		if (isRetrying) return
		
		try {
			isRetrying = true
			await batchPreload.preload()
		} catch (error) {
			if (retryCount < maxRetries) {
				retryCount++
				await new Promise(resolve => setTimeout(resolve, retryDelay))
				return preloadWithRetry()
			}
			throw error
		} finally {
			isRetrying = false
		}
	}
	
	return {
		...batchPreload,
		preloadWithRetry,
		retryCount,
		isRetrying
	}
}