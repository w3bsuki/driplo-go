/**
 * Svelte action for preloading components and routes on interaction
 */

import { preloadRoute, shouldSplitRoute } from '$lib/utils/route-splitting';

interface PreloadOptions {
	// URL to preload
	href?: string;
	// Custom preload function
	loader?: () => Promise<any>;
	// Preload on mouseenter (default: true)
	onHover?: boolean;
	// Preload on focus (default: true)
	onFocus?: boolean;
	// Preload on touchstart (default: true)
	onTouch?: boolean;
	// Delay before preloading (ms)
	delay?: number;
}

/**
 * Svelte action to preload routes or components on user interaction
 * 
 * Usage:
 * <a href="/admin" use:preload>Admin Panel</a>
 * <button use:preload={{ loader: () => import('./HeavyComponent.svelte') }}>
 *   Open Modal
 * </button>
 */
export function preload(node: HTMLElement, options: PreloadOptions = {}) {
	const {
		href = node.getAttribute('href'),
		loader,
		onHover = true,
		onFocus = true,
		onTouch = true,
		delay = 0
	} = options;

	let timeoutId: NodeJS.Timeout | null = null;
	let preloaded = false;

	const doPreload = () => {
		if (preloaded) return;
		preloaded = true;

		if (loader) {
			// Custom loader provided
			loader().catch(err => {
				console.error('Preload failed:', err);
			});
		} else if (href && shouldSplitRoute(href)) {
			// Route-based preloading
			preloadRoute(href).catch(err => {
				console.error('Route preload failed:', err);
			});
		}
	};

	const handleInteraction = () => {
		if (delay > 0) {
			timeoutId = setTimeout(doPreload, delay);
		} else {
			doPreload();
		}
	};

	const cancelPreload = () => {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	};

	// Add event listeners
	if (onHover) {
		node.addEventListener('mouseenter', handleInteraction);
		node.addEventListener('mouseleave', cancelPreload);
	}
	if (onFocus) {
		node.addEventListener('focus', handleInteraction);
	}
	if (onTouch) {
		node.addEventListener('touchstart', handleInteraction, { passive: true });
	}

	return {
		update(newOptions: PreloadOptions) {
			Object.assign(options, newOptions);
		},
		destroy() {
			// Remove event listeners
			node.removeEventListener('mouseenter', handleInteraction);
			node.removeEventListener('mouseleave', cancelPreload);
			node.removeEventListener('focus', handleInteraction);
			node.removeEventListener('touchstart', handleInteraction);
			
			// Clear any pending timeout
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		}
	};
}