<script lang="ts">
	import { X, ChevronRight, Check } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils';
	import * as m from '$lib/paraglide/messages.js';
	import { onMount } from 'svelte';
	
	interface Props {
		isOpen?: boolean;
		onClose?: () => void;
	}
	
	let { isOpen = false, onClose = () => {} }: Props = $props();
	
	let selectedFilters = $state({
		category: '',
		subcategory: '',
		price: '',
		size: '',
		brand: '',
		condition: '',
		sort: 'recent'
	});
	
	// Main categories - keeping the original with proper emojis and counts
	const categories = [
		{ slug: 'women', name: m.category_women(), icon: '👩', count: m.category_women_count() },
		{ slug: 'men', name: m.category_men(), icon: '👨', count: m.category_men_count() },
		{ slug: 'kids', name: m.category_kids(), icon: '👶', count: m.category_kids_count() },
		{ slug: 'designer', name: m.category_designer(), icon: '💎', count: m.category_designer_count() },
		{ slug: 'home', name: m.category_home(), icon: '🏠', count: m.category_home_count() }
	];
	
	// Subcategories - keeping the original with proper emojis
	const subcategories = [
		{ slug: 'dresses', name: m.subcategory_dresses(), icon: '👗' },
		{ slug: 'shoes', name: m.subcategory_shoes(), icon: '👠' },
		{ slug: 'bags', name: m.subcategory_bags(), icon: '👜' },
		{ slug: 'jackets', name: m.subcategory_jackets(), icon: '🧥' },
		{ slug: 'jeans', name: m.subcategory_jeans(), icon: '👖' },
		{ slug: 'tops', name: m.subcategory_tops(), icon: '👚' },
		{ slug: 'accessories', name: m.subcategory_accessories(), icon: '⌚' },
		{ slug: 'jewelry', name: m.subcategory_jewelry(), icon: '💍' }
	];
	
	// Filter options
	const priceRanges = [
		{ label: m.filter_price_under_20(), value: '0-20' },
		{ label: m.filter_price_20_50(), value: '20-50' },
		{ label: m.filter_price_50_100(), value: '50-100' },
		{ label: m.filter_price_100_200(), value: '100-200' },
		{ label: m.filter_price_200_plus(), value: '200-999' }
	];
	
	const sizes = [
		{ label: 'XS', value: 'xs' },
		{ label: 'S', value: 's' },
		{ label: 'M', value: 'm' },
		{ label: 'L', value: 'l' },
		{ label: 'XL', value: 'xl' },
		{ label: 'XXL', value: 'xxl' }
	];
	
	// Popular brands with dynamic loading
	let brands = $state([
		{ label: 'Nike', value: 'nike' },
		{ label: 'Adidas', value: 'adidas' },
		{ label: 'Zara', value: 'zara' },
		{ label: 'H&M', value: 'hm' },
		{ label: 'Gucci', value: 'gucci' },
		{ label: 'Louis Vuitton', value: 'lv' },
		{ label: 'Chanel', value: 'chanel' },
		{ label: 'Prada', value: 'prada' }
	]);
	
	const conditions = [
		{ label: m.listing_condition_new(), value: 'new' },
		{ label: m.listing_condition_like_new(), value: 'likenew' },
		{ label: m.condition_very_good(), value: 'verygood' },
		{ label: m.condition_good(), value: 'good' },
		{ label: m.condition_fair(), value: 'fair' }
	];
	
	const sortOptions = [
		{ label: m.filter_sort_recent(), value: 'recent', icon: '🆕' },
		{ label: m.filter_sort_price_low(), value: 'price-low', icon: '📈' },
		{ label: m.filter_sort_price_high(), value: 'price-high', icon: '📉' },
		{ label: m.filter_sort_popular(), value: 'popular', icon: '🔥' },
		{ label: m.filter_sort_ending(), value: 'ending', icon: '⏰' }
	];
	
	// Fetch dynamic brands on mount
	onMount(async () => {
		try {
			const response = await fetch('/api/filters/data');
			if (response.ok) {
				const data = await response.json();
				if (data.brands?.length > 0) {
					brands = data.brands.map(b => ({
						label: b.brand || b.label,
						value: (b.brand || b.value).toLowerCase().replace(/\s+/g, '-')
					}));
				}
			}
		} catch (error) {
			console.error('Failed to fetch brands:', error);
			// Keep default brands
		}
	});
	
	function selectFilter(type: string, value: string) {
		selectedFilters[type] = selectedFilters[type] === value ? '' : value;
	}
	
	function clearAllFilters() {
		selectedFilters = {
			category: '',
			subcategory: '',
			price: '',
			size: '',
			brand: '',
			condition: '',
			sort: 'recent'
		};
	}
	
	function applyFilters() {
		const params = new URLSearchParams();
		
		Object.entries(selectedFilters).forEach(([key, value]) => {
			if (value && value !== 'recent') {
				params.set(key, value);
			}
		});
		
		const url = selectedFilters.category 
			? `/${selectedFilters.category}${params.toString() ? '?' + params.toString() : ''}`
			: `/browse${params.toString() ? '?' + params.toString() : ''}`;
		
		onClose();
		goto(url);
	}
	
	const activeFilterCount = $derived(
		Object.values(selectedFilters).filter(v => v && v !== 'recent').length
	);
</script>

<!-- Backdrop -->
{#if isOpen}
	<div 
		class="fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300"
		onclick={handleOnClose}
	></div>
{/if}

<!-- Drawer -->
<div class={cn(
	"fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[70] transition-transform duration-300 ease-out",
	isOpen ? "translate-y-0" : "translate-y-full"
)}>
	<div class="max-h-[80vh] flex flex-col">
		<!-- Header -->
		<div class="flex items-center justify-between p-3 border-b border-gray-200">
			<div class="flex items-center gap-2">
				<h2 class="text-base font-bold text-gray-900">{m.nav_filters()}</h2>
				{#if activeFilterCount > 0}
					<span class="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
						{activeFilterCount}
					</span>
				{/if}
			</div>
			<div class="flex items-center gap-2">
				{#if activeFilterCount > 0}
					<button
						onclick={handleClearAllFilters}
						class="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded-lg hover:bg-blue-50"
					>
						{m.filter_clear_all()}
					</button>
				{/if}
				<button
					onclick={handleOnClose}
					class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
				>
					<X class="h-4 w-4 text-gray-500" />
				</button>
			</div>
		</div>
		
		<!-- Content -->
		<div class="flex-1 overflow-y-auto px-4 py-3 space-y-4">
			<!-- Categories -->
			<div>
				<h3 class="text-sm font-semibold text-gray-900 mb-2">{m.filter_categories()}</h3>
				<div class="grid grid-cols-2 gap-2">
					{#each categories as category (category.slug)}
						<button
							onclick={() => selectFilter('category', category.slug)}
							class={cn(
								"flex items-center gap-2 p-2 rounded-lg border transition-all duration-200 text-left",
								selectedFilters.category === category.slug
									? "bg-blue-50 border-blue-300 text-blue-700"
									: "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50"
							)}
						>
							<span class="text-base">{category.icon}</span>
							<div class="flex-1 min-w-0">
								<div class="font-medium text-xs">{category.name}</div>
								<div class="text-xs text-gray-500">{category.count}</div>
							</div>
							{#if selectedFilters.category === category.slug}
								<Check class="h-3 w-3 text-blue-600 flex-shrink-0" />
							{/if}
						</button>
					{/each}
				</div>
			</div>
			
			<!-- Subcategories -->
			<div>
				<h3 class="text-sm font-semibold text-gray-900 mb-2">{m.filter_what_looking_for()}</h3>
				<div class="grid grid-cols-2 gap-2">
					{#each subcategories as subcategory (subcategory.slug)}
						<button
							onclick={() => selectFilter('subcategory', subcategory.slug)}
							class={cn(
								"flex items-center gap-1.5 p-2 rounded-lg border transition-all duration-200 text-left",
								selectedFilters.subcategory === subcategory.slug
									? "bg-blue-50 border-blue-300 text-blue-700"
									: "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50"
							)}
						>
							<span class="text-sm">{subcategory.icon}</span>
							<span class="font-medium text-xs flex-1">{subcategory?.name || ''}</span>
							{#if selectedFilters.subcategory === subcategory.slug}
								<Check class="h-3 w-3 text-blue-600 flex-shrink-0" />
							{/if}
						</button>
					{/each}
				</div>
			</div>
			
			<!-- Price Range -->
			<div>
				<h3 class="text-sm font-semibold text-gray-900 mb-2">{m.filter_price_range()}</h3>
				<div class="grid grid-cols-2 gap-2">
					{#each priceRanges as price (price.value)}
						<button
							onclick={() => selectFilter('price', price.value)}
							class={cn(
								"p-2 rounded-lg border text-center font-medium text-xs transition-all duration-200",
								selectedFilters.price === price.value
									? "bg-blue-500 border-blue-500 text-white"
									: "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
							)}
						>
							{price.label}
						</button>
					{/each}
				</div>
			</div>
			
			<!-- Size -->
			<div>
				<h3 class="text-sm font-semibold text-gray-900 mb-2">{m.filter_size()}</h3>
				<div class="flex flex-wrap gap-2">
					{#each sizes as size (size.value)}
						<button
							onclick={() => selectFilter('size', size.value)}
							class={cn(
								"px-3 py-1.5 rounded-lg border font-medium text-xs transition-all duration-200 min-w-[45px]",
								selectedFilters.size === size.value
									? "bg-blue-500 border-blue-500 text-white"
									: "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
							)}
						>
							{size.label}
						</button>
					{/each}
				</div>
			</div>
			
			<!-- Brand -->
			<div>
				<h3 class="text-sm font-semibold text-gray-900 mb-2">{m.filter_brand()}</h3>
				<div class="grid grid-cols-2 gap-2">
					{#each brands as brand (brand.value)}
						<button
							onclick={() => selectFilter('brand', brand.value)}
							class={cn(
								"p-2 rounded-lg border text-center font-medium text-xs transition-all duration-200",
								selectedFilters.brand === brand.value
									? "bg-blue-500 border-blue-500 text-white"
									: "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
							)}
						>
							{brand.label}
						</button>
					{/each}
				</div>
			</div>
			
			<!-- Condition -->
			<div>
				<h3 class="text-sm font-semibold text-gray-900 mb-2">{m.filter_condition()}</h3>
				<div class="space-y-2">
					{#each conditions as condition (condition.value)}
						<button
							onclick={() => selectFilter('condition', condition.value)}
							class={cn(
								"w-full p-2 rounded-lg border text-left font-medium text-xs transition-all duration-200 flex items-center justify-between",
								selectedFilters.condition === condition.value
									? "bg-blue-50 border-blue-300 text-blue-700"
									: "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
							)}
						>
							<span>{condition.label}</span>
							{#if selectedFilters.condition === condition.value}
								<Check class="h-3 w-3 text-blue-600" />
							{/if}
						</button>
					{/each}
				</div>
			</div>
			
			<!-- Sort -->
			<div>
				<h3 class="text-sm font-semibold text-gray-900 mb-2">{m.filter_sort_by()}</h3>
				<div class="space-y-2">
					{#each sortOptions as sort (sort.value)}
						<button
							onclick={() => selectFilter('sort', sort.value)}
							class={cn(
								"w-full p-2 rounded-lg border text-left font-medium text-xs transition-all duration-200 flex items-center gap-2",
								selectedFilters.sort === sort.value
									? "bg-blue-50 border-blue-300 text-blue-700"
									: "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
							)}
						>
							<span class="text-sm">{sort.icon}</span>
							<span class="flex-1">{sort.label}</span>
							{#if selectedFilters.sort === sort.value}
								<Check class="h-3 w-3 text-blue-600" />
							{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>
		
		<!-- Footer -->
		<div class="border-t border-gray-200 p-3 bg-gray-50">
			<button
				onclick={handleApplyFilters}
				class="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 text-sm"
			>
				{#if activeFilterCount > 0}
					{m.filter_apply_count({ count: activeFilterCount })}
				{:else}
					{m.filter_browse_all()}
				{/if}
			</button>
		</div>
	</div>
</div>