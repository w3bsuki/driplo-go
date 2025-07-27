<script lang="ts">
	import { goto } from '$app/navigation';
	import TopSellers from './TopSellers.svelte';
	import SellerQuickView from './SellerQuickView.svelte';
	import type { Profile, Listing } from '$lib/types/unified';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import type { Database } from '$lib/types/database';

	interface Props {
		topSellers: Profile[];
		supabase: SupabaseClient<Database>;
	}

	let { topSellers, supabase }: Props = $props();

	let selectedSeller: Profile | null = $state(null);
	let isModalOpen = $state(false);
	let sellerTopListings: Listing[] = $state([]);
	let isLoadingListings = $state(false);

	async function handleSellerClick(seller: Profile) {
		selectedSeller = seller;
		isModalOpen = true;
		isLoadingListings = true;
		
		try {
			// Fetch seller's top listings
			const { data: listings } = await supabase
				.from('listings')
				.select(`
					*,
					seller:profiles!seller_id(username, avatar_url)
				`)
				.eq('seller_id', seller.id)
				.eq('status', 'active')
				.order('view_count', { ascending: false })
				.limit(3);

			sellerTopListings = listings || [];
		} catch (error) {
			console.error('Error fetching seller listings:', error);
			sellerTopListings = [];
		} finally {
			isLoadingListings = false;
		}
	}

	function handleCloseModal() {
		isModalOpen = false;
		selectedSeller = null;
		sellerTopListings = [];
	}

	function handleViewStore(seller: Profile) {
		goto(`/profile/${seller.username}`);
		handleCloseModal();
	}

	function handleFollowSeller(seller: Profile) {
		// TODO: Implement follow functionality
		console.log('Following seller:', seller.username);
		// This would typically call an API to follow the seller
		// For now, we'll just close the modal
		handleCloseModal();
	}
</script>

<TopSellers {topSellers} onSellerClick={handleSellerClick} />

<SellerQuickView
	seller={selectedSeller}
	topListings={sellerTopListings}
	isOpen={isModalOpen}
	onClose={handleCloseModal}
	onViewStore={handleViewStore}
	onFollowSeller={handleFollowSeller}
/>