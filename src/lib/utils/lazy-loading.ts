import { browser } from '$app/environment';

/**
 * Enhanced lazy loading utilities for optimal image performance
 */

export interface LazyLoadingOptions {
	/** Root margin for intersection observer (default: '50px') */
	rootMargin?: string;
	/** Threshold for intersection observer (default: 0.01) */
	threshold?: number;
	/** Priority loading for above-fold images */
	priority?: boolean;
	/** Use blur-up placeholder technique */
	usePlaceholder?: boolean;
	/** Custom placeholder blur amount (default: 20px) */
	placeholderBlur?: number;
}

/**
 * Calculate optimal eager loading count based on viewport
 */
export function calculateEagerLoadCount(): number {
	if (!browser) return 8; // Default SSR value
	
	const viewportHeight = window.innerHeight;
	const viewportWidth = window.innerWidth;
	
	// Mobile: 2 columns
	if (viewportWidth < 768) {
		const cardsPerRow = 2;
		const estimatedCardHeight = 300;
		const visibleRows = Math.ceil(viewportHeight / estimatedCardHeight);
		return cardsPerRow * visibleRows + 2; // Add buffer
	}
	
	// Tablet: 3 columns
	if (viewportWidth < 1024) {
		const cardsPerRow = 3;
		const estimatedCardHeight = 350;
		const visibleRows = Math.ceil(viewportHeight / estimatedCardHeight);
		return cardsPerRow * visibleRows + 3;
	}
	
	// Desktop: 4-5 columns
	const cardsPerRow = viewportWidth < 1536 ? 4 : 5;
	const estimatedCardHeight = 400;
	const visibleRows = Math.ceil(viewportHeight / estimatedCardHeight);
	return cardsPerRow * visibleRows + cardsPerRow; // Add one row buffer
}

/**
 * Determine if user has slow connection
 */
export function isSlowConnection(): boolean {
	if (!browser) return false;
	
	const connection = (navigator as any).connection || 
		(navigator as any).mozConnection || 
		(navigator as any).webkitConnection;
	
	if (!connection) return false;
	
	// Check effective type
	if (connection.effectiveType && ['slow-2g', '2g'].includes(connection.effectiveType)) {
		return true;
	}
	
	// Check save data mode
	if (connection.saveData) {
		return true;
	}
	
	// Check downlink speed (less than 1 Mbps)
	if (connection.downlink && connection.downlink < 1) {
		return true;
	}
	
	return false;
}

/**
 * Get adaptive loading strategy based on device and connection
 */
export function getLoadingStrategy() {
	if (!browser) {
		return {
			eagerCount: 8,
			rootMargin: '50px',
			lowQualityPlaceholder: false,
			preloadNext: 0
		};
	}
	
	const slowConnection = isSlowConnection();
	const isMobile = window.innerWidth < 768;
	
	if (slowConnection) {
		return {
			eagerCount: isMobile ? 2 : 4,
			rootMargin: '0px', // Load only when visible
			lowQualityPlaceholder: true,
			preloadNext: 0 // Don't preload on slow connections
		};
	}
	
	if (isMobile) {
		return {
			eagerCount: calculateEagerLoadCount(),
			rootMargin: '100px', // Small preload buffer
			lowQualityPlaceholder: true,
			preloadNext: 2
		};
	}
	
	// Desktop with good connection
	return {
		eagerCount: calculateEagerLoadCount(),
		rootMargin: '200px', // Larger preload buffer
		lowQualityPlaceholder: false,
		preloadNext: 4
	};
}

/**
 * Generate blur placeholder data URL
 */
export function generatePlaceholder(width: number = 40, height: number = 40): string {
	// Simple gradient placeholder
	return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23f0f0f0'/%3E%3Cstop offset='100%25' style='stop-color:%23e0e0e0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='${width}' height='${height}' fill='url(%23g)'/%3E%3C/svg%3E`;
}

/**
 * Check if native lazy loading is supported
 */
export function supportsNativeLazyLoading(): boolean {
	if (!browser) return false;
	return 'loading' in HTMLImageElement.prototype;
}

/**
 * Preload image with priority hints
 */
export function preloadImage(src: string, priority: 'high' | 'low' = 'low'): void {
	if (!browser) return;
	
	const link = document.createElement('link');
	link.rel = 'preload';
	link.as = 'image';
	link.href = src;
	
	if (priority === 'high') {
		link.setAttribute('fetchpriority', 'high');
	}
	
	document.head.appendChild(link);
}

/**
 * Create optimized srcset for responsive images
 */
export function createSrcSet(baseUrl: string, sizes: number[]): string {
	return sizes
		.map(size => `${baseUrl}?width=${size} ${size}w`)
		.join(', ');
}

/**
 * Get optimal sizes attribute based on viewport
 */
export function getSizesAttribute(defaultSize: string = '100vw'): string {
	return `
		(max-width: 640px) 50vw,
		(max-width: 768px) 33vw,
		(max-width: 1024px) 25vw,
		(max-width: 1536px) 20vw,
		${defaultSize}
	`.trim();
}