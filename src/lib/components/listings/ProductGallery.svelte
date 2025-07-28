<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import Image from '$lib/components/ui/Image.svelte';
	import { focusTrap } from '$lib/utils/focus-trap';

	let {
		images,
		listingTitle,
		status
	}: {
		images: string[];
		listingTitle: string;
		status: 'available' | 'sold' | 'archived';
	} = $props();

	let currentImageIndex = $state(0);
	let showFullscreen = $state(false);

	const dispatch = createEventDispatcher();

	const hasMultipleImages = $derived(images.length > 1);

	function nextImage() {
		currentImageIndex = (currentImageIndex + 1) % images.length;
	}

	function prevImage() {
		currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
	}

	function openFullscreen() {
		showFullscreen = true;
		document.body.style.overflow = 'hidden';
	}

	function closeFullscreen() {
		showFullscreen = false;
		document.body.style.overflow = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!showFullscreen) return;
		if (e.key === 'ArrowLeft') prevImage();
		if (e.key === 'ArrowRight') nextImage();
		if (e.key === 'Escape') closeFullscreen();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="space-y-2">
	<div class="relative bg-white rounded-sm border border-gray-200/60 p-2">
		<button
			onclick={openFullscreen}
			class="relative aspect-square overflow-hidden rounded-sm bg-gray-50 w-full group cursor-zoom-in"
			disabled={images.length === 0}
			aria-label="View image in fullscreen"
		>
			{#if images.length > 0 && images[currentImageIndex]}
				<Image
					src={images[currentImageIndex]}
					alt={listingTitle}
					class="w-full h-full transition-transform duration-200 group-hover:scale-[1.02]"
					aspectRatio="1/1"
					objectFit="contain"
					preferredSize="large"
					loading="eager"
					priority={true}
				/>
			{:else}
				<div class="w-full h-full bg-gray-100 flex items-center justify-center">
					<span class="text-gray-400">No image available</span>
				</div>
			{/if}

			<div class="absolute bottom-2 right-2 bg-black/60 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
				<Maximize2 class="w-4 h-4" />
			</div>

			{#if status === 'sold'}
				<div class="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
					Sold
				</div>
			{/if}

			{#if hasMultipleImages}
				<button
					onclick={(e) => { e.stopPropagation(); prevImage(); }}
					class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center border border-gray-200 hover:bg-white transition-all duration-100"
					aria-label="Previous image"
				>
					<ChevronLeft class="w-4 h-4" />
				</button>
				<button
					onclick={(e) => { e.stopPropagation(); nextImage(); }}
					class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center border border-gray-200 hover:bg-white transition-all duration-100"
					aria-label="Next image"
				>
					<ChevronRight class="w-4 h-4" />
				</button>

				<div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
					{#each images as _, index (index)}
						<button
							onclick={(e) => { e.stopPropagation(); currentImageIndex = index; }}
							class={cn("w-1 h-1 rounded-full transition-all", index === currentImageIndex ? "bg-white w-4" : "bg-white/60")}
							aria-label="Go to image {index + 1}"
						/>
					{/each}
				</div>
			{/if}
		</button>
	</div>

	{#if hasMultipleImages}
		<div class="flex gap-1.5 overflow-x-auto scrollbar-hide">
			{#each images as image, index (index)}
				<button
					onclick={() => currentImageIndex = index}
					class={cn("flex-shrink-0 w-12 h-12 rounded overflow-hidden border transition-all", index === currentImageIndex ? "border-primary" : "border-gray-200 opacity-80 hover:opacity-100")}
					aria-label="View image {index + 1}"
				>
					<Image src={image} alt="Product thumbnail {index + 1}" class="w-full h-full" objectFit="cover" preferredSize="thumb" loading="lazy" />
				</button>
			{/each}
		</div>
	{/if}
</div>

{#if showFullscreen}
	<div
		class="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
		onclick={closeFullscreen}
		role="dialog"
		aria-modal="true"
		aria-labelledby="fullscreen-gallery-title"
	>
		<h2 id="fullscreen-gallery-title" class="sr-only">Image gallery</h2>
		<div 
			class="relative w-full h-full flex items-center justify-center p-3" 
			onclick|stopPropagation
			use:focusTrap={{ enabled: showFullscreen, onDeactivate: closeFullscreen }}
		>
			<button
				onclick={closeFullscreen}
				class="absolute top-3 right-3 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
				aria-label="Close fullscreen gallery"
			>
				<X class="w-6 h-6" />
			</button>

			<div class="relative max-w-full max-h-full">
				<Image
					src={images[currentImageIndex]}
					alt={listingTitle}
					class="max-w-full max-h-[90vh]"
					objectFit="contain"
					preferredSize="full"
					loading="eager"
				/>
			</div>

			{#if hasMultipleImages}
				<button
					onclick|stopPropagation={prevImage}
					class="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors duration-100"
					aria-label="Previous image"
				>
					<ChevronLeft class="w-6 h-6" />
				</button>
				<button
					onclick|stopPropagation={nextImage}
					class="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors duration-100"
					aria-label="Next image"
				>
					<ChevronRight class="w-6 h-6" />
				</button>
			{/if}
		</div>
	</div>
{/if}
