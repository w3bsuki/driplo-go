<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import {
		supportsNativeLazyLoading,
		generatePlaceholder,
		createSrcSet,
		getSizesAttribute,
		type LazyLoadingOptions
	} from '$lib/utils/lazy-loading';
	import { debug } from '$lib/utils/debug-logger';
	
	let { 
		src,
		alt,
		width = undefined,
		height = undefined,
		loading = 'lazy',
		priority = false,
		sizes = getSizesAttribute(),
		srcsetSizes = [320, 640, 768, 1024, 1280, 1536],
		usePlaceholder = true,
		placeholderSrc = undefined,
		class: className = '',
		style = '',
		fetchpriority = 'auto',
		decoding = 'async',
		lazyOptions = {}
	}: {
		src: string;
		alt: string;
		width?: number | undefined;
		height?: number | undefined;
		loading?: 'lazy' | 'eager';
		priority?: boolean;
		sizes?: string;
		srcsetSizes?: number[];
		usePlaceholder?: boolean;
		placeholderSrc?: string | undefined;
		class?: string;
		style?: string;
		fetchpriority?: 'high' | 'low' | 'auto';
		decoding?: 'sync' | 'async' | 'auto';
		lazyOptions?: LazyLoadingOptions;
	} = $props();
	
	let imgElement: HTMLImageElement;
	let isLoaded = $state(false);
	let isIntersecting = $state(false);
	let hasError = $state(false);
	
	// Generate placeholder if needed
	const placeholder = placeholderSrc || (usePlaceholder ? generatePlaceholder(40, 40) : '');
	
	// Create srcset
	const srcset = createSrcSet(src, srcsetSizes);
	
	// Determine fetch priority
	if (priority) {
		fetchpriority = 'high';
		loading = 'eager';
	}
	
	// Log initial state
	debug.log('EnhancedImage initialized', {
		component: 'EnhancedImage',
		data: {
			src,
			alt,
			loading,
			priority,
			sizes,
			placeholder: placeholder ? 'yes' : 'no'
		}
	});
	
	// Handle image load
	function handleLoad() {
		debug.log('Image loaded successfully', {
			component: 'EnhancedImage',
			data: { src, alt }
		});
		isLoaded = true;
	}
	
	// Handle image error
	function handleError() {
		debug.error('Image failed to load', {
			component: 'EnhancedImage',
			data: { src, alt }
		});
		hasError = true;
		isLoaded = true;
	}
	
	// Set up intersection observer for browsers without native lazy loading
	onMount(() => {
		if (!browser || loading === 'eager' || supportsNativeLazyLoading()) {
			return;
		}
		
		const options = {
			rootMargin: lazyOptions.rootMargin || '50px',
			threshold: lazyOptions.threshold || 0.01
		};
		
		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting && !isIntersecting) {
					isIntersecting = true;
					// Force load the image
					if (imgElement) {
						imgElement.src = src;
						if (srcset) {
							imgElement.srcset = srcset;
						}
					}
				}
			});
		}, options);
		
		if (imgElement) {
			observer.observe(imgElement);
		}
		
		return () => {
			if (imgElement) {
				observer.unobserve(imgElement);
			}
		};
	});
</script>

<div 
	class="image-wrapper {className}"
	{style}
	class:loaded={isLoaded}
	class:has-error={hasError}
>
	{#if usePlaceholder && !isLoaded}
		<img
			class="placeholder"
			src={placeholder}
			alt=""
			aria-hidden="true"
			width={width || 40}
			height={height || 40}
		/>
	{/if}
	
	<img
		bind:this={imgElement}
		src={loading === 'eager' || isIntersecting ? src : placeholder}
		srcset={loading === 'eager' || isIntersecting ? srcset : undefined}
		{alt}
		{width}
		{height}
		{loading}
		{sizes}
		{fetchpriority}
		{decoding}
		onload={handleLoad}
		onerror={handleError}
		class="main-image"
		class:loading={!isLoaded}
	/>
</div>

<style>
	.image-wrapper {
		position: relative;
		overflow: hidden;
		background-color: rgb(var(--color-gray-100));
	}
	
	.placeholder {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		filter: blur(1.25rem);
		transform: scale(1.1);
		object-fit: cover;
	}
	
	.main-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: opacity 0.3s ease-in-out;
	}
	
	.main-image.loading {
		opacity: 0;
	}
	
	.image-wrapper.loaded .main-image {
		opacity: 1;
	}
	
	.image-wrapper.has-error {
		background-color: rgb(var(--color-gray-200));
	}
	
	.image-wrapper.has-error::after {
		content: '🖼️';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 2rem;
		opacity: 0.5;
	}
</style>