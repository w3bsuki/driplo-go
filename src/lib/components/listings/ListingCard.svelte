<script lang="ts">
	import { Heart } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { Badge } from '$lib/components/ui';
	import BrandBadge from '$lib/components/ui/BrandBadge.svelte';
	import ConditionBadge from '$lib/components/badges/ConditionBadge.svelte';
	import * as m from '$lib/paraglide/messages.js';
	
	// Constants
	const PRICE_CURRENCY = 'GBP';
	const PRICE_LOCALE = 'en-GB';
	const AVATAR_GRADIENT_COLORS = [
		'from-blue-500 to-purple-500',
		'from-green-500 to-blue-500', 
		'from-blue-300 to-red-500',
		'from-purple-500 to-pink-500',
		'from-yellow-500 to-blue-300',
		'from-pink-500 to-red-500'
	];
	const API_RETRY_DELAY = 1000;
	const API_MAX_RETRIES = 2;
	
	interface Props {
		id: string;
		title: string;
		price: number;
		size?: string;
		brand?: string;
		image: string | string[] | Record<string, string>;
		imageUrls?: string[] | Record<string, string>;
		seller: {
			username: string;
			avatar?: string;
			account_type?: string;
			is_verified?: boolean;
		};
		likes?: number;
		isLiked?: boolean;
		condition?: string | null;
		eagerLoading?: boolean;
	}
	
	let { 
		id, 
		title, 
		price, 
		size, 
		brand, 
		image, 
		imageUrls, 
		seller, 
		likes = 0, 
		isLiked = false, 
		condition, 
		eagerLoading = false 
	}: Props = $props();
	
	// State
	let liked = $state(isLiked);
	let likeCount = $state(likes);
	let likeLoading = $state(false);
	let imageError = $state(false);
	let apiError = $state<string | null>(null);
	
	// Derived values
	const primaryImageUrl = $derived(() => {
		const img = imageUrls || image;
		if (!img) return null;
		if (Array.isArray(img)) return img[0];
		if (typeof img === 'object' && img !== null) return Object.values(img)[0];
		return img;
	});
	
	const formattedPrice = $derived(formatPrice(price));
	const avatarGradient = $derived(getAvatarGradient(seller.username));
	
	// Helper functions
	function formatPrice(price: number): string {
		return new Intl.NumberFormat(PRICE_LOCALE, {
			style: 'currency',
			currency: PRICE_CURRENCY,
			minimumFractionDigits: 0,
			maximumFractionDigits: 2
		}).format(price);
	}

	function getAvatarGradient(username: string): string {
		const index = username.charCodeAt(0) % AVATAR_GRADIENT_COLORS.length;
		return AVATAR_GRADIENT_COLORS[index];
	}

	async function handleToggleLike(e: MouseEvent) {
		e.preventDefault();
		if (likeLoading) return;
		
		likeLoading = true;
		apiError = null;
		
		// Store original state for rollback
		const originalLiked = liked;
		const originalCount = likeCount;
		
		// Optimistic update
		liked = !liked;
		likeCount = liked ? likeCount + 1 : likeCount - 1;
		
		try {
			const response = await fetchWithRetry('/api/wishlist', {
				method: liked ? 'POST' : 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					listing_id: id
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || m.listing_favorite_error());
			}
		} catch (error) {
			// Revert on error
			liked = originalLiked;
			likeCount = originalCount;
			apiError = error instanceof Error ? error.message : m.listing_favorite_error();
			console.error('Error toggling like:', error);
		} finally {
			likeLoading = false;
		}
	}
	
	async function fetchWithRetry(url: string, options: RequestInit, retries = 0): Promise<Response> {
		try {
			return await fetch(url, options);
		} catch (error) {
			if (retries < API_MAX_RETRIES) {
				await new Promise(resolve => setTimeout(resolve, API_RETRY_DELAY));
				return fetchWithRetry(url, options, retries + 1);
			}
			throw error;
		}
	}

	function handleImageError() {
		imageError = true;
	}
</script>

<article class="relative bg-white rounded-md border border-gray-200 hover:border-gray-300 transition-all duration-fast group product-card shadow-sm hover:shadow-md">
	<a 
		href="/listings/{id}" 
		class="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-md no-underline"
		aria-label={m.listing_view_details({ title })}
	>
		<div class="relative aspect-[3/4] overflow-hidden rounded-t-md bg-gray-100">
			{#if !imageError && primaryImageUrl()}
				<img
					src={primaryImageUrl()}
					alt={title}
					class="absolute inset-0 h-full w-full object-cover transition-transform duration-base group-hover:scale-105"
					loading={eagerLoading ? 'eager' : 'lazy'}
					onerror={handleImageError}
					sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
				/>
			{:else}
				<div class="h-full w-full flex items-center justify-center bg-gray-100" role="img" aria-label={m.listing_no_image()}>
					<div class="text-center">
						<div class="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-md flex items-center justify-center">
							<span class="text-lg" aria-hidden="true">📷</span>
						</div>
						<p class="text-sm text-gray-500">{m.listing_no_image()}</p>
					</div>
				</div>
			{/if}
			
			<button
				onclick={handleToggleLike}
				class={cn(
					"absolute top-2 right-2 w-8 h-8 rounded-md bg-white/95 backdrop-blur-sm border border-gray-200 hover:border-gray-300 transition-all duration-fast flex items-center justify-center active:scale-95 shadow-sm",
					"focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
					likeLoading && "opacity-50 cursor-not-allowed"
				)}
				aria-label={liked ? m.listing_unlike() : m.listing_like()}
				aria-pressed={liked}
				disabled={likeLoading}
				type="button"
			>
				<Heart 
					class={cn("h-4 w-4", liked ? "fill-red-500 text-red-500" : "text-gray-600")} 
					aria-hidden="true"
				/>
			</button>
			
			{#if condition}
				<div class="absolute top-2 left-2">
					<ConditionBadge {condition} size="sm" />
				</div>
			{/if}
		</div>
		
		<div class="p-3 space-y-1">
			<div class="flex items-start justify-between gap-2">
				<div class="flex-1 min-w-0">
					<h3 class="text-base font-medium text-gray-900 truncate leading-snug">{title}</h3>
					{#if brand}
						<p class="text-sm text-gray-600 leading-snug">{brand}</p>
					{/if}
				</div>
				<p class="text-base font-semibold text-gray-900 tabular-nums" aria-label={m.listing_price({ price: formattedPrice })}>
					{formattedPrice}
				</p>
			</div>
			
			{#if size}
				<p class="text-sm text-gray-500 leading-snug">{m.listing_size({ size })}</p>
			{/if}
			
			<div class="flex items-center gap-1.5 pt-1">
				{#if seller.avatar}
					<img
						src={seller.avatar}
						alt=""
						class="h-5 w-5 rounded-md object-cover"
						aria-hidden="true"
					/>
				{:else}
					<div 
						class="h-5 w-5 rounded-md bg-gradient-to-br {avatarGradient} flex items-center justify-center"
						aria-hidden="true"
					>
						<span class="text-xs font-medium text-white">
							{seller.username.charAt(0).toUpperCase()}
						</span>
					</div>
				{/if}
				<span class="text-sm text-gray-600 truncate">{seller.username}</span>
				{#if seller.account_type === 'brand'}
					<BrandBadge size="xs" isVerified={seller.is_verified} showText={false} />
				{/if}
				{#if likeCount > 0}
					<span class="text-sm text-gray-500 ml-auto flex items-center gap-0.5 tabular-nums" aria-live="polite">
						{likeCount}
						<Heart class="h-3 w-3 fill-current" aria-hidden="true" />
					</span>
				{/if}
			</div>
		</div>
	</a>
	
	{#if apiError}
		<div class="absolute bottom-0 left-0 right-0 bg-red-500/95 text-white text-sm p-2 rounded-b-md" role="alert">
			{apiError}
		</div>
	{/if}
</article>