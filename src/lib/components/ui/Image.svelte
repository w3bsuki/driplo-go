<script lang="ts">
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';
	import { 
		parseStorageUrl, 
		generatePictureSources,
		getTransformedImageUrl
	} from '$lib/utils/supabase-image-transform';
	import { 
		getOptimizedImageUrl, 
		imageSizes,
		type ImageTransformOptions 
	} from '$lib/utils/supabase-images';
	import { getResponsiveImageUrl } from '$lib/utils/responsive-image';

	interface Props {
		// Source can be string, Supabase URL, or object with size variants
		src: string | Record<string, string> | null | undefined;
		alt: string;
		
		// Layout and styling
		class?: string;
		aspectRatio?: string;
		objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
		width?: number;
		height?: number;
		
		// Size presets (for Supabase images)
		size?: keyof typeof imageSizes;
		
		// Responsive sizes
		sizes?: string;
		
		// Loading behavior
		loading?: 'lazy' | 'eager';
		priority?: boolean; // High priority images get eager loading + preload
		fetchpriority?: 'high' | 'low' | 'auto';
		decoding?: 'sync' | 'async' | 'auto';
		
		// Image optimization
		quality?: number;
		widths?: number[];
		formats?: Array<'avif' | 'webp' | 'jpg'>;
		preferredSize?: 'thumb' | 'small' | 'medium' | 'large' | 'full';
		customOptions?: ImageTransformOptions;
		
		// Fallback and error handling
		fallbackSrc?: string;
		usePlaceholder?: boolean;
		
		// Events
		onload?: () => void;
		onerror?: (e: Event) => void;
		onclick?: () => void;
	}

	let {
		src,
		alt,
		class: className,
		aspectRatio = '1/1',
		objectFit = 'cover',
		width,
		height,
		size = 'card',
		sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
		loading = 'lazy',
		priority = false,
		fetchpriority = 'auto',
		decoding = 'async',
		quality = 80,
		widths = [400, 800, 1200, 1600],
		formats = ['avif', 'webp'],
		preferredSize = 'medium',
		customOptions = {},
		fallbackSrc = '/images/placeholder.jpg',
		usePlaceholder = true,
		onload,
		onerror,
		onclick
	}: Props = $props();

	let isLoaded = $state(false);
	let hasError = $state(false);
	let isIntersecting = $state(priority || loading === 'eager');
	let imgElement: HTMLImageElement | HTMLDivElement;

	// Determine if this is a Supabase storage URL
	const isSupabaseUrl = $derived(() => {
		if (!src || typeof src !== 'string') return false;
		return src.includes('/storage/v1/object/public/');
	});

	// Get the appropriate image URL based on source type
	const imageUrl = $derived(() => {
		if (hasError) return fallbackSrc;
		if (!src) return fallbackSrc;
		
		// Handle object with size variants
		if (typeof src === 'object') {
			return getResponsiveImageUrl(src, preferredSize);
		}
		
		// Handle Supabase URLs with optimization
		if (isSupabaseUrl() && size) {
			return getOptimizedImageUrl(src, size, customOptions);
		}
		
		return src;
	});

	// Parse storage info for Supabase images
	const storageInfo = $derived(() => {
		if (!isSupabaseUrl() || typeof src !== 'string') return null;
		return parseStorageUrl(src);
	});

	// Generate picture sources for modern formats (Supabase only)
	const pictureSources = $derived(() => {
		if (!storageInfo() || hasError || !isSupabaseUrl()) return [];
		
		return generatePictureSources(storageInfo()!.bucket, storageInfo()!.path, {
			widths,
			formats,
			quality
		});
	});

	// Generate srcset based on source type
	const srcSet = $derived(() => {
		if (hasError) return undefined;
		
		// For object sources with variants
		if (typeof src === 'object' && src !== null) {
			const srcSetParts: string[] = [];
			const suffixWidths: Record<string, number> = {
				thumb: 150,
				small: 400,
				medium: 800,
				large: 1200,
				full: 2400
			};

			for (const [suffix, url] of Object.entries(src)) {
				const width = suffixWidths[suffix];
				if (width && url) {
					srcSetParts.push(`${url} ${width}w`);
				}
			}

			return srcSetParts.length > 0 ? srcSetParts.join(', ') : undefined;
		}
		
		// For Supabase URLs
		if (storageInfo() && isSupabaseUrl()) {
			return widths
				.map(w => {
					const url = getTransformedImageUrl({
						bucket: storageInfo()!.bucket,
						path: storageInfo()!.path,
						width: w,
						quality,
						format: 'jpg'
					});
					return `${url} ${w}w`;
				})
				.join(', ');
		}
		
		return undefined;
	});

	// Placeholder for lazy loading
	const placeholderUrl = $derived(() => {
		if (!usePlaceholder || isIntersecting) return imageUrl();
		
		// Generate a small blurred placeholder for Supabase images
		if (storageInfo() && isSupabaseUrl()) {
			return getTransformedImageUrl({
				bucket: storageInfo()!.bucket,
				path: storageInfo()!.path,
				width: 40,
				quality: 20,
				format: 'jpg'
			});
		}
		
		// Use data URL placeholder for non-Supabase images
		return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width || 1} ${height || 1}'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E`;
	});

	function handleLoad() {
		isLoaded = true;
		onload?.();
	}

	function handleError(e: Event) {
		console.error('Image failed to load:', src);
		hasError = true;
		onerror?.(e);
	}

	// Set up intersection observer for lazy loading
	onMount(() => {
		if (priority || loading === 'eager' || !imgElement) return;
		
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						isIntersecting = true;
						observer.disconnect();
					}
				});
			},
			{
				rootMargin: '50px',
				threshold: 0.01
			}
		);
		
		observer.observe(imgElement);
		
		return () => observer.disconnect();
	});

	// Preload high priority images
	onMount(() => {
		if (priority && storageInfo() && isSupabaseUrl()) {
			const link = document.createElement('link');
			link.rel = 'preload';
			link.as = 'image';
			link.href = getTransformedImageUrl({
				bucket: storageInfo()!.bucket,
				path: storageInfo()!.path,
				width: widths[widths.length - 1],
				quality,
				format: 'webp'
			});
			link.type = 'image/webp';
			document.head.appendChild(link);
			
			return () => {
				document.head.removeChild(link);
			};
		}
		return;
	});

	// Computed loading and priority attributes
	const computedLoading = $derived(priority ? 'eager' : loading);
	const computedFetchPriority = $derived(priority ? 'high' : fetchpriority);
	const computedDecoding = $derived(priority ? 'sync' : decoding);
</script>

<div 
	class={cn('relative overflow-hidden', className)}
	style:aspect-ratio={aspectRatio}
>
	{#if !isLoaded && isIntersecting}
		<div class="absolute inset-0 bg-muted animate-pulse" aria-hidden="true"></div>
	{/if}
	
	{#if isIntersecting}
		{#if pictureSources().length > 0 && isSupabaseUrl()}
			<!-- Modern format support with picture element -->
			<picture>
				{#each pictureSources() as source}
					<source 
						type={source.type} 
						srcset={source.srcset}
						{sizes}
					/>
				{/each}
				
				<img
					bind:this={imgElement}
					src={imageUrl()}
					srcset={srcSet()}
					{alt}
					{sizes}
					{width}
					{height}
					loading={computedLoading}
					fetchpriority={computedFetchPriority}
					decoding={computedDecoding}
					class={cn(
						'w-full h-full transition-opacity duration-300',
						!isLoaded && 'opacity-0',
						isLoaded && 'opacity-100'
					)}
					style:object-fit={objectFit}
					onload={handleLoad}
					onerror={handleError}
					{onclick}
				/>
			</picture>
		{:else}
			<!-- Standard img for non-Supabase images -->
			<img
				bind:this={imgElement}
				src={imageUrl()}
				srcset={srcSet()}
				{alt}
				{sizes}
				{width}
				{height}
				loading={computedLoading}
				fetchpriority={computedFetchPriority}
				decoding={computedDecoding}
				class={cn(
					'w-full h-full transition-opacity duration-300',
					!isLoaded && 'opacity-0',
					isLoaded && 'opacity-100'
				)}
				style:object-fit={objectFit}
				onload={handleLoad}
				onerror={handleError}
				{onclick}
			/>
		{/if}
	{:else}
		<!-- Placeholder while loading -->
		<div
			bind:this={imgElement}
			class={cn(
				'w-full h-full bg-muted animate-pulse',
				className
			)}
			style:aspect-ratio={aspectRatio}
			aria-label={alt}
		/>
	{/if}
	
	{#if hasError}
		<!-- Error state -->
		<div class="absolute inset-0 flex items-center justify-center bg-gray-100">
			<svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
					d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
			</svg>
		</div>
	{/if}
</div>

<style>
	@keyframes pulse {
		0%, 100% {
			opacity: 0.4;
		}
		50% {
			opacity: 0.6;
		}
	}

	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>