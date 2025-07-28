/**
 * Dynamic Import Utilities for Code Splitting
 * 
 * This module provides utilities for lazy loading components and libraries
 * to improve initial page load performance.
 */

import type { ComponentType, SvelteComponent } from 'svelte';

/**
 * Lazy load a Svelte component with loading and error states
 */
export async function lazyLoadComponent<T extends SvelteComponent>(
	loader: () => Promise<{ default: ComponentType<T> }>
): Promise<ComponentType<T>> {
	try {
		const module = await loader();
		return module.default;
	} catch (error) {
		console.error('Failed to load component:', error);
		throw error;
	}
}

/**
 * Create a lazy component with built-in loading state
 */
export function createLazyComponent<T extends SvelteComponent>(
	loader: () => Promise<{ default: ComponentType<T> }>
) {
	let Component: ComponentType<T> | null = null;
	let loadingPromise: Promise<ComponentType<T>> | null = null;

	return {
		load: async () => {
			if (Component) return Component;
			if (loadingPromise) return loadingPromise;

			loadingPromise = lazyLoadComponent(loader).then(c => {
				Component = c;
				return c;
			});

			return loadingPromise;
		},
		preload: () => {
			if (!Component && !loadingPromise) {
				loadingPromise = lazyLoadComponent(loader).then(c => {
					Component = c;
					return c;
				});
			}
		},
		isLoaded: () => Component !== null
	};
}

/**
 * Preload a component when the browser is idle
 */
export function preloadWhenIdle<T extends SvelteComponent>(
	loader: () => Promise<{ default: ComponentType<T> }>
) {
	if ('requestIdleCallback' in window) {
		window.requestIdleCallback(() => {
			loader();
		});
	} else {
		// Fallback for browsers without requestIdleCallback
		setTimeout(() => {
			loader();
		}, 1);
	}
}

/**
 * Preload a component on hover/focus
 */
export function preloadOnInteraction<T extends SvelteComponent>(
	element: HTMLElement,
	loader: () => Promise<{ default: ComponentType<T> }>
) {
	let preloaded = false;

	const preload = () => {
		if (!preloaded) {
			preloaded = true;
			loader();
		}
	};

	element.addEventListener('mouseenter', preload, { once: true });
	element.addEventListener('focus', preload, { once: true });
	element.addEventListener('touchstart', preload, { once: true });
}

/**
 * Dynamic import with retry logic
 */
export async function dynamicImportWithRetry<T>(
	loader: () => Promise<T>,
	retries = 3,
	delay = 1000
): Promise<T> {
	for (let i = 0; i < retries; i++) {
		try {
			return await loader();
		} catch (error) {
			if (i === retries - 1) throw error;
			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}
	throw new Error('Failed to load module after retries');
}