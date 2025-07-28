<script lang="ts">
	import { X, Search } from 'lucide-svelte';
	import CategoryDropdown from './CategoryDropdown.svelte';
	import * as m from '$lib/paraglide/messages.js';
	
	interface Props {
		variant?: 'default' | 'with-dropdown' | 'icon-dropdown' | 'modal';
		showCategoryButton?: boolean;
		categoryButtonType?: 'icon' | 'dropdown' | 'icon-only';
		containerClass?: string;
		searchClass?: string;
		filterClass?: string;
		onSearch?: (params: URLSearchParams) => void;
	}
	
	let { 
		variant = 'default',
		showCategoryButton = true,
		categoryButtonType = 'icon',
		containerClass = '',
		searchClass = '',
		filterClass = '',
		onSearch
	}: Props = $props();

	let searchQuery = $state('');
	let showCategoryModal = $state(false);
	let selectedPriceRange = $state('');
	let selectedSize = $state('');
	let selectedBrand = $state('');
	let selectedCondition = $state('');
	let categoryDropdownOpen = $state(false);

	const priceRanges = [
		{ name: 'Under £20', value: '0-20' },
		{ name: '£20-50', value: '20-50' },
		{ name: '£50-100', value: '50-100' },
		{ name: '£100+', value: '100-999' }
	];

	const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '6', '8', '10', '12', '14', '16'];
	
	const brands = ['Nike', 'Adidas', 'Zara', 'H&M', 'Uniqlo', 'ASOS', 'Gucci', 'Prada'];
	
	const conditions = ['New with tags', 'Very good', 'Good', 'Fair'];

	function handleSearch() {
		const params = new URLSearchParams();
		if (searchQuery.trim()) {
			params.set('q', searchQuery.trim());
		}
		if (selectedPriceRange) params.set('price', selectedPriceRange);
		if (selectedSize) params.set('size', selectedSize);
		if (selectedBrand) params.set('brand', selectedBrand);
		if (selectedCondition) params.set('condition', selectedCondition);
		
		if (onSearch) {
			onSearch(params);
		} else {
			const queryString = params.toString();
			window.location.href = `/browse${queryString ? '?' + queryString : ''}`;
		}
	}

	function handleApplyFilters() {
		handleSearch();
	}

	function handleClearFilters() {
		searchQuery = '';
		selectedPriceRange = '';
		selectedSize = '';
		selectedBrand = '';
		selectedCondition = '';
	}

	function clearFilter(filterType: string) {
		switch(filterType) {
			case 'search': searchQuery = ''; break;
			case 'price': selectedPriceRange = ''; break;
			case 'size': selectedSize = ''; break;
			case 'brand': selectedBrand = ''; break;
			case 'condition': selectedCondition = ''; break;
		}
	}

	const hasActiveFilters = $derived(searchQuery || selectedPriceRange || selectedSize || selectedBrand || selectedCondition);

	// Quick categories for modal variant
	const quickCategories = [
		{ name: 'All', value: '', count: '5.2M' },
		{ name: 'Women', value: 'women', count: '2.3M' },
		{ name: 'Men', value: 'men', count: '1.8M' },
		{ name: 'Kids', value: 'kids', count: '982K' },
		{ name: 'Designer', value: 'designer', count: '156K' },
		{ name: 'Shoes', value: 'shoes', count: '743K' },
		{ name: 'Bags', value: 'bags', count: '421K' }
	];

	const popularItems = [
		{ name: 'T-shirts', value: 'tshirts', emoji: '👕' },
		{ name: 'Jeans', value: 'jeans', emoji: '👖' },
		{ name: 'Dresses', value: 'dresses', emoji: '👗' },
		{ name: 'Trainers', value: 'trainers', emoji: '👟' },
		{ name: 'Jackets', value: 'jackets', emoji: '🧥' },
		{ name: 'Handbags', value: 'handbags', emoji: '👜' }
	];

	function selectQuickCategory(category: string) {
		showCategoryModal = false;
		const params = new URLSearchParams();
		if (category) {
			params.set('category', category);
		}
		window.location.href = `/browse${params.toString() ? '?' + params.toString() : ''}`;
	}

	// Determine search input styling based on variant
	const searchInputClass = $derived(
		variant === 'default' 
			? "w-full rounded-xl border border-neutral-200 bg-white pl-12 pr-4 py-3 text-base placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all duration-200"
			: "w-full rounded-lg border border-input bg-background pl-12 pr-4 py-2.5 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shadow-sm"
	);

	// Container background based on variant
	const sectionBg = $derived(variant === 'default' ? 'bg-white' : 'bg-background');
</script>

<section class="py-4 border-b {sectionBg} {containerClass}">
	<div class="container px-4">
		<!-- Search Bar with Category Button/Dropdown -->
		<div class="max-w-4xl mx-auto mb-4">
			<div class="flex gap-3">
				<!-- Category Button/Dropdown -->
				{#if showCategoryButton}
					<div class="flex-shrink-0">
						{#if categoryButtonType === 'icon'}
							<!-- Icon button that opens modal -->
							<button
								onclick={() => showCategoryModal = true}
								class="flex items-center justify-center w-12 h-12 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-primary/30 transition-all duration-200"
								aria-label="Browse categories"
								title="Quick category access"
							>
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
								</svg>
							</button>
						{:else if categoryButtonType === 'dropdown'}
							<!-- Full CategoryDropdown component -->
							<CategoryDropdown 
								isOpen={categoryDropdownOpen}
								onToggle={() => categoryDropdownOpen = !categoryDropdownOpen}
								onClose={() => categoryDropdownOpen = false}
							/>
						{:else if categoryButtonType === 'icon-only'}
							<!-- Icon-only dropdown trigger -->
							<button
								onclick={() => categoryDropdownOpen = !categoryDropdownOpen}
								class="flex items-center justify-center w-11 h-11 rounded-lg border border-input bg-background hover:bg-muted hover:border-primary/30 transition-all duration-200"
								aria-label="Browse categories"
								title="Quick category access"
							>
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
								</svg>
							</button>
							<!-- Render dropdown if open -->
							{#if categoryDropdownOpen}
								<CategoryDropdown 
									isOpen={categoryDropdownOpen}
									onToggle={() => categoryDropdownOpen = !categoryDropdownOpen}
									onClose={() => categoryDropdownOpen = false}
									class="absolute left-0"
								/>
							{/if}
						{/if}
					</div>
				{/if}
				
				<!-- Search Input -->
				<div class="relative flex-1">
					<Search class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
					<input
						type="search"
						placeholder="Search for items, brands, or users..."
						bind:value={searchQuery}
						onkeydown={(e) => e.key === 'Enter' && handleSearch()}
						class="{searchInputClass} {searchClass}"
					/>
				</div>
			</div>
		</div>

		{#if hasActiveFilters}
			<div class="flex justify-end mb-3">
				<button
					onclick={handleClearFilters}
					class="text-sm text-muted-foreground hover:text-foreground"
				>
					Clear all
				</button>
			</div>
		{/if}

		<!-- Mobile Filters -->
		<div class="flex gap-1.5 overflow-x-auto pb-1 md:hidden scrollbar-hide {filterClass}">
			<!-- Price -->
			<select
				bind:value={selectedPriceRange}
				onchange={handleApplyFilters}
				class="rounded-full border border-input bg-background px-2.5 py-1.5 text-xs flex-shrink-0 min-w-20"
			>
				<option value="">Price</option>
				{#each priceRanges as range}
					<option value={range.value}>{range.name}</option>
				{/each}
			</select>
			
			<!-- Size -->
			<select
				bind:value={selectedSize}
				onchange={handleApplyFilters}
				class="rounded-full border border-input bg-background px-2.5 py-1.5 text-xs flex-shrink-0 min-w-16"
			>
				<option value="">Size</option>
				{#each sizes as size}
					<option value={size}>{size}</option>
				{/each}
			</select>
			
			<!-- Brand -->
			<select
				bind:value={selectedBrand}
				onchange={handleApplyFilters}
				class="rounded-full border border-input bg-background px-2.5 py-1.5 text-xs flex-shrink-0 min-w-20"
			>
				<option value="">Brand</option>
				{#each brands as brand}
					<option value={brand}>{brand}</option>
				{/each}
			</select>
			
			<!-- Condition -->
			<select
				bind:value={selectedCondition}
				onchange={handleApplyFilters}
				class="rounded-full border border-input bg-background px-2.5 py-1.5 text-xs flex-shrink-0 min-w-20"
			>
				<option value="">Condition</option>
				{#each conditions as condition}
					<option value={condition}>{condition}</option>
				{/each}
			</select>
		</div>

		<!-- Desktop Filters -->
		<div class="hidden md:flex items-center gap-3 {filterClass}">
			<!-- Price -->
			<select
				bind:value={selectedPriceRange}
				onchange={handleApplyFilters}
				class="rounded-lg border border-input bg-background px-3 py-2 text-sm"
			>
				<option value="">Price</option>
				{#each priceRanges as range}
					<option value={range.value}>{range.name}</option>
				{/each}
			</select>
			
			<!-- Size -->
			<select
				bind:value={selectedSize}
				onchange={handleApplyFilters}
				class="rounded-lg border border-input bg-background px-3 py-2 text-sm"
			>
				<option value="">Size</option>
				{#each sizes as size}
					<option value={size}>{size}</option>
				{/each}
			</select>
			
			<!-- Brand -->
			<select
				bind:value={selectedBrand}
				onchange={handleApplyFilters}
				class="rounded-lg border border-input bg-background px-3 py-2 text-sm"
			>
				<option value="">Brand</option>
				{#each brands as brand}
					<option value={brand}>{brand}</option>
				{/each}
			</select>
			
			<!-- Condition -->
			<select
				bind:value={selectedCondition}
				onchange={handleApplyFilters}
				class="rounded-lg border border-input bg-background px-3 py-2 text-sm"
			>
				<option value="">Condition</option>
				{#each conditions as condition}
					<option value={condition}>{option}</option>
				{/each}
			</select>
		</div>

		<!-- Active Filter Pills -->
		{#if hasActiveFilters}
			<div class="flex flex-wrap gap-2 mt-3">
				{#if searchQuery}
					<div class="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
						<span>"{searchQuery}"</span>
						<button onclick={() => clearFilter('search')}>
							<X class="h-3 w-3" />
						</button>
					</div>
				{/if}
				{#if selectedPriceRange}
					<div class="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
						<span>{priceRanges.find(r => r.value === selectedPriceRange)?.name}</span>
						<button onclick={() => clearFilter('price')}>
							<X class="h-3 w-3" />
						</button>
					</div>
				{/if}
				{#if selectedSize}
					<div class="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
						<span>Size {selectedSize}</span>
						<button onclick={() => clearFilter('size')}>
							<X class="h-3 w-3" />
						</button>
					</div>
				{/if}
				{#if selectedBrand}
					<div class="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
						<span>{selectedBrand}</span>
						<button onclick={() => clearFilter('brand')}>
							<X class="h-3 w-3" />
						</button>
					</div>
				{/if}
				{#if selectedCondition}
					<div class="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
						<span>{selectedCondition}</span>
						<button onclick={() => clearFilter('condition')}>
							<X class="h-3 w-3" />
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</section>

<!-- Quick Categories Modal (only for 'modal' variant) -->
{#if showCategoryModal && variant === 'modal'}
	<div class="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
		<div class="fixed inset-x-0 bottom-0 bg-background rounded-t-2xl max-h-[80vh] overflow-hidden">
			<div class="flex flex-col h-full max-h-[80vh]">
				<!-- Header -->
				<div class="flex items-center justify-between p-4 border-b bg-background rounded-t-2xl">
					<h2 class="text-lg font-semibold">Quick Categories</h2>
					<button 
						onclick={() => showCategoryModal = false}
						class="p-2 hover:bg-muted rounded-lg"
						aria-label="Close categories"
					>
						<X class="h-5 w-5" />
					</button>
				</div>
				
				<!-- Categories Content -->
				<div class="flex-1 overflow-y-auto p-4">
					<div class="space-y-6">
						<!-- Main Categories -->
						<div>
							<h3 class="text-sm font-semibold text-muted-foreground mb-3">
								Main Categories
							</h3>
							<div class="grid grid-cols-2 gap-2">
								{#each quickCategories as category}
									<button
										onclick={() => selectQuickCategory(category.value)}
										class="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
									>
										<div class="flex items-center justify-between">
											<span class="font-medium">{category.name}</span>
											<span class="text-xs text-muted-foreground">{category.count}</span>
										</div>
									</button>
								{/each}
							</div>
						</div>
						
						<!-- Popular Items -->
						<div>
							<h3 class="text-sm font-semibold text-muted-foreground mb-3">
								Popular Items
							</h3>
							<div class="grid grid-cols-2 gap-2">
								{#each popularItems as item}
									<button
										onclick={() => selectQuickCategory(item.value)}
										class="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
									>
										<div class="flex items-center gap-2">
											<span class="text-lg">{item.emoji}</span>
											<span class="font-medium">{item.name}</span>
										</div>
									</button>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>