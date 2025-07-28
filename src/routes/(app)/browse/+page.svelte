<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Search, X } from 'lucide-svelte';
	import { Button } from '$lib/components/ui';
	import ListingGrid from '$lib/components/listings/ListingGrid.svelte';
	import StickySearchBar from '$lib/components/search/StickySearchBar.svelte';
	import { cn } from '$lib/utils';
	import { throttle, debounce } from '$lib/utils/performance';
	import type { PageData } from './$types';
	import * as m from '$lib/paraglide/messages.js';
	import { createQuery } from '@tanstack/svelte-query';
	import { browser } from '$app/environment';

	let { data }: { data: PageData } = $props();

	// Search state
	let searchFocused = $state(false);
	let showQuickSearch = $state(false);
	let showStickySearch = $state(false);

	// Quick search suggestions
	const quickSearchSuggestions = [
		{ text: 'Vintage', emoji: '🕰️' },
		{ text: 'Designer', emoji: '💎' },
		{ text: 'Streetwear', emoji: '🛹' },
		{ text: 'Formal', emoji: '👔' },
		{ text: 'Shoes', emoji: '👟' },
		{ text: 'Bags', emoji: '👜' },
		{ text: 'Jewelry', emoji: '💍' },
		{ text: 'Watches', emoji: '⌚' }
	];

	// Top sellers query
	const topSellersQuery = createQuery({
		queryKey: ['topSellers', 'month'],
		queryFn: async () => {
			const response = await fetch('/api/sellers/top?period=month&limit=12');
			if (!response.ok) throw new Error('Failed to fetch top sellers');
			return response.json();
		},
		enabled: browser,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	// Reactive filter states from server data
	let searchInput = $state(data.filters.search);
	let sortBy = $state(data.filters.sortBy);
	let priceRange = $state({ 
		min: data.filters.minPrice || 0, 
		max: data.filters.maxPrice || 1000 
	});
	let selectedSizes = $state(new Set(data.filters.sizes));
	let selectedBrands = $state(new Set(data.filters.brands));
	let selectedConditions = $state(new Set(data.filters.conditions));

	// Infinite scroll state
	let allListings = $state([...data.listings]);
	let currentPage = $state(data.pagination.currentPage);
	let hasMoreItems = $state(data.pagination.hasNextPage);
	let loadingMore = $state(false);

	// Derive categories with "All" option
	const categoriesWithAll = $derived([
		{ id: '', name: m.browse_all(), slug: '', icon_url: null, parent_id: null },
		...data.categories
	]);

	// Available condition options
	const conditionOptions = [
		{ value: 'new_with_tags', label: m.condition_new_with_tags() },
		{ value: 'like_new', label: m.condition_like_new() },
		{ value: 'good', label: m.condition_good() },
		{ value: 'fair', label: m.condition_fair() },
		{ value: 'poor', label: m.condition_poor() }
	];

	const sortOptions = [
		{ value: 'recent', label: m.sort_recent() },
		{ value: 'price-low', label: m.sort_price_low() },
		{ value: 'price-high', label: m.sort_price_high() },
		{ value: 'popular', label: m.sort_popular() },
		{ value: 'liked', label: m.sort_liked() }
	];

	function buildFilterUrl(updates: Record<string, any> = {}) {
		const url = new URL($page.url);
		
		// Apply updates to current filters
		const newFilters = {
			category: updates.category ?? data.filters.category,
			subcategory: updates.subcategory ?? data.filters.subcategory,
			q: updates.search ?? searchInput?.trim(),
			min_price: updates.minPrice ?? (priceRange.min > 0 ? priceRange.min : null),
			max_price: updates.maxPrice ?? (priceRange.max < 10000 ? priceRange.max : null),
			sizes: updates.sizes ?? (selectedSizes.size > 0 ? Array.from(selectedSizes).join(',') : null),
			brands: updates.brands ?? (selectedBrands.size > 0 ? Array.from(selectedBrands).join(',') : null),
			conditions: updates.conditions ?? (selectedConditions.size > 0 ? Array.from(selectedConditions).join(',') : null),
			sort: updates.sort ?? sortBy,
			page: updates.page ?? 1 // Reset to page 1 on filter changes
		};

		// Clear existing params and set new ones
		url.search = '';
		Object.entries(newFilters).forEach(([key, value]) => {
			if (value && value !== '' && value !== 'recent') {
				url.searchParams.set(key, String(value));
			}
		});

		return url.toString();
	}

	function updateCategory(categorySlug: string) {
		goto(buildFilterUrl({ category: categorySlug || null }));
	}

	function handleSearch(query: string) {
		goto(buildFilterUrl({ search: query?.trim() || null }));
	}

	// Create debounced search handler
	const debouncedSearch = debounce((query: string) => {
		handleSearch(query);
	}, 500);

	function handleSearchInput(query: string) {
		searchInput = query;
		debouncedSearch(query);
	}

	function handleQuickSearch(suggestion: string) {
		searchInput = suggestion;
		handleSearch(suggestion);
		showQuickSearch = false;
	}

	// Clean up debounced search on unmount
	$effect(() => {
		return () => {
			debouncedSearch.cancel();
		};
	});

	// Scroll detection for sticky search bar
	$effect(() => {
		if (!browser) return;

		function handleScroll() {
			const scrollY = window.scrollY;
			// Show sticky search when scrolled past hero section (approximately 400px)
			showStickySearch = scrollY > 400;
		}

		const throttledHandleScroll = throttle(handleScroll, 100);

		window.addEventListener('scroll', throttledHandleScroll);
		handleScroll(); // Check initial position

		return () => {
			window.removeEventListener('scroll', throttledHandleScroll);
		};
	});

	function updateSort(newSort: string) {
		sortBy = newSort;
		goto(buildFilterUrl({ sort: newSort }));
	}

	function updatePriceRange() {
		goto(buildFilterUrl({ 
			minPrice: priceRange.min > 0 ? priceRange.min : null,
			maxPrice: priceRange.max < 10000 ? priceRange.max : null
		}));
	}

	function toggleSize(size: string) {
		if (selectedSizes.has(size)) {
			selectedSizes.delete(size);
		} else {
			selectedSizes.add(size);
		}
		selectedSizes = new Set(selectedSizes);
		goto(buildFilterUrl({ sizes: selectedSizes.size > 0 ? Array.from(selectedSizes).join(',') : null }));
	}

	function toggleBrand(brand: string) {
		if (selectedBrands.has(brand)) {
			selectedBrands.delete(brand);
		} else {
			selectedBrands.add(brand);
		}
		selectedBrands = new Set(selectedBrands);
		goto(buildFilterUrl({ brands: selectedBrands.size > 0 ? Array.from(selectedBrands).join(',') : null }));
	}

	function toggleCondition(condition: string) {
		if (selectedConditions.has(condition)) {
			selectedConditions.delete(condition);
		} else {
			selectedConditions.add(condition);
		}
		selectedConditions = new Set(selectedConditions);
		goto(buildFilterUrl({ conditions: selectedConditions.size > 0 ? Array.from(selectedConditions).join(',') : null }));
	}

	function clearAllFilters() {
		goto('/browse');
	}


	// Size options
	const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '6', '8', '10', '12', '14', '16'];

	// Reset infinite scroll state when data changes (filter applied)
	$effect(() => {
		allListings = [...data.listings];
		currentPage = data.pagination.currentPage;
		hasMoreItems = data.pagination.hasNextPage;
		loadingMore = false;
	});

	async function loadMoreItems() {
		if (loadingMore || !hasMoreItems) return;
		
		loadingMore = true;
		const nextPage = currentPage + 1;

		try {
			const params = new URLSearchParams();
			
			// Add all current filters to the API call
			if (data.filters.category) params.set('category', data.filters.category);
			if (data.filters.subcategory) params.set('subcategory', data.filters.subcategory);
			if (data.filters.search) params.set('q', data.filters.search);
			if (data.filters.minPrice) params.set('min_price', data.filters.minPrice.toString());
			if (data.filters.maxPrice) params.set('max_price', data.filters.maxPrice.toString());
			if (data.filters.sizes.length > 0) params.set('sizes', data.filters.sizes.join(','));
			if (data.filters.brands.length > 0) params.set('brands', data.filters.brands.join(','));
			if (data.filters.conditions.length > 0) params.set('conditions', data.filters.conditions.join(','));
			if (data.filters.sortBy !== 'recent') params.set('sort', data.filters.sortBy);
			params.set('page', nextPage.toString());
			params.set('limit', data.pagination.limit.toString());

			const response = await fetch(`/api/browse/load-more?${params.toString()}`);
			
			if (response.ok) {
				const result = await response.json();
				
				if (result.listings && result.listings.length > 0) {
					allListings = [...allListings, ...result.listings];
					currentPage = nextPage;
					hasMoreItems = result.hasMore;
				} else {
					hasMoreItems = false;
				}
			} else {
				console.error('Failed to load more items');
				hasMoreItems = false;
			}
		} catch (error) {
			console.error('Error loading more items:', error);
			hasMoreItems = false;
		} finally {
			loadingMore = false;
		}
	}
</script>

<svelte:head>
	<title>{m.header_browse()} - Driplo</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Hero Section with Emoji Search -->
	<section class="relative bg-gradient-to-b from-blue-50 to-white py-3 md:py-4">
		<div class="container mx-auto px-4">
			<div class="max-w-3xl mx-auto">
				
				<!-- Top Sellers Section -->
				<div class="mb-3">
					{#if $topSellersQuery.isLoading}
						<!-- Loading skeleton -->
						<div class="text-center">
							<div class="h-7 w-48 bg-gray-200 rounded-sm mx-auto mb-3 animate-pulse"></div>
							<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
								{#each Array(6) as _, index (index)}
									<div class="text-center">
										<div class="relative">
											<div class="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-full animate-pulse"></div>
										</div>
										<div class="mt-2 space-y-2">
											<div class="h-4 bg-gray-200 rounded mx-auto w-20 animate-pulse"></div>
											<div class="h-3 bg-gray-200 rounded mx-auto w-16 animate-pulse"></div>
											<div class="h-3 bg-gray-200 rounded mx-auto w-14 animate-pulse"></div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{:else if $topSellersQuery.error}
						<!-- Error state - silently fail, don't show section -->
					{:else if $topSellersQuery.data?.sellers && $topSellersQuery.data.sellers.length > 0}
						<h2 class="text-sm md:text-base font-semibold text-gray-800 mb-3 text-center flex items-center justify-center gap-2">
							<span>🏆</span>
							<span>Top Sellers This Month</span>
						</h2>
						<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
							{#each $topSellersQuery.data.sellers.slice(0, 6) as seller, index (seller.id)}
								<a href="/profile/{seller.username}" class="text-center group">
									<div class="relative">
										{#if index === 0}
											<div class="absolute -top-2 -right-2 text-lg z-10">👑</div>
										{/if}
										<div class="relative">
											<div class="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full blur opacity-20 group-hover:opacity-30 transition-all duration-100"></div>
											<div class="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden ring-1 ring-white border border-gray-200 group-hover:ring-blue-200 transition-all duration-100">
												{#if seller.avatar_url}
													<img src={seller.avatar_url} alt={seller.username} class="w-full h-full object-cover" />
												{:else}
													<div class="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
														<span class="text-white font-bold text-sm md:text-base">{seller.username[0].toUpperCase()}</span>
													</div>
												{/if}
											</div>
										</div>
									</div>
									<div class="mt-2">
										<p class="text-sm font-medium text-gray-800 truncate">{seller.username}</p>
										<div class="flex items-center justify-center gap-1 text-xs text-gray-600">
											<span>⭐</span>
											<span>{seller.average_rating || '0.0'}</span>
										</div>
										<p class="text-xs text-gray-500 mt-1">{seller.total_sales} sales</p>
									</div>
								</a>
							{/each}
						</div>
					{/if}
				</div>
				
				<!-- Search Bar with Emoji -->
				<div class="relative group">
					<div class="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-sm blur-xl opacity-20 transition-all duration-100 group-focus-within:opacity-30 group-focus-within:blur-2xl"></div>
					
					<div class="relative bg-white rounded-sm border border-gray-200 transition-all duration-100">
						<div class="flex items-center">
							<div class="pl-3 pr-2">
								<span class="text-2xl">🔍</span>
							</div>
							
							<input
								type="search"
								placeholder="Search for vintage 🕰️, designer 💎, streetwear 🛹..."
								bind:value={searchInput}
								onfocus={() => { searchFocused = true; showQuickSearch = true; }}
								onblur={() => { searchFocused = false; setTimeout(() => showQuickSearch = false, 200); }}
								onkeydown={(e) => { if (e.key === 'Enter') { handleSearch(searchInput); } }}
								class="flex-1 py-2 md:py-3 pr-3 text-sm placeholder:text-gray-400 focus:outline-none bg-transparent"
							/>
							
							<button
								onclick={() => handleSearch(searchInput)}
								class="mr-2 px-3 md:px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-sm text-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-100 active:scale-95"
							>
								Search
							</button>
						</div>
						
						<!-- Quick Search Suggestions -->
						{#if showQuickSearch}
							<div class="absolute top-full left-0 right-0 mt-2 bg-white rounded-sm shadow-md border border-gray-200 p-3 z-50">
								<p class="text-sm font-medium text-gray-700 mb-2">Quick searches:</p>
								<div class="grid grid-cols-2 md:grid-cols-4 gap-2">
									{#each quickSearchSuggestions as suggestion (suggestion.text)}
										<button
											onmousedown={() => handleQuickSearch(suggestion.text)}
											class="flex items-center gap-2 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-sm transition-colors duration-100 text-sm"
										>
											<span class="text-lg">{suggestion.emoji}</span>
											<span class="text-gray-700">{suggestion.text}</span>
										</button>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
				
			</div>
		</div>
	</section>

	<!-- Sticky Search Bar (Desktop & Mobile) -->
	<StickySearchBar
		bind:value={searchInput}
		placeholder="Search for vintage 🕰️, designer 💎, streetwear 🛹..."
		onSearch={handleSearch}
		onCategorySelect={updateCategory}
		categories={data.categories}
		activeCategory={data.filters.category}
		visible={showStickySearch}
	/>

	<div class="container mx-auto px-4 py-3">
		<div class="flex gap-3">
			<!-- Desktop Sidebar -->
			<aside class="hidden md:block w-72 flex-shrink-0">
				<div class="sticky top-24 space-y-3">
					<!-- Desktop filters are now shown after hero section -->

					<!-- Categories Card -->
					<div class="bg-white rounded-sm border border-gray-200 p-3">
						<h3 class="font-semibold text-gray-900 mb-2 text-sm">{m.browse_categories()}</h3>
						<div class="space-y-1">
							{#each categoriesWithAll as category (category.slug)}
								<button
									onclick={() => updateCategory(category.slug)}
									class={cn(
										"w-full text-left px-2 py-2 rounded-sm text-sm transition-all duration-100 flex items-center gap-2",
										data.filters.category === category.slug
											? "bg-blue-50 text-blue-700 font-medium"
											: "hover:bg-gray-50 text-gray-700"
									)}
								>
									<span class="text-sm">{category.icon_url || '📦'}</span>
									<span>{category.name}</span>
								</button>
							{/each}
						</div>
					</div>

					<!-- Price Range Card -->
					<div class="bg-white rounded-sm border border-gray-200 p-3">
						<h3 class="font-semibold text-gray-900 mb-2 text-sm">{m.browse_price_range()}</h3>
						<div class="space-y-2">
							<div class="flex gap-2">
								<input
									type="number"
									placeholder={m.browse_price_min()}
									bind:value={priceRange.min}
									onblur={updatePriceRange}
									class="w-full rounded-sm border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-transparent"
								/>
								<span class="text-gray-400 self-center">-</span>
								<input
									type="number"
									placeholder={m.browse_price_max()}
									bind:value={priceRange.max}
									onblur={updatePriceRange}
									class="w-full rounded-sm border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-transparent"
								/>
							</div>
							<button
								onclick={updatePriceRange}
								class="w-full px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-sm hover:bg-blue-100 transition-colors duration-100"
							>
								Apply Price Range
							</button>
						</div>
					</div>

					<!-- Sizes Card -->
					<div class="bg-white rounded-sm border border-gray-200 p-3">
						<h3 class="font-semibold text-gray-900 mb-2 text-sm">{m.browse_size()}</h3>
						<div class="grid grid-cols-3 gap-2">
							{#each sizeOptions as size (size)}
								<button
									onclick={() => toggleSize(size)}
									class={cn(
										"px-2 py-1.5 rounded-sm text-sm font-medium transition-all duration-100",
										selectedSizes.has(size)
											? "bg-blue-300 text-white border border-blue-400"
											: "bg-gray-100 text-gray-700 hover:bg-gray-200"
									)}
								>
									{size}
								</button>
							{/each}
						</div>
					</div>

					<!-- Conditions Card -->
					<div class="bg-white rounded-sm border border-gray-200 p-3">
						<h3 class="font-semibold text-gray-900 mb-2 text-sm">{m.browse_condition()}</h3>
						<div class="space-y-2">
							{#each conditionOptions as condition (condition.value)}
								<label class="flex items-center gap-3 py-1 cursor-pointer group">
									<input
										type="checkbox"
										checked={selectedConditions.has(condition.value)}
										onchange={() => toggleCondition(condition.value)}
										class="w-4 h-4 text-blue-300 bg-gray-100 border-gray-300 rounded focus:ring-blue-300 focus:ring-1"
									/>
									<span class="text-sm text-gray-700 group-hover:text-gray-900">{condition.label}</span>
								</label>
							{/each}
						</div>
					</div>

					<!-- Brands Card -->
					<div class="bg-white rounded-sm border border-gray-200 p-3">
						<h3 class="font-semibold text-gray-900 mb-2 text-sm">{m.browse_brand()}</h3>
						<div class="space-y-2 max-h-48 overflow-y-auto">
							{#each data.popularBrands as brand (brand)}
								<label class="flex items-center gap-3 py-1 cursor-pointer group">
									<input
										type="checkbox"
										checked={selectedBrands.has(brand)}
										onchange={() => toggleBrand(brand)}
										class="w-4 h-4 text-blue-300 bg-gray-100 border-gray-300 rounded focus:ring-blue-300 focus:ring-1"
									/>
									<span class="text-sm text-gray-700 group-hover:text-gray-900">{brand}</span>
								</label>
							{/each}
						</div>
					</div>

					<!-- Clear Filters Button -->
					{#if data.filters.search || data.filters.category || selectedSizes.size > 0 || selectedBrands.size > 0 || selectedConditions.size > 0 || data.filters.minPrice || data.filters.maxPrice}
						<button
							onclick={clearAllFilters}
							class="w-full px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-sm hover:bg-red-50 transition-colors duration-100"
						>
							{m.browse_clear_filters()}
						</button>
					{/if}
				</div>
			</aside>

			<!-- Main Content -->
			<main class="flex-1">
				<!-- Results Header with Sort Options -->
				<div class="bg-white rounded-sm border border-gray-200 p-3 mb-3">
					<div class="flex items-center justify-between">
						<div>
							<h2 class="text-sm font-semibold text-gray-900">
								{data.filters.category ? categoriesWithAll.find(c => c.slug === data.filters.category)?.name : 'All Items'}
							</h2>
							{#if data.filters.search}
								<p class="text-sm text-gray-500 mt-1">
									Results for "{data.filters.search}"
								</p>
							{/if}
						</div>
						<div class="flex items-center gap-2">
							<span class="text-sm text-gray-500">{data.totalCount.toLocaleString()} items</span>
							<select
								bind:value={sortBy}
								onchange={(e) => updateSort(e.currentTarget.value)}
								class="rounded-sm border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-transparent"
							>
								{#each sortOptions as option (option.value)}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>

				<!-- Active Filters Display -->
				{#if data.filters.search || data.filters.category || selectedSizes.size > 0 || selectedBrands.size > 0 || selectedConditions.size > 0 || data.filters.minPrice || data.filters.maxPrice}
					<div class="bg-white rounded-sm border border-gray-200 p-3 mb-3">
						<div class="flex items-center justify-between mb-2">
							<h3 class="text-sm font-semibold text-gray-900">Active Filters</h3>
							<button
								onclick={clearAllFilters}
								class="text-sm text-blue-600 hover:text-blue-800 font-medium"
							>
								{m.browse_clear_filters()}
							</button>
						</div>
						<div class="flex flex-wrap gap-2">
							{#if data.filters.search}
								<span class="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-sm text-sm font-medium">
									Search: "{data.filters.search}"
									<button onclick={() => goto(buildFilterUrl({ search: null }))} class="hover:text-blue-900">
										<X class="h-3.5 w-3.5" />
									</button>
								</span>
							{/if}
							{#if data.filters.category}
								<span class="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-sm text-sm font-medium">
									{categoriesWithAll.find(c => c.slug === data.filters.category)?.name}
									<button onclick={() => updateCategory('')} class="hover:text-blue-900">
										<X class="h-3.5 w-3.5" />
									</button>
								</span>
							{/if}
							{#each Array.from(selectedSizes) as size (size)}
								<span class="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-sm text-sm font-medium">
									Size {size}
									<button onclick={() => toggleSize(size)} class="hover:text-blue-900">
										<X class="h-3.5 w-3.5" />
									</button>
								</span>
							{/each}
							{#each Array.from(selectedBrands) as brand (brand)}
								<span class="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-sm text-sm font-medium">
									{brand}
									<button onclick={() => toggleBrand(brand)} class="hover:text-blue-900">
										<X class="h-3.5 w-3.5" />
									</button>
								</span>
							{/each}
							{#each Array.from(selectedConditions) as condition (condition)}
								<span class="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-sm text-sm font-medium">
									{conditionOptions.find(c => c.value === condition)?.label}
									<button onclick={() => toggleCondition(condition)} class="hover:text-blue-900">
										<X class="h-3.5 w-3.5" />
									</button>
								</span>
							{/each}
							{#if data.filters.minPrice || data.filters.maxPrice}
								<span class="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-sm text-sm font-medium">
									${data.filters.minPrice || 0} - ${data.filters.maxPrice || '∞'}
									<button onclick={() => goto(buildFilterUrl({ minPrice: null, maxPrice: null }))} class="hover:text-blue-900">
										<X class="h-3.5 w-3.5" />
									</button>
								</span>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Product Grid -->
				<ListingGrid 
					listings={allListings} 
					title="" 
					infiniteScroll={true}
					hasMore={hasMoreItems}
					onLoadMore={loadMoreItems}
					userFavorites={data.userFavorites}
				/>

				<!-- Items Counter -->
				{#if allListings.length > 0}
					<div class="mt-4 text-center text-sm text-muted-foreground">
						Showing {allListings.length.toLocaleString()} of {data.totalCount.toLocaleString()} results
						{#if hasMoreItems}
							• Scroll down to load more
						{/if}
					</div>
				{/if}
			</main>
		</div>
	</div>

</div>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>