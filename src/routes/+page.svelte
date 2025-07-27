<script lang="ts">
	import type { PageData } from './$types';
	import ListingGrid from '$lib/components/listings/ListingGrid.svelte';
	import HeroSearch from '$lib/components/home/HeroSearch.svelte';
	import * as m from '$lib/paraglide/messages.js';
	
	let { data }: { data: PageData } = $props();
</script>

<HeroSearch categories={data.categories} />
<ListingGrid title={m.home_featured_title()} listings={data.featuredListings} />
<ListingGrid title={m.home_most_viewed_title()} listings={data.popularListings} />
