<script lang="ts">
	import { Building2, Search, Filter, ChevronDown } from 'lucide-svelte';
	import TopBrands from '$lib/components/brands/TopBrands.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData
	}

	let { data }: Props = $props();

	let searchTerm = $state('');
	let selectedCategory = $state('all');
	let sortBy = $state('popular');
	let showFilters = $state(false);

	const categories = [
		{ value: 'all', label: 'All Categories' },
		{ value: 'Local Artisan', label: 'Local Artisans' },
		{ value: 'Startup Brand', label: 'Startup Brands' },
		{ value: 'Established Brand', label: 'Established Brands' },
		{ value: 'Vintage Collector', label: 'Vintage Collectors' },
		{ value: 'Custom/Handmade', label: 'Custom/Handmade' },
		{ value: 'Boutique', label: 'Boutiques' },
		{ value: 'Designer Brand', label: 'Designer Brands' },
		{ value: 'Sustainable Fashion', label: 'Sustainable Fashion' },
		{ value: 'Streetwear', label: 'Streetwear' },
		{ value: 'Luxury Fashion', label: 'Luxury Fashion' }
	];

	const sortOptions = [
		{ value: 'popular', label: 'Most Popular' },
		{ value: 'rating', label: 'Highest Rated' },
		{ value: 'sales', label: 'Best Sellers' },
		{ value: 'newest', label: 'Recently Added' }
	];
</script>

<svelte:head>
	<title>Browse Brands | Driplo</title>
	<meta name="description" content="Discover verified fashion brands on Driplo" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Hero Section -->
	<div class="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
			<div class="text-center">
				<Building2 class="w-16 h-16 mx-auto mb-4" />
				<h1 class="text-4xl font-bold mb-4">Discover Amazing Brands</h1>
				<p class="text-xl text-purple-100 max-w-2xl mx-auto">
					Shop from verified fashion brands, local artisans, and emerging designers
				</p>
			</div>

			<!-- Search Bar -->
			<div class="mt-8 max-w-2xl mx-auto">
				<div class="relative">
					<Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
					<input
						type="text"
						bind:value={searchTerm}
						placeholder="Search brands..."
						class="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 placeholder-gray-500
							focus:ring-4 focus:ring-white/20 focus:outline-none"
					/>
				</div>
			</div>

			<!-- Quick Stats -->
			<div class="grid grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto">
				<div class="text-center">
					<p class="text-3xl font-bold">500+</p>
					<p class="text-purple-100">Verified Brands</p>
				</div>
				<div class="text-center">
					<p class="text-3xl font-bold">50K+</p>
					<p class="text-purple-100">Products Listed</p>
				</div>
				<div class="text-center">
					<p class="text-3xl font-bold">4.8</p>
					<p class="text-purple-100">Average Rating</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Filters Bar -->
	<div class="sticky top-0 z-10 bg-white shadow-sm">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between py-4">
				<div class="flex items-center gap-4">
					<!-- Category Filter -->
					<div class="relative">
						<select
							bind:value={selectedCategory}
							class="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg
								focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							{#each categories as category}
								<option value={category.value}>{category.label}</option>
							{/each}
						</select>
						<ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
					</div>

					<!-- Sort Options -->
					<div class="relative">
						<select
							bind:value={sortBy}
							class="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg
								focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							{#each sortOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
						<ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
					</div>
				</div>

				<button
					onclick={() => showFilters = !showFilters}
					class="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
				>
					<Filter class="w-4 h-4" />
					<span class="hidden sm:inline">More Filters</span>
				</button>
			</div>

			{#if showFilters}
				<div class="pb-4 border-t pt-4">
					<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
						<label class="flex items-center gap-2">
							<input type="checkbox" class="rounded" />
							<span class="text-sm text-gray-700">Local Brands Only</span>
						</label>
						<label class="flex items-center gap-2">
							<input type="checkbox" class="rounded" />
							<span class="text-sm text-gray-700">Sustainable</span>
						</label>
						<label class="flex items-center gap-2">
							<input type="checkbox" class="rounded" />
							<span class="text-sm text-gray-700">Ships Internationally</span>
						</label>
						<label class="flex items-center gap-2">
							<input type="checkbox" class="rounded" />
							<span class="text-sm text-gray-700">New Arrivals</span>
						</label>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Brands Content -->
	<TopBrands brands={data.topBrands} />

	<!-- CTA Section -->
	<div class="bg-gradient-to-r from-purple-100 to-blue-100 py-16 mt-16">
		<div class="max-w-4xl mx-auto text-center px-4">
			<h2 class="text-3xl font-bold text-gray-900 mb-4">Are You a Fashion Brand?</h2>
			<p class="text-lg text-gray-700 mb-8">
				Join Driplo to reach thousands of fashion enthusiasts and grow your business
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a 
					href="/onboarding"
					class="px-8 py-3 bg-purple-600 text-white font-medium rounded-lg
						hover:bg-purple-700 transition-colors"
				>
					Create Brand Account
				</a>
				<a 
					href="/help/brands"
					class="px-8 py-3 bg-white text-purple-600 font-medium rounded-lg
						hover:bg-gray-50 transition-colors"
				>
					Learn More
				</a>
			</div>
		</div>
	</div>
</div>