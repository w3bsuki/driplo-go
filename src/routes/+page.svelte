<script lang="ts">
	import type { PageData } from './$types';
	import ListingGrid from '$lib/components/listings/ListingGrid.svelte';
	import HeroSearch from '$lib/components/home/HeroSearch.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { debug } from '$lib/utils/debug-logger';
	import { onMount } from 'svelte';
	
	let { data }: { data: PageData } = $props();
	
	onMount(() => {
		debug.group('Main Page Data', () => {
			debug.log('Page data received', {
				component: 'MainPage',
				data: {
					categoriesCount: data.categories?.length || 0,
					featuredListingsCount: data.featuredListings?.length || 0,
					popularListingsCount: data.popularListings?.length || 0,
					topSellersCount: data.topSellers?.length || 0
				}
			});
			
			debug.log('Featured listings detail', {
				component: 'MainPage',
				data: data.featuredListings
			});
			
			debug.log('Popular listings detail', {
				component: 'MainPage',
				data: data.popularListings
			});
		});
		
		// Enable debug mode automatically
		debug.enable('*');
	});
</script>

<HeroSearch categories={data.categories} />
<ListingGrid title={m.home_featured_title()} listings={data.featuredListings} />
<ListingGrid title={m.home_most_viewed_title()} listings={data.popularListings} />

