<!-- This file re-exports the refactored ListingCard component for backward compatibility -->
<script lang="ts">
	import ListingCard from './listing-card/ListingCard.svelte';
	
	// Accept all props that the ListingCard component accepts
	let props = $props();
</script>

<ListingCard {...props} />
