import { browser } from '$app/environment';
import type { LazyLoadingOptions } from '$lib/utils/lazy-loading';

/**
 * Svelte action for lazy loading images with advanced features
 * Usage: <img use:lazyLoad={{ rootMargin: '100px' }} data-src="image.jpg" />
 */
export function lazyLoad(node: HTMLImageElement, options: LazyLoadingOptions = {}) {
	if (!browser) return;
	
	// Default options
	const config = {
		rootMargin: options.rootMargin || '50px',
		threshold: options.threshold || 0.01,
		usePlaceholder: options.usePlaceholder ?? true
	};
	
	// Store original src
	const originalSrc = node.dataset['src'] || node.src;
	const originalSrcset = node.dataset['srcset'] || node.srcset;
	
	// Check if native lazy loading is supported and enabled
	if ('loading' in HTMLImageElement.prototype && node.loading === 'lazy') {
		// Just set the src and let browser handle it
		if (node.dataset['src']) {
			node.src = node.dataset['src'];
		}
		if (node.dataset['srcset']) {
			node.srcset = node.dataset['srcset'];
		}
		return;
	}
	
	// Create intersection observer
	const observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				// Load the image
				loadImage(node, originalSrc, originalSrcset);
				observer.unobserve(node);
			}
		});
	}, {
		rootMargin: config.rootMargin,
		threshold: config.threshold
	});
	
	// Start observing
	observer.observe(node);
	
	// Cleanup
	return {
		destroy() {
			observer.unobserve(node);
		}
	};
}

/**
 * Load image with optional placeholder transition
 */
function loadImage(img: HTMLImageElement, src: string, srcset?: string) {
	// Add loading class
	img.classList.add('lazy-loading');
	
	// Create a new image to preload
	const tempImg = new Image();
	
	// Handle successful load
	tempImg.onload = () => {
		img.src = src;
		if (srcset) {
			img.srcset = srcset;
		}
		img.classList.remove('lazy-loading');
		img.classList.add('lazy-loaded');
		
		// Dispatch custom event
		img.dispatchEvent(new CustomEvent('lazyloaded', {
			detail: { src, srcset }
		}));
	};
	
	// Handle error
	tempImg.onerror = () => {
		img.classList.remove('lazy-loading');
		img.classList.add('lazy-error');
		
		// Dispatch error event
		img.dispatchEvent(new CustomEvent('lazyerror', {
			detail: { src, srcset }
		}));
	};
	
	// Start loading
	tempImg.src = src;
	if (srcset) {
		tempImg.srcset = srcset;
	}
}

/**
 * Batch lazy load action for multiple images
 * Optimizes observer creation for many images
 */
export function lazyLoadBatch(container: HTMLElement, options: LazyLoadingOptions = {}) {
	if (!browser) return;
	
	const images = container.querySelectorAll<HTMLImageElement>('img[data-src], img[loading="lazy"]');
	const observers: IntersectionObserver[] = [];
	
	images.forEach(img => {
		const cleanup = lazyLoad(img, options);
		if (cleanup) {
			observers.push(cleanup as any);
		}
	});
	
	return {
		destroy() {
			observers.forEach(observer => observer.disconnect());
		}
	};
}