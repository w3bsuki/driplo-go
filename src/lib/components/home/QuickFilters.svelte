<script lang="ts">
	import { X, Filter, Sparkles } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils';
	
	import { page } from '$app/stores';
	
	// Read filters from URL parameters
	let selectedFilters = $state({
		price: '',
		size: '',
		brand: '',
		condition: '',
		sort: 'recent'
	});

	// Update selectedFilters based on URL parameters
	$effect(() => {
		const params = $page.url.searchParams;
		const minPrice = params.get('min_price');
		const maxPrice = params.get('max_price');
		
		// Map URL params to filter values
		selectedFilters = {
			price: minPrice && maxPrice ? `${minPrice}-${maxPrice}` : 
				   minPrice ? `${minPrice}-999` : '',
			size: params.get('sizes')?.split(',')[0] || '',
			brand: params.get('brands')?.split(',')[0] || '',
			condition: params.get('conditions')?.split(',')[0] || '',
			sort: params.get('sort') || 'recent'
		};
	});
	
	let showAllFilters = $state(false);
	
	const quickFilters = [
		{
			type: 'price',
			options: [
				{ label: 'Under £20', value: '0-20' },
				{ label: '£20-50', value: '20-50' },
				{ label: '£50-100', value: '50-100' },
				{ label: '£100+', value: '100-999' }
			]
		},
		{
			type: 'size',
			options: [
				{ label: 'XS', value: 'xs' },
				{ label: 'S', value: 's' },
				{ label: 'M', value: 'm' },
				{ label: 'L', value: 'l' },
				{ label: 'XL', value: 'xl' }
			]
		},
		{
			type: 'brand',
			options: [
				{ label: 'Nike', value: 'nike' },
				{ label: 'Adidas', value: 'adidas' },
				{ label: 'Zara', value: 'zara' },
				{ label: 'H&M', value: 'hm' },
				{ label: 'Gucci', value: 'gucci' }
			]
		},
		{
			type: 'condition',
			options: [
				{ label: 'New', value: 'new' },
				{ label: 'Like New', value: 'likenew' },
				{ label: 'Good', value: 'good' },
				{ label: 'Fair', value: 'fair' }
			]
		}
	];
	
	const sortOptions = [
		{ label: 'Most Recent', value: 'recent', icon: '🆕' },
		{ label: 'Price: Low to High', value: 'price-low', icon: '📈' },
		{ label: 'Price: High to Low', value: 'price-high', icon: '📉' },
		{ label: 'Most Popular', value: 'popular', icon: '🔥' }
	];
	
	function applyFilter(type: string, value: string) {
		selectedFilters[type] = selectedFilters[type] === value ? '' : value;
		updateUrl();
	}
	
	function clearAllFilters() {
		selectedFilters = {
			price: '',
			size: '',
			brand: '',
			condition: '',
			sort: 'recent'
		};
		// Go to clean browse page
		goto('/browse');
	}
	
	function updateUrl() {
		const params = new URLSearchParams($page.url.searchParams);
		
		// Handle price filter
		if (selectedFilters.price) {
			const [min, max] = selectedFilters.price.split('-');
			if (min) params.set('min_price', min);
			if (max && max !== '999') params.set('max_price', max);
		} else {
			params.delete('min_price');
			params.delete('max_price');
		}
		
		// Handle other filters
		if (selectedFilters.size) {
			params.set('sizes', selectedFilters.size);
		} else {
			params.delete('sizes');
		}
		
		if (selectedFilters.brand) {
			params.set('brands', selectedFilters.brand);
		} else {
			params.delete('brands');
		}
		
		if (selectedFilters.condition) {
			// Map condition values to match browse page format
			const conditionMap = {
				'new': 'new_with_tags',
				'likenew': 'like_new',
				'good': 'good',
				'fair': 'fair'
			};
			params.set('conditions', conditionMap[selectedFilters.condition] || selectedFilters.condition);
		} else {
			params.delete('conditions');
		}
		
		if (selectedFilters.sort !== 'recent') {
			params.set('sort', selectedFilters.sort);
		} else {
			params.delete('sort');
		}
		
		goto(`${$page.url.pathname}?${params.toString()}`);
	}
	
	const activeFilterCount = $derived(
		Object.values(selectedFilters).filter(v => v && v !== 'recent').length
	);
</script>

<section class="bg-white border-t border-b border-gray-200 mb-3">
	<div class="container px-2 py-2">
		<!-- Mobile Layout -->
		<div class="md:hidden">
			<div class="flex items-center gap-1 overflow-x-auto scrollbar-hide">
				
				<!-- Quick Filter Pills -->
				{#each quickFilters as filter}
					<div class="relative">
						<select
							value={selectedFilters[filter.type]}
							onchange={(e) => applyFilter(filter.type, e.currentTarget.value)}
							class={cn(
								"filter-select appearance-none pl-3 pr-7 py-2 rounded-sm text-xs font-medium border cursor-pointer transition-all duration-100 min-w-[80px] outline-none",
								selectedFilters[filter.type]
									? "bg-blue-50 border-blue-200 text-blue-500"
									: "bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50"
							)}
						>
							<option value="">{filter.type.charAt(0).toUpperCase() + filter.type.slice(1)}</option>
							{#each filter.options as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
						{#if selectedFilters[filter.type]}
							<button
								onclick={() => applyFilter(filter.type, '')}
								class="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-blue-100 rounded-full p-0.5"
							>
								<X class="h-3 w-3 text-blue-400" />
							</button>
						{/if}
					</div>
				{/each}
				
				<!-- Sort -->
				<select
					value={selectedFilters.sort}
					onchange={(e) => { selectedFilters.sort = e.currentTarget.value; updateUrl(); }}
					class="filter-select appearance-none pl-3 pr-7 py-2 rounded-sm text-xs font-medium border bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50 min-w-[90px] outline-none"
				>
					{#each sortOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>
		</div>
		
		<!-- Desktop Layout -->
		<div class="hidden md:flex items-center justify-between">
			<div class="flex items-center gap-2">
				{#each quickFilters as filter}
					<div class="relative group">
						<button
							onclick={() => showAllFilters = !showAllFilters}
							class={cn(
								"flex items-center gap-1.5 px-3 py-2 rounded-sm border font-medium transition-all duration-100",
								selectedFilters[filter.type]
									? "bg-blue-100 border-blue-200 text-blue-500 hover:bg-blue-100"
									: "bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50"
							)}
						>
							<span>{filter.type.charAt(0).toUpperCase() + filter.type.slice(1)}</span>
							{#if selectedFilters[filter.type]}
								<span class="text-sm">: {filter.options.find(o => o.value === selectedFilters[filter.type])?.label}</span>
								<X class="h-3 w-3 ml-1" onclick={(e) => { e.stopPropagation(); applyFilter(filter.type, ''); }} />
							{/if}
						</button>
						
						<!-- Dropdown -->
						<div class="absolute top-full left-0 mt-2 bg-white rounded-sm border border-gray-200 p-2 min-w-[150px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-100 z-10 shadow-md">
							{#each filter.options as option}
								<button
									onclick={() => applyFilter(filter.type, option.value)}
									class={cn(
										"w-full text-left px-3 py-2 rounded-sm text-sm transition-colors duration-100",
										selectedFilters[filter.type] === option.value
											? "bg-blue-100 text-blue-500"
											: "hover:bg-gray-100"
									)}
								>
									{option.label}
								</button>
							{/each}
						</div>
					</div>
				{/each}
				
				{#if activeFilterCount > 0}
					<button
						onclick={clearAllFilters}
						class="text-sm text-gray-600 hover:text-blue-400 font-medium ml-2"
					>
						Clear all
					</button>
				{/if}
			</div>
			
			<!-- Sort Dropdown -->
			<div class="flex items-center gap-1">
				<Sparkles class="h-4 w-4 text-gray-400" />
				<select
					value={selectedFilters.sort}
					onchange={(e) => { selectedFilters.sort = e.currentTarget.value; updateUrl(); }}
					class="bg-white border border-gray-200 rounded-sm px-3 py-2 text-sm font-medium hover:border-blue-200 focus:outline-none focus:ring-1 focus:ring-blue-300/20"
				>
					{#each sortOptions as option}
						<option value={option.value}>{option.icon} {option.label}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>
	
	<!-- Expanded Filters (Mobile) -->
	{#if showAllFilters}
		<div class="md:hidden border-t border-gray-200 bg-white px-2 py-3">
			<div class="space-y-4">
				{#each quickFilters as filter}
					<div>
						<h3 class="text-sm font-semibold text-gray-700 mb-2">
							{filter.type.charAt(0).toUpperCase() + filter.type.slice(1)}
						</h3>
						<div class="flex flex-wrap gap-1">
							{#each filter.options as option}
								<button
									onclick={() => applyFilter(filter.type, option.value)}
									class={cn(
										"px-3 py-1.5 rounded-sm text-sm font-medium border transition-all duration-100",
										selectedFilters[filter.type] === option.value
											? "bg-blue-300 text-white border-blue-300"
											: "bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50"
									)}
								>
									{option.label}
								</button>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</section>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	
	/* Custom select arrow for filter selects */
	.filter-select {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2360A5FA' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.75rem center;
		background-size: 0.75rem;
	}
	
	.filter-select:focus {
		outline: none !important;
		box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2) !important;
		border-color: #60A5FA !important;
	}
</style>