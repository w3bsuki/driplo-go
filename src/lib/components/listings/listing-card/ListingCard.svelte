<script lang="ts">
	import { cn } from '$lib/utils';
	import ListingCardImage from './ListingCardImage.svelte';
	import ListingCardInfo from './ListingCardInfo.svelte';
	import ListingCardActions from './ListingCardActions.svelte';
	import { useLikeToggle } from './useLikeToggle.svelte.ts';
	import * as m from '$lib/paraglide/messages.js';
	
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
		isSold?: boolean;
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
		eagerLoading = false,
		isSold = false
	}: Props = $props();
	
	// Use like toggle hook
	const { liked, likeCount, likeLoading, apiError, handleToggleLike } = useLikeToggle({
		id,
		initialLiked: isLiked,
		initialLikes: likes
	});
</script>

<article class="relative bg-[var(--color-surface-primary)] rounded-[var(--border-radius-sm)] border border-[var(--color-border-primary)] hover:border-[var(--color-border-hover)] transition-all duration-[var(--transition-duration-100)] group product-card shadow-none hover:shadow-[var(--box-shadow-sm)]">
	<a 
		href="/listings/{id}" 
		class="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-1 rounded-[var(--border-radius-sm)] no-underline"
		aria-label={m.listing_view_details({ title })}
	>
		<ListingCardImage
			{title}
			{image}
			{imageUrls}
			{condition}
			{eagerLoading}
			{isSold}
		/>
		
		<ListingCardInfo
			{title}
			{price}
			{size}
			{brand}
			{seller}
			{likeCount}
			{eagerLoading}
		/>
	</a>
	
	<ListingCardActions
		{liked}
		{likeLoading}
		onToggleLike={handleToggleLike}
	/>
	
	{#if apiError}
		<div class="absolute bottom-0 left-0 right-0 bg-[var(--color-error-500)]/95 text-[var(--color-white)] text-[var(--font-size-sm)] p-[var(--spacing-2)] rounded-b-[var(--border-radius-sm)] animate-in slide-in-from-bottom-1 duration-[var(--transition-duration-200)]" role="alert">
			{apiError}
		</div>
	{/if}
</article>

<style>
	/* Modern 2025 hover interactions with spring physics */
	@media (hover: hover) and (pointer: fine) {
		article:hover {
			transform: translateY(-1px);
			transition: transform 150ms cubic-bezier(0.5, 1.25, 0.75, 1.25);
		}
	}

	/* Touch devices get scale feedback */
	@media (hover: none) and (pointer: coarse) {
		article:active {
			transform: scale(0.98);
			transition: transform 100ms ease-out;
		}
	}

	/* Respect reduced motion preferences */
	@media (prefers-reduced-motion: reduce) {
		article,
		article * {
			transition-duration: 0.01ms !important;
			animation-duration: 0.01ms !important;
		}
	}

	/* Enhance focus-visible for better accessibility */
	article a:focus-visible {
		transform: translateY(-1px);
		transition: transform 150ms cubic-bezier(0.5, 1.25, 0.75, 1.25);
	}
</style>