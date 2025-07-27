<script lang="ts">
	import ListingCard from './ListingCard.svelte';
	import InfiniteScroll from '$lib/components/ui/InfiniteScroll.svelte';
	// import VirtualGrid from '$lib/components/ui/VirtualGrid.svelte';
	import { getLoadingStrategy } from '$lib/utils/lazy-loading';
	import * as m from '$lib/paraglide/messages.js';
	import { browser } from '$app/environment';
	
	// Constants
	const RESPONSIVE_BREAKPOINTS = {
		'2xl': { width: 1536, columns: 6 }, // Reduced from 8 for better readability
		xl: { width: 1280, columns: 5 },
		lg: { width: 1024, columns: 4 },
		md: { width: 768, columns: 3 },
		sm: { width: 640, columns: 2 },
		default: { width: 0, columns: 2 }
	};
	
	const SKELETON_COUNT = 8;
	const VIRTUAL_SCROLL_THRESHOLD = 50;
	
	type ListingData = {
		id: string;
		title: string;
		price: number;
		size?: string;
		brand?: string;
		images?: string[];
		image_urls?: string[];
		seller?: {
			username: string;
			avatar_url?: string;
			account_type?: string;
			is_verified?: boolean;
		};
		favorite_count?: number;
		condition?: string | null;
		status: string;
		created_at: string;
		view_count?: number;
	};

	interface Props {
		title?: string;
		listings: ListingData[];
		showLoading?: boolean;
		infiniteScroll?: boolean;
		hasMore?: boolean;
		onLoadMore?: () => Promise<void> | void;
		userFavorites?: string[];
		useVirtualScrolling?: boolean;
		virtualScrollHeight?: number;
		showEmptyState?: boolean;
		isLoading?: boolean;
		error?: string | null;
	}
	
	let { 
		title = m.home_featured_title(), 
		listings = [],
		showLoading = false,
		infiniteScroll = false,
		hasMore = false,
		onLoadMore,
		userFavorites = [],
		useVirtualScrolling = false,
		virtualScrollHeight = 600,
		showEmptyState = true,
		isLoading = false,
		error = null
	}: Props = $props();
	
	// State
	let windowWidth = $state(browser ? window.innerWidth : 1024);
	
	// Update window width on resize
	$effect(() => {
		if (!browser) return;
		
		const handleResize = () => {
			windowWidth = window.innerWidth;
		};
		
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});
	
	// Derived values
	const transformedListings = $derived(transformListings(listings));
	const shouldUseVirtualScrolling = $derived(useVirtualScrolling && transformedListings.length > VIRTUAL_SCROLL_THRESHOLD);
	const columns = $derived(getResponsiveColumns(windowWidth));
	const loadingStrategy = $derived(getLoadingStrategy());
	const eagerLoadCount = $derived(loadingStrategy.eagerCount);
	const loading = $derived(isLoading || showLoading);
	
	// Functions
	function getResponsiveColumns(width: number): number {
		for (const [_, config] of Object.entries(RESPONSIVE_BREAKPOINTS)) {
			if (width >= config.width) return config.columns;
		}
		return RESPONSIVE_BREAKPOINTS.default.columns;
	}
	
	function transformListings(rawListings: any[]): any[] {
		if (!rawListings || rawListings.length === 0) {
			return [];
		}
		
		return rawListings.map(listing => ({
			id: listing.id,
			title: listing.title,
			price: listing.price,
			size: listing.size,
			brand: listing.brand,
			image: listing.images || listing.image_urls || [],
			imageUrls: listing.image_urls || listing.images || [],
			seller: {
				username: listing.seller?.username || listing.profiles?.username || 'user',
				avatar: listing.seller?.avatar_url || listing.profiles?.avatar_url,
				account_type: listing.seller?.account_type || listing.profiles?.account_type,
				is_verified: listing.seller?.is_verified || listing.profiles?.is_verified
			},
			likes: listing.favorite_count || 0,
			isLiked: userFavorites.includes(listing.id),
			condition: listing.condition
		}));
	}
</script>

<section class="py-2 md:py-3" aria-labelledby={title ? 'listing-grid-title' : undefined}>
	<div class="container px-4">
		{#if title}
			<h2 id="listing-grid-title" class="mb-2 text-sm font-semibold text-foreground">
				{title}
			</h2>
		{/if}
		
		{#if error && !loading}
			<!-- Error state -->
			<div class="rounded-sm border border-destructive/20 bg-destructive/10 p-2" role="alert">
				<div class="flex items-start gap-2">
					<span class="text-2xl" aria-hidden="true">⚠️</span>
					<div class="flex-1">
						<h3 class="font-medium text-destructive">{m.listing_error_title()}</h3>
						<p class="text-xs text-destructive/80 mt-1">{error}</p>
					</div>
				</div>
			</div>
		{:else if loading}
			<!-- Skeleton loader with proper grid -->
			<div 
				class="grid gap-2"
				style="grid-template-columns: repeat({columns}, minmax(0, 1fr));"
				aria-busy="true"
				aria-label={m.listing_loading()}
			>
				{#each Array(SKELETON_COUNT) as _, i (i)}
					<div class="animate-pulse">
						<div class="aspect-[3/4] bg-muted rounded-t-sm"></div>
						<div class="p-2 bg-background rounded-b-sm space-y-1">
							<div class="h-4 bg-muted rounded w-3/4"></div>
							<div class="h-3 bg-muted rounded w-1/2"></div>
							<div class="flex items-center gap-1 mt-2">
								<div class="h-5 w-5 bg-muted rounded-sm"></div>
								<div class="h-3 bg-muted rounded w-16"></div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else if transformedListings.length > 0}
			{#if false}
				<!-- Virtual scrolling disabled - VirtualGrid component missing -->
			{:else}
				<!-- Regular responsive grid -->
				<div 
					class="grid gap-2 md:gap-3"
					style="grid-template-columns: repeat({columns}, minmax(0, 1fr));"
					role="list"
				>
					{#each transformedListings as listing, index (listing.id)}
						<div role="listitem">
							<ListingCard {...listing} eagerLoading={index < eagerLoadCount} />
						</div>
					{/each}
				</div>
			{/if}
			
			{#if infiniteScroll && onLoadMore && !shouldUseVirtualScrolling}
				<InfiniteScroll 
					{hasMore} 
					loading={loading} 
					onLoadMore={onLoadMore}
					class="mt-8"
				/>
			{/if}
		{:else if showEmptyState}
			<!-- Empty state -->
			<div class="text-center py-8">
				<div class="text-5xl mb-3" aria-hidden="true">🛍️</div>
				<h3 class="text-sm font-medium text-foreground mb-2">{m.listing_empty_title()}</h3>
				<p class="text-xs text-muted-foreground mb-3">{m.listing_empty_description()}</p>
				<a 
					href="/sell" 
					class="inline-flex items-center px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-sm transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
				>
					{m.listing_start_selling()}
				</a>
			</div>
		{/if}
	</div>
</section>