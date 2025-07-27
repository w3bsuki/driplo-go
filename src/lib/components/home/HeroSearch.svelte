<script lang="ts">
	import { ChevronDown, Menu } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils';
	import { debounce } from '$lib/utils/performance';
	import CategoryDropdown from '$lib/components/shared/CategoryDropdown.svelte';
	// Lazy load non-critical components
	let StickySearchBar: any = null;
	import QuickFilterPills from '$lib/components/search/QuickFilterPills.svelte';
	import TrendingSearches from '$lib/components/search/TrendingSearches.svelte';
	import type { Category } from '$lib/types';
	import { onMount } from 'svelte';
	// Only import the messages we actually use
	import {
		header_categories,
		browse_search_placeholder,
		quick_filter_search_button,
		search_trending,
		search_vintage_levis,
		search_designer_bags,
		search_nike_trainers,
		search_zara_dress,
		search_north_face_jacket,
		quick_filter_top_sellers,
		quick_filter_men,
		quick_filter_women,
		quick_filter_newest,
		quick_filter_hot,
		quick_filter_with_tags,
		quick_filter_shoes,
		quick_filter_tshirts,
		quick_filter_accessories,
		quick_filter_jeans,
		quick_filter_dresses,
		quick_filter_jackets,
		quick_filter_bags,
		quick_filter_sale,
		category_men,
		category_women,
		category_kids,
		condition_new_with_tags,
		subcategory_shoes,
		subcategory_tshirts,
		subcategory_accessories,
		subcategory_jeans,
		subcategory_dresses,
		subcategory_jackets,
		subcategory_bags,
		filter_browse_all,
		filter_categories,
		quick_filter_categories_menu
	} from '$lib/paraglide/messages.js';
	
	interface Props {
		categories?: Category[];
	}
	
	let { categories = [] }: Props = $props();
	
	// Constants
	const SEARCH_DEBOUNCE_DELAY = 300;
	const INTERSECTION_ROOT_MARGIN = '-100px 0px 0px 0px';
	const DESKTOP_QUICK_FILTERS_LIMIT = 4;
	const MOBILE_CATEGORIES_LIMIT = 2;

	let searchQuery = $state('');
	let isFocused = $state(false);
	let isCategoryDropdownOpen = $state(false);
	let activeCategory = $state('');
	
	const trendingSearches = [
		search_vintage_levis(),
		search_designer_bags(),
		search_nike_trainers(),
		search_zara_dress(),
		search_north_face_jacket()
	];
	
	// Pre-computed quick filters for better performance
	const quickFilters = [
		{ icon: '⭐', name: quick_filter_top_sellers(), action: 'top-sellers', ariaLabel: quick_filter_top_sellers(), color: 'golden' },
		{ icon: '👨', name: quick_filter_men(), action: 'men', ariaLabel: category_men(), color: 'blue' },
		{ icon: '👩', name: quick_filter_women(), action: 'women', ariaLabel: category_women(), color: 'pink' },
		{ icon: '✨', name: quick_filter_newest(), action: 'newest', ariaLabel: quick_filter_newest() },
		{ icon: '🔥', name: quick_filter_hot(), action: 'hot', ariaLabel: quick_filter_hot() },
		{ icon: '🏷️', name: quick_filter_with_tags(), action: 'with-tags', ariaLabel: condition_new_with_tags() },
		{ icon: '👟', name: quick_filter_shoes(), action: 'shoes', ariaLabel: subcategory_shoes() },
		{ icon: '👕', name: quick_filter_tshirts(), action: 't-shirts', ariaLabel: subcategory_tshirts() },
		{ icon: '💍', name: quick_filter_accessories(), action: 'accessories', ariaLabel: subcategory_accessories() },
		{ icon: '👖', name: quick_filter_jeans(), action: 'jeans', ariaLabel: subcategory_jeans() },
		{ icon: '👗', name: quick_filter_dresses(), action: 'dresses', ariaLabel: subcategory_dresses() },
		{ icon: '🧥', name: quick_filter_jackets(), action: 'jackets', ariaLabel: subcategory_jackets() },
		{ icon: '👜', name: quick_filter_bags(), action: 'bags', ariaLabel: subcategory_bags() },
		{ icon: '💸', name: quick_filter_sale(), action: 'sale', ariaLabel: filter_browse_all() }
	];
	
	import { getLocale } from '$lib/paraglide/runtime.js';

	// Get localized category name
	function getCategoryName(category: Category): string {
		const locale = getLocale();
		return locale === 'bg' && category.name_bg ? category.name_bg : category.name;
	}
	
	// Sticky search state for mobile
	let isSticky = $state(false);
	let heroRef: HTMLElement;
	
	// Lazy load non-critical components
	onMount(async () => {
		// Load sticky search bar after initial render
		const stickyModule = await import('$lib/components/search/StickySearchBar.svelte');
		StickySearchBar = stickyModule.default;
		
		// Defer intersection observer setup
		if ('requestIdleCallback' in window) {
			requestIdleCallback(() => setupIntersectionObserver());
		} else {
			setTimeout(() => setupIntersectionObserver(), 100);
		}
	});
	
	function setupIntersectionObserver() {
		if (typeof window === 'undefined' || !heroRef) return;
		
		const observer = new IntersectionObserver(
			([entry]) => {
				isSticky = !entry.isIntersecting;
			},
			{ threshold: 0, rootMargin: INTERSECTION_ROOT_MARGIN }
		);
		
		observer.observe(heroRef);
		
		// Cleanup function
		return () => {
			if (heroRef) observer.unobserve(heroRef);
			observer.disconnect();
		};
	}

	
	// Debounced search handler for performance
	const debouncedHandleSearch = debounce(() => {
		if (searchQuery.trim()) {
			const params = new URLSearchParams();
			params.set('q', searchQuery.trim());
			goto(`/browse?${params.toString()}`);
		} else {
			goto('/browse');
		}
	}, SEARCH_DEBOUNCE_DELAY);

	function handleSearch() {
		debouncedHandleSearch();
	}
	
	function searchTrending(term: string) {
		searchQuery = term;
		handleSearch();
	}
	

	function handleQuickFilter(action: string) {
		switch(action) {
			case 'newest':
				goto('/browse?sort=created_at&order=desc');
				break;
			case 'sale':
				goto('/browse?filter=sale');
				break;
			case 'hot':
				goto('/browse?filter=hot');
				break;
			case 'top-sellers':
				goto('/browse?sort=favorites_count&order=desc');
				break;
			case 'with-tags':
				goto('/browse?filter=with-tags');
				break;
			case 'men':
				goto('/men');
				break;
			case 'women':
				goto('/women');
				break;
			case 'shoes':
				goto('/shoes');
				break;
			case 't-shirts':
				goto('/browse?category=t-shirts');
				break;
			case 'accessories':
				goto('/accessories');
				break;
			case 'jeans':
				goto('/browse?category=jeans');
				break;
			case 'dresses':
				goto('/browse?category=dresses');
				break;
			case 'jackets':
				goto('/browse?category=jackets');
				break;
			case 'bags':
				goto('/bags');
				break;
			default:
				goto('/browse');
		}
	}
	
	function toggleCategoryDropdown() {
		isCategoryDropdownOpen = !isCategoryDropdownOpen;
	}
	
	function closeCategoryDropdown() {
		isCategoryDropdownOpen = false;
	}
	
	function handleCategorySelect(categorySlug: string) {
		activeCategory = categorySlug;
		if (categorySlug) {
			goto(`/${categorySlug}`);
		} else {
			goto('/browse');
		}
	}
</script>

<section bind:this={heroRef} class="relative bg-gradient-to-b from-blue-50 to-white py-3 md:py-6 pb-0">
	<div class="container px-5 md:px-6">
		<div class="max-w-3xl mx-auto">
			
			<!-- Desktop Layout - Keep existing integrated design -->
			<div class="hidden md:block">
				<div class="relative overflow-visible">
					<div class={cn(
						"relative bg-white rounded-sm border border-gray-200 transition-all duration-100",
						isFocused ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200"
					)}>
						<div class="flex items-center min-w-0 py-2 px-3">
							<!-- Category Dropdown Button -->
							<div class="relative flex-shrink-0">
								<button
									data-categories-button
									onclick={toggleCategoryDropdown}
									class={cn(
										"h-9 px-3 font-medium focus:outline-none transition-all duration-100 rounded-sm flex items-center gap-2",
										isCategoryDropdownOpen 
											? "bg-blue-500 text-white hover:bg-blue-600" 
											: "bg-gray-900 text-white hover:bg-gray-800"
									)}
								>
									<span class="text-sm">{header_categories()}</span>
									<ChevronDown class={cn(
										"h-3.5 w-3.5 transition-transform duration-100",
										isCategoryDropdownOpen && "rotate-180"
									)} />
								</button>
							</div>
							
							<!-- Divider -->
							<div class="w-px h-7 bg-gray-200 flex-shrink-0 mx-3"></div>
							
							<!-- Search Input with Icon -->
							<div class="flex-1 min-w-0 flex items-center">
								<input
									type="search"
									placeholder={browse_search_placeholder()}
									bind:value={searchQuery}
									onfocus={() => isFocused = true}
									onblur={() => isFocused = false}
									onkeydown={(e) => e.key === 'Enter' && handleSearch()}
									oninput={handleSearch}
									aria-label={browse_search_placeholder()}
									class="h-9 w-full border-0 focus:ring-0 bg-transparent text-sm"
								/>
								<button
									onclick={handleSearch}
									class="h-9 w-9 hover:opacity-75 transition-opacity duration-100 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-sm flex items-center justify-center flex-shrink-0"
									aria-label={quick_filter_search_button()}
								>
									<span class="text-base" aria-hidden="true">🔍</span>
								</button>
							</div>
						</div>
						
						
						<!-- Trending Category Links -->
						<div class="border-t border-gray-100 py-2 relative overflow-hidden rounded-b-sm">
							<div class="px-3 flex items-center gap-2">
								<span class="text-xs text-gray-500 flex-shrink-0 hidden md:block">{search_trending()}:</span>
								
								<!-- Quick Filters Component -->
								<QuickFilterPills
									filters={quickFilters.slice(0, DESKTOP_QUICK_FILTERS_LIMIT)}
									onFilterClick={handleQuickFilter}
									class="flex-1"
								/>
								
								<!-- Divider -->
								<div class="w-px h-5 bg-border flex-shrink-0" aria-hidden="true"></div>
								
								<!-- More Filters -->
								<QuickFilterPills
									filters={quickFilters.slice(DESKTOP_QUICK_FILTERS_LIMIT)}
									onFilterClick={handleQuickFilter}
									class="flex-1"
								/>
								
								<!-- Divider -->
								<div class="w-px h-5 bg-border flex-shrink-0" aria-hidden="true"></div>
								
								<!-- Category Quick Links -->
								<div class="flex items-center gap-2 overflow-x-auto scrollbar-hide">
									{#each categories.slice(0, 3) as category}
										<button
											onclick={() => handleCategorySelect(category.slug)}
											aria-label="{filter_categories()}: {getCategoryName(category)}"
											class="flex items-center gap-1.5 px-3 py-2 rounded-sm bg-background border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium whitespace-nowrap transition-colors duration-100 focus:outline-none focus:ring-1 focus:ring-brand-400"
										>
											<span class="text-sm" aria-hidden="true">{category.icon_url || category.icon || '📦'}</span>
											<span>{getCategoryName(category)}</span>
										</button>
									{/each}
								</div>
							</div>
						</div>
					</div>
				</div>
				
				<!-- Desktop Category Dropdown - positioned to match search container width -->
				{#if isCategoryDropdownOpen}
					<div class="relative">
						<CategoryDropdown
							{categories}
							isOpen={isCategoryDropdownOpen}
							onToggle={toggleCategoryDropdown}
							onClose={closeCategoryDropdown}
							class="!absolute !top-2 !left-0 !right-0 !w-full"
						/>
					</div>
				{/if}
			</div>
			
			<!-- Mobile Layout - Optimized for better UX -->
			<div class="block md:hidden">
				<!-- Search Bar Container -->
				<div class={cn(
					"relative bg-white rounded-sm border border-gray-200 transition-all duration-100 shadow-sm",
					isFocused ? "border-blue-500 shadow-md" : "border-gray-200"
				)}>
					<!-- Main Search Row -->
					<div class="flex items-center py-2 px-3 gap-2">
						<!-- Categories Icon Button -->
						<div class="relative">
							<button
								data-categories-button
								onclick={toggleCategoryDropdown}
								class="h-9 w-9 rounded-sm bg-gray-900 text-white hover:bg-gray-800 transition-colors duration-100 flex items-center justify-center flex-shrink-0"
								aria-label={quick_filter_categories_menu()}
							>
								<Menu class="h-4 w-4" />
							</button>
						</div>
						<!-- Divider -->
						<div class="w-px h-8 bg-gray-200 flex-shrink-0"></div>
						<!-- Search Input -->
						<input
							type="search"
							placeholder={browse_search_placeholder()}
							bind:value={searchQuery}
							onfocus={() => isFocused = true}
							onblur={() => isFocused = false}
							onkeydown={(e) => e.key === 'Enter' && handleSearch()}
							oninput={handleSearch}
							aria-label={browse_search_placeholder()}
							class="h-9 flex-1 border-0 focus:ring-0 bg-transparent text-sm min-w-0"
						/>
						<button
							onclick={handleSearch}
							class="h-9 w-9 hover:opacity-75 transition-opacity duration-100 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-sm flex items-center justify-center flex-shrink-0"
							aria-label={quick_filter_search_button()}
						>
							<span class="text-base" aria-hidden="true">🔍</span>
						</button>
					</div>
					
					<!-- Pills Section -->
					<div class="border-t border-gray-100">
						<div class="py-2 px-3 relative">
							<!-- Quick Filters -->
							<div class="overflow-x-auto relative">
								<div class="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
										{#each quickFilters.slice(0, 4) as filter}
											<button
												onclick={() => handleQuickFilter(filter.action)}
												class={cn(
													"flex items-center gap-1 px-2.5 py-1.5 rounded-sm border text-sm font-medium whitespace-nowrap transition-colors duration-100 focus:outline-none focus:ring-1 flex-shrink-0",
													filter.color === 'golden' && "bg-gradient-to-r from-yellow-50 to-amber-50 border-amber-300 hover:from-yellow-100 hover:to-amber-100 hover:border-amber-400 text-amber-800",
													filter.color === 'blue' && "bg-gradient-to-r from-blue-50 to-sky-50 border-blue-300 hover:from-blue-100 hover:to-sky-100 hover:border-blue-400 text-blue-800",
													filter.color === 'pink' && "bg-gradient-to-r from-pink-50 to-rose-50 border-pink-300 hover:from-pink-100 hover:to-rose-100 hover:border-pink-400 text-pink-800",
													!filter.color && "bg-background border-gray-200 hover:border-gray-200-hover hover:bg-gray-50 text-gray-700"
												)}
											>
												<span class="text-sm">{filter.icon}</span>
												<span>{filter.name}</span>
											</button>
										{/each}
										
										<!-- Divider -->
										<div class="w-px h-4 bg-border flex-shrink-0"></div>
										
										<!-- More quick filters -->
										{#each quickFilters.slice(4) as filter}
											<button
												onclick={() => handleQuickFilter(filter.action)}
												class={cn(
													"flex items-center gap-1 px-2.5 py-1.5 rounded-sm border text-sm font-medium whitespace-nowrap transition-colors duration-100 focus:outline-none focus:ring-1 flex-shrink-0",
													filter.color === 'golden' && "bg-gradient-to-r from-yellow-50 to-amber-50 border-amber-300 hover:from-yellow-100 hover:to-amber-100 hover:border-amber-400 text-amber-800",
													filter.color === 'blue' && "bg-gradient-to-r from-blue-50 to-sky-50 border-blue-300 hover:from-blue-100 hover:to-sky-100 hover:border-blue-400 text-blue-800",
													filter.color === 'pink' && "bg-gradient-to-r from-pink-50 to-rose-50 border-pink-300 hover:from-pink-100 hover:to-rose-100 hover:border-pink-400 text-pink-800",
													!filter.color && "bg-background border-gray-200 hover:border-gray-200-hover hover:bg-gray-50 text-gray-700"
												)}
											>
												<span class="text-sm">{filter.icon}</span>
												<span>{filter.name}</span>
											</button>
										{/each}
										
										<!-- Divider -->
										<div class="w-px h-4 bg-border flex-shrink-0"></div>
										
										<!-- Category Quick Links -->
										{#each categories.slice(0, 2) as category}
											<button
												onclick={() => handleCategorySelect(category.slug)}
												class="flex items-center gap-1 px-2.5 py-1.5 rounded-sm bg-background border border-gray-200 text-gray-700 text-sm font-medium whitespace-nowrap flex-shrink-0"
											>
												<span class="text-sm">{category.icon_url || category.icon || '📦'}</span>
												<span>{getCategoryName(category)}</span>
											</button>
										{/each}
									</div>
								</div>
						</div>
					</div>
				</div>
				
				<!-- Mobile Category Dropdown - positioned to match search container width -->
				{#if isCategoryDropdownOpen}
					<div class="relative">
						<CategoryDropdown
							{categories}
							isOpen={isCategoryDropdownOpen}
							onToggle={toggleCategoryDropdown}
							onClose={closeCategoryDropdown}
							class="!absolute !top-2 !left-0 !right-0 !w-full"
						/>
					</div>
				{/if}
			</div>
			
			<!-- Trending Searches - Compact -->
			<TrendingSearches
				searches={trendingSearches}
				onSearchClick={searchTrending}
				maxVisible={3}
				class="mt-2"
			/>
		</div>
	</div>
</section>

<!-- Sticky Search Bar (Reusable Component) -->
{#if StickySearchBar}
	<StickySearchBar
		bind:value={searchQuery}
		placeholder={browse_search_placeholder()}
		onSearch={handleSearch}
		onCategorySelect={handleCategorySelect}
		{categories}
		{activeCategory}
		visible={isSticky}
	/>
{/if}


<style>
	/* Hide scrollbar for quick categories */
	.overflow-x-auto {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.overflow-x-auto::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>