<script lang="ts">
	import { cn } from '$lib/utils';
	import ConditionBadge from '$lib/components/badges/ConditionBadge.svelte';
	import EnhancedImage from '$lib/components/common/EnhancedImage.svelte';
	import { debug } from '$lib/utils/debug-logger';
	
	interface Props {
		title: string;
		image: string | string[] | Record<string, string>;
		imageUrls?: string[] | Record<string, string>;
		condition?: string | null;
		eagerLoading?: boolean;
		isSold?: boolean;
	}
	
	let { 
		title, 
		image, 
		imageUrls, 
		condition, 
		eagerLoading = false,
		isSold = false
	}: Props = $props();
	
	// State
	let imageError = $state(false);
	let currentImageIndex = $state(0);
	
	// Derived values
	const allImages = $derived.by(() => {
		const img = imageUrls || image;
		
		debug.log('Processing images', {
			component: 'ListingCardImage',
			data: {
				title,
				imageUrls,
				image,
				imgType: typeof img,
				imgValue: img
			}
		});
		
		if (!img) {
			debug.warn('No images provided', { component: 'ListingCardImage', data: { title } });
			return [];
		}
		
		let result: string[] = [];
		
		if (Array.isArray(img)) {
			result = img.filter(url => url && typeof url === 'string');
			debug.log('Processed array images', {
				component: 'ListingCardImage',
				data: { original: img, filtered: result }
			});
		} else if (typeof img === 'object' && img !== null) {
			result = Object.values(img).filter(url => url && typeof url === 'string');
			debug.log('Processed object images', {
				component: 'ListingCardImage',
				data: { original: img, filtered: result }
			});
		} else if (typeof img === 'string') {
			result = [img];
			debug.log('Processed string image', {
				component: 'ListingCardImage',
				data: { original: img, result }
			});
		}
		
		debug.log('Final images array', {
			component: 'ListingCardImage',
			data: { title, count: result.length, images: result }
		});
		
		return result;
	});
	
	const primaryImageUrl = $derived(allImages[currentImageIndex] || null);
	const hasMultipleImages = $derived(allImages.length > 1);
	
	// Event handlers
	function handleImageError() {
		debug.error('Image error handler triggered', {
			component: 'ListingCardImage',
			data: { title, currentImageUrl: primaryImageUrl }
		});
		imageError = true;
	}
	
	function handlePrevImage(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (currentImageIndex > 0) {
			currentImageIndex--;
		} else {
			currentImageIndex = allImages.length - 1;
		}
	}
	
	function handleNextImage(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (currentImageIndex < allImages.length - 1) {
			currentImageIndex++;
		} else {
			currentImageIndex = 0;
		}
	}
</script>

<div class="relative aspect-[3/4] overflow-hidden rounded-t-[var(--border-radius-sm)] bg-[var(--color-surface-tertiary)]" style="min-height: 200px;">
	{#if !imageError && primaryImageUrl}
		<EnhancedImage
			src={primaryImageUrl}
			alt={title}
			loading={eagerLoading ? 'eager' : 'lazy'}
			priority={eagerLoading}
			sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
			className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-105"
			lazyOptions={{
				rootMargin: '100px',
				threshold: 0.01
			}}
			onerror={handleImageError}
		/>
	{:else}
		<div class="h-full w-full flex items-center justify-center bg-[var(--color-surface-tertiary)]" role="img" aria-label="No image available">
			<div class="text-center">
				<div class="w-12 h-12 mx-auto mb-[var(--spacing-2)] bg-[var(--color-surface-secondary)] rounded-[var(--border-radius-sm)] flex items-center justify-center">
					<span class="text-lg" aria-hidden="true">📷</span>
				</div>
				<p class="text-[var(--font-size-sm)] text-[var(--color-text-tertiary)]">No image</p>
			</div>
		</div>
	{/if}
	
	{#if isSold}
		<div class="absolute inset-0 bg-black/60 flex items-center justify-center">
			<span class="text-white text-[var(--font-size-lg)] font-bold uppercase tracking-wide">
				SOLD OUT
			</span>
		</div>
	{/if}
	
	{#if condition}
		<div class="absolute top-[var(--spacing-2)] left-[var(--spacing-2)]">
			<ConditionBadge {condition} size="sm" />
		</div>
	{/if}
	
	{#if hasMultipleImages}
		<div class="absolute inset-x-0 bottom-0 flex items-center justify-between p-[var(--spacing-2)]">
			<button
				onclick={handlePrevImage}
				class="rounded-[var(--border-radius-sm)] bg-[var(--color-surface-primary)]/80 backdrop-blur-sm p-[var(--spacing-1)] hover:bg-[var(--color-surface-primary)]/90 transition-colors"
				aria-label="Previous image"
				type="button"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
				</svg>
			</button>
			
			<div class="flex gap-[var(--spacing-1)]">
				{#each allImages as _, index}
					<button
						onclick={() => currentImageIndex = index}
						class={cn(
							"w-1.5 h-1.5 rounded-full transition-colors",
							currentImageIndex === index 
								? "bg-[var(--color-brand-500)]" 
								: "bg-[var(--color-surface-primary)]/60"
						)}
						aria-label={`View image ${index + 1}`}
						type="button"
					/>
				{/each}
			</div>
			
			<button
				onclick={handleNextImage}
				class="rounded-[var(--border-radius-sm)] bg-[var(--color-surface-primary)]/80 backdrop-blur-sm p-[var(--spacing-1)] hover:bg-[var(--color-surface-primary)]/90 transition-colors"
				aria-label="Next image"
				type="button"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
				</svg>
			</button>
		</div>
	{/if}
</div>