<script lang="ts">
	import { ChevronDown, Menu, Search } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils/cn';
	import { debounce } from '$lib/utils/performance';
	import CategoryDropdown from '$lib/components/shared/CategoryDropdownFixed.svelte';
	import { debug } from '$lib/utils/debug-logger';
	import QuickFilterPills from '$lib/components/search/QuickFilterPills.svelte';
	import TrendingSearches from '$lib/components/search/TrendingSearches.svelte';
	import type { Category } from '$lib/types';
	import { onMount } from 'svelte';
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
		condition_new_with_tags,
		subcategory_shoes,
		subcategory_tshirts,
		subcategory_accessories,
		subcategory_jeans,
		subcategory_dresses,
		subcategory_jackets,
		subcategory_bags,
		filter_browse_all,
		quick_filter_categories_menu
	} from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';
	
	interface Props {
		categories?: Category[];
	}

	let { categories = [] }: Props = $props();

	// Constants
	const SEARCH_DEBOUNCE_DELAY = 300;
	const INTERSECTION_ROOT_MARGIN = '-100px 0px 0px 0px';
	const DESKTOP_QUICK_FILTERS_LIMIT = 4;
	const DESKTOP_CATEGORY_LIMIT = 3;
	const MOBILE_CATEGORIES_LIMIT = 2;
	const MOBILE_QUICK_FILTERS_FIRST_BATCH = 4;
	const ICON_SIZE_SM = 'h-3.5 w-3.5';
	const ICON_SIZE_BASE = 'h-4 w-4';
	const BUTTON_HEIGHT = 'h-9';
	const INPUT_HEIGHT = 'h-9';

	// State
	let searchQuery = $state('');
	let isFocused = $state(false);
	let isCategoryDropdownOpen = $state(false);
	let activeCategory = $state('');
	let isSticky = $state(false);
	let heroRef: HTMLElement;
	let StickySearchBar = $state<any>(null);

	// Debug logging
	debug.log('HeroSearch initialized', {
		component: 'HeroSearch',
		data: { categoriesCount: categories.length }
	});

	// Trending searches
	const trendingSearches = [
		search_vintage_levis(),
		search_designer_bags(),
		search_nike_trainers(),
		search_zara_dress(),
		search_north_face_jacket()
	];

	// Quick filters with emojis
	const quickFilters = [
		{ icon: '⭐', name: quick_filter_top_sellers(), action: 'top-sellers', ariaLabel: quick_filter_top_sellers(), variant: 'golden' },
		{ icon: '👨', name: quick_filter_men(), action: 'men', ariaLabel: category_men(), variant: 'blue' },
		{ icon: '👩', name: quick_filter_women(), action: 'women', ariaLabel: category_women(), variant: 'pink' },
		{ icon: '✨', name: quick_filter_newest(), action: 'newest', ariaLabel: quick_filter_newest(), variant: 'default' },
		{ icon: '🔥', name: quick_filter_hot(), action: 'hot', ariaLabel: quick_filter_hot(), variant: 'hot' },
		{ icon: '🏷️', name: quick_filter_with_tags(), action: 'with-tags', ariaLabel: condition_new_with_tags(), variant: 'default' },
		{ icon: '👟', name: quick_filter_shoes(), action: 'shoes', ariaLabel: subcategory_shoes(), variant: 'default' },
		{ icon: '👕', name: quick_filter_tshirts(), action: 't-shirts', ariaLabel: subcategory_tshirts(), variant: 'default' },
		{ icon: '💍', name: quick_filter_accessories(), action: 'accessories', ariaLabel: subcategory_accessories(), variant: 'default' },
		{ icon: '👖', name: quick_filter_jeans(), action: 'jeans', ariaLabel: subcategory_jeans(), variant: 'default' },
		{ icon: '👗', name: quick_filter_dresses(), action: 'dresses', ariaLabel: subcategory_dresses(), variant: 'default' },
		{ icon: '🧥', name: quick_filter_jackets(), action: 'jackets', ariaLabel: subcategory_jackets(), variant: 'default' },
		{ icon: '👜', name: quick_filter_bags(), action: 'bags', ariaLabel: subcategory_bags(), variant: 'default' },
		{ icon: '💸', name: quick_filter_sale(), action: 'sale', ariaLabel: filter_browse_all(), variant: 'sale' }
	];

	// Route mapping for cleaner navigation
	const routeMap: Record<string, string> = {
		'newest': '/browse?sort=created_at&order=desc',
		'sale': '/browse?filter=sale',
		'hot': '/browse?filter=hot',
		'top-sellers': '/browse?sort=favorites_count&order=desc',
		'with-tags': '/browse?filter=with-tags',
		'men': '/men',
		'women': '/women',
		'shoes': '/shoes',
		't-shirts': '/browse?category=t-shirts',
		'accessories': '/accessories',
		'jeans': '/browse?category=jeans',
		'dresses': '/browse?category=dresses',
		'jackets': '/browse?category=jackets',
		'bags': '/bags'
	};


	// Get localized category name
	const getCategoryName = (category: Category): string => {
		const locale = getLocale();
		return locale === 'bg' && category.name_bg ? category.name_bg : category.name;
	};

	// Lazy load sticky search bar
	onMount(async () => {
		const stickyModule = await import('$lib/components/search/StickySearchBar.svelte');
		StickySearchBar = stickyModule.default;
		
		if ('requestIdleCallback' in window) {
			requestIdleCallback(() => setupIntersectionObserver());
		} else {
			setTimeout(() => setupIntersectionObserver(), 100);
		}
	});

	const setupIntersectionObserver = () => {
		if (typeof window === 'undefined' || !heroRef) return;
		
		const observer = new IntersectionObserver(
			([entry]) => {
				isSticky = !entry.isIntersecting;
			},
			{ threshold: 0, rootMargin: INTERSECTION_ROOT_MARGIN }
		);
		
		observer.observe(heroRef);
		
		return () => {
			if (heroRef) observer.unobserve(heroRef);
			observer.disconnect();
		};
	};

	// Debounced search handler
	const debouncedHandleSearch = debounce(() => {
		if (searchQuery.trim()) {
			const params = new URLSearchParams();
			params.set('q', searchQuery.trim());
			goto(`/browse?${params.toString()}`);
		} else {
			goto('/browse');
		}
	}, SEARCH_DEBOUNCE_DELAY);

	const handleSearch = () => {
		debug.log('Search initiated', { component: 'HeroSearch', data: { query: searchQuery.trim() } });
		debouncedHandleSearch();
	};
	
	const searchTrending = (term: string) => {
		debug.log('Trending search clicked', { component: 'HeroSearch', data: { term } });
		searchQuery = term;
		handleSearch();
	};

	const handleQuickFilter = (action: string) => {
		debug.log('Quick filter clicked', { component: 'HeroSearch', data: { action } });
		goto(routeMap[action] || '/browse');
	};
	
	const toggleCategoryDropdown = () => {
		isCategoryDropdownOpen = !isCategoryDropdownOpen;
	};
	
	const closeCategoryDropdown = () => {
		isCategoryDropdownOpen = false;
	};
	
	const handleCategorySelect = (categorySlug: string) => {
		activeCategory = categorySlug;
		goto(categorySlug ? `/${categorySlug}` : '/browse');
	};

</script>

<section bind:this={heroRef} class="relative bg-gradient-to-b from-[var(--color-brand-50)] to-[var(--color-white)] py-[var(--spacing-3)] md:py-[var(--spacing-6)] pb-0">
	<div class="container px-[var(--spacing-4)]">
		<div class="max-w-3xl mx-auto">
			
			<!-- Desktop Layout -->
			<div class="hidden md:block">
				<div class="relative">
					<div class={cn(
						"relative bg-[var(--color-surface-primary)] rounded-[var(--border-radius-sm)] border border-[var(--color-border-primary)] transition-all duration-[var(--transition-duration-100)]",
						isFocused ? "border-[var(--color-brand-500)] ring-1 ring-[var(--color-brand-500)]" : "border-[var(--color-border-primary)]"
					)}>
						<div class="flex items-center min-w-0 py-[var(--spacing-2)] px-[var(--spacing-3)]">
							<!-- Category Dropdown Button -->
							<div class="relative flex-shrink-0">
								<button
									data-categories-button
									onclick={toggleCategoryDropdown}
									class={cn(
										`${BUTTON_HEIGHT} px-[var(--spacing-3)] font-medium focus:outline-none transition-all duration-[var(--transition-duration-100)] rounded-[var(--border-radius-sm)] flex items-center gap-[var(--spacing-2)]`,
										isCategoryDropdownOpen 
											? "bg-[var(--color-brand-500)] text-[var(--color-white)] hover:bg-[var(--color-brand-600)]" 
											: "bg-[var(--color-gray-900)] text-[var(--color-white)] hover:bg-[var(--color-gray-800)]"
									)}
								>
									<span class="text-[var(--font-size-sm)]">{header_categories()}</span>
									<ChevronDown class={cn(
										ICON_SIZE_SM,
										"transition-transform duration-[var(--transition-duration-100)]",
										isCategoryDropdownOpen && "rotate-180"
									)} />
								</button>
							</div>
							
							<!-- Divider -->
							<div class="w-px h-7 bg-[var(--color-border-primary)] flex-shrink-0 mx-[var(--spacing-3)]"></div>
							
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
									class={`${INPUT_HEIGHT} w-full border-0 focus:ring-0 bg-transparent text-[var(--font-size-sm)]`}
								/>
								<button
									onclick={handleSearch}
									class={`${BUTTON_HEIGHT} w-9 hover:opacity-75 transition-opacity duration-[var(--transition-duration-100)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] rounded-[var(--border-radius-sm)] flex items-center justify-center flex-shrink-0`}
									aria-label={quick_filter_search_button()}
								>
									<Search class={ICON_SIZE_BASE} />
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
								<div class="flex items-center gap-[var(--spacing-2)] overflow-x-auto scrollbar-hide">
									{#each categories.slice(0, DESKTOP_CATEGORY_LIMIT) as category}
										<button
											onclick={() => handleCategorySelect(category.slug)}
											aria-label="Category: {getCategoryName(category)}"
											class="flex items-center gap-[var(--spacing-1-5)] px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--border-radius-sm)] bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] text-[var(--font-size-sm)] font-medium whitespace-nowrap transition-colors duration-[var(--transition-duration-100)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)]"
										>
											<span class="text-[var(--font-size-sm)]" aria-hidden="true">{category.icon_url || category.icon || '📦'}</span>
											<span>{getCategoryName(category)}</span>
										</button>
									{/each}
								</div>
							</div>
						</div>
					</div>
				</div>
					
				<!-- Desktop Category Dropdown -->
				{#if isCategoryDropdownOpen}
					<CategoryDropdown
						{categories}
						isOpen={isCategoryDropdownOpen}
						onToggle={toggleCategoryDropdown}
						onClose={closeCategoryDropdown}
						class="absolute top-full left-0 right-0 mt-2"
					/>
				{/if}
			</div>
			
			<!-- Mobile Layout -->
			<div class="block md:hidden">
				<div class="relative">
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
									class={`${BUTTON_HEIGHT} w-9 rounded-sm bg-gray-900 text-white hover:bg-gray-800 transition-colors duration-100 flex items-center justify-center flex-shrink-0`}
									aria-label={quick_filter_categories_menu()}
								>
									<Menu class={ICON_SIZE_BASE} />
								</button>
							</div>
							
							<!-- Divider -->
							<div class="w-px h-8 bg-[var(--color-border-primary)] flex-shrink-0"></div>
							
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
								class={`${INPUT_HEIGHT} flex-1 border-0 focus:ring-0 bg-transparent text-[var(--font-size-sm)] min-w-0`}
							/>
							
							<button
								onclick={handleSearch}
								class={`${BUTTON_HEIGHT} w-9 hover:opacity-75 transition-opacity duration-[var(--transition-duration-100)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] rounded-[var(--border-radius-sm)] flex items-center justify-center flex-shrink-0`}
								aria-label={quick_filter_search_button()}
							>
								<Search class={ICON_SIZE_BASE} />
							</button>
						</div>
						
						<!-- Mobile Category Dropdown - Opens above pills for better UX -->
						{#if isCategoryDropdownOpen}
							<div class="border-t border-[var(--color-border-primary)]">
								<CategoryDropdown
									{categories}
									isOpen={isCategoryDropdownOpen}
									onToggle={toggleCategoryDropdown}
									onClose={closeCategoryDropdown}
									class="w-full"
								/>
							</div>
						{/if}
						
						<!-- Pills Section -->
						<div class="border-t border-[var(--color-border-primary)]">
							<div class="py-[var(--spacing-2)] px-[var(--spacing-3)] relative">
								<!-- Quick Filters -->
								<div class="overflow-x-auto relative">
									<div class="flex items-center gap-[var(--spacing-1-5)] overflow-x-auto scrollbar-hide">
										<!-- Use QuickFilterPills component for consistent styling -->
										<QuickFilterPills
											filters={quickFilters}
											onFilterClick={handleQuickFilter}
											class="flex-shrink-0"
											showScrollHint={false}
										/>
										
										<!-- Divider -->
										<div class="w-px h-4 bg-border flex-shrink-0"></div>
										
										<!-- Category Quick Links -->
										{#each categories.slice(0, MOBILE_CATEGORIES_LIMIT) as category}
											<button
												onclick={() => handleCategorySelect(category.slug)}
												class="flex items-center gap-1 px-2.5 py-1.5 rounded-sm bg-white border border-gray-200 text-gray-700 text-sm font-medium whitespace-nowrap flex-shrink-0 hover:border-gray-300 hover:bg-gray-50"
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
						
				</div>
			</div>
			
			<!-- Trending Searches -->
			<TrendingSearches
				searches={trendingSearches}
				onSearchClick={searchTrending}
				maxVisible={3}
				class="mt-2"
			/>
		</div>
	</div>
</section>

<!-- Sticky Search Bar -->
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