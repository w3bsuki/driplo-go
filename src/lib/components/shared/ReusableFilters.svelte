<script lang="ts">
	import { X, Sparkles } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import type { Category } from '$lib/types';
	
	interface FilterOption {
		label: string;
		value: string;
	}
	
	interface FilterGroup {
		type: string;
		label: string;
		options: FilterOption[];
	}
	
	interface Props {
		filters: FilterGroup[];
		selectedFilters: Record<string, string | string[]>;
		onFilterChange: (type: string, value: string | string[]) => void;
		onClearFilters: () => void;
		subcategories?: Category[];
		showSubcategories?: boolean;
		selectedSubcategory?: string;
		onSubcategoryChange?: (subcategory: string) => void;
		theme?: 'blue' | 'pink';
	}
	
	let {
		filters,
		selectedFilters,
		onFilterChange,
		onClearFilters,
		subcategories = [],
		showSubcategories = false,
		selectedSubcategory = 'all',
		onSubcategoryChange,
		theme = 'blue'
	}: Props = $props();
	
	
	const activeFilterCount = $derived(() => {
		let count = 0;
		if (selectedSubcategory !== 'all') count++;
		
		Object.entries(selectedFilters).forEach(([key, value]) => {
			if (Array.isArray(value)) {
				count += value.length;
			} else if (value && value !== 'recent') {
				count++;
			}
		});
		
		return count;
	});
	
	function getFilterLabel(filterType: string): string {
		const filter = filters.find(f => f.type === filterType);
		const value = selectedFilters[filterType];
		
		if (!value) return filter?.label || filterType;
		
		if (Array.isArray(value)) {
			return value.length > 0 ? value.join(', ') : filter?.label || filterType;
		}
		
		const option = filter?.options.find(o => o.value === value);
		return option?.label || filter?.label || filterType;
	}
	
	function handleFilterChange(type: string, value: string) {
		const currentValue = selectedFilters[type];
		
		// Handle multi-select (for sizes, conditions, etc.)
		if (type === 'size' || type === 'condition') {
			const currentArray = Array.isArray(currentValue) ? currentValue : [];
			const newArray = currentArray.includes(value)
				? currentArray.filter(v => v !== value)
				: [...currentArray, value];
			onFilterChange(type, newArray);
		} else {
			// Handle single select (for price, etc.)
			onFilterChange(type, currentValue === value ? '' : value);
		}
	}
	
	function isFilterActive(type: string, value: string): boolean {
		const currentValue = selectedFilters[type];
		
		if (Array.isArray(currentValue)) {
			return currentValue.includes(value);
		}
		
		return currentValue === value;
	}
	
	function clearFilter(type: string) {
		onFilterChange(type, Array.isArray(selectedFilters[type]) ? [] : '');
	}
</script>



<!-- Subcategories (if enabled) -->
{#if showSubcategories && subcategories.length > 0}
	<div class="bg-white border-b sticky top-0 z-20">
		<div class="container mx-auto px-4 py-4">
			<div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
				<button
					onclick={() => onSubcategoryChange?.('all')}
					class={cn(
						"flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
						selectedSubcategory === 'all'
							? theme === 'pink' ? "bg-pink-500 text-white" : "bg-blue-500 text-white"
							: "bg-gray-100 text-gray-700 hover:bg-gray-200"
					)}
				>
					All
				</button>
				{#each subcategories as subcategory}
					<button
						onclick={() => onSubcategoryChange?.(subcategory.id)}
						class={cn(
							"flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
							selectedSubcategory === subcategory.id
								? theme === 'pink' ? "bg-pink-500 text-white" : "bg-blue-500 text-white"
								: "bg-gray-100 text-gray-700 hover:bg-gray-200"
						)}
					>
						{subcategory.icon} {subcategory?.name || ''}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- Main Filters -->
<section class="bg-gray-50 border-b sticky top-[60px] z-30">
	<div class="container px-4 py-2">
		<!-- Mobile Layout -->
		<div class="md:hidden">
			<div class="flex items-center gap-2 overflow-x-auto scrollbar-hide">
				<!-- Just the scrollable filter dropdowns -->
				{#each filters as filter}
					<div class="relative">
						<select
							value={Array.isArray(selectedFilters[filter.type]) ? selectedFilters[filter.type][0] || '' : selectedFilters[filter.type] || ''}
							onchange={(e) => handleFilterChange(filter.type, e.currentTarget.value)}
							class={cn(
								"w-full pl-3 pr-8 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-all duration-200 min-w-[80px] max-w-[130px] shadow-sm focus:outline-none focus:ring-2",
								selectedFilters[filter.type] && (Array.isArray(selectedFilters[filter.type]) ? selectedFilters[filter.type].length > 0 : selectedFilters[filter.type])
									? theme === 'pink' 
										? "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100 focus:ring-pink-200"
										: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 focus:ring-blue-200"
									: "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md text-gray-700 focus:ring-blue-200"
							)}
						>
							<option value="">{filter.label}</option>
							{#each filter.options as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
						<!-- Chevron Icon -->
						<div class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
							<svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
							</svg>
						</div>
						{#if selectedFilters[filter.type] && (Array.isArray(selectedFilters[filter.type]) ? selectedFilters[filter.type].length > 0 : selectedFilters[filter.type])}
							<button
								onclick={() => clearFilter(filter.type)}
								class="absolute right-1.5 top-1/2 -translate-y-1/2"
							>
								<X class="h-2.5 w-2.5 text-blue-600" />
							</button>
						{/if}
					</div>
				{/each}
			</div>
		</div>
		
		<!-- Desktop Layout -->
		<div class="hidden md:flex items-center justify-between">
			<div class="flex items-center gap-3">
				{#each filters as filter}
					<div class="relative">
						<select
							value={Array.isArray(selectedFilters[filter.type]) ? selectedFilters[filter.type][0] || '' : selectedFilters[filter.type] || ''}
							onchange={(e) => handleFilterChange(filter.type, e.currentTarget.value)}
							class={cn(
								"w-full pl-4 pr-10 py-2.5 rounded-lg border cursor-pointer transition-all duration-200 min-w-[140px] font-medium text-sm shadow-sm focus:outline-none focus:ring-2",
								selectedFilters[filter.type] && (Array.isArray(selectedFilters[filter.type]) ? selectedFilters[filter.type].length > 0 : selectedFilters[filter.type])
									? theme === 'pink' 
										? "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100 hover:border-pink-300 focus:ring-pink-200"
										: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 focus:ring-blue-200"
									: "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md text-gray-700 focus:ring-blue-200"
							)}
						>
							<option value="">{filter.label}</option>
							{#each filter.options as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
						<!-- Chevron Icon -->
						<div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
							<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
							</svg>
						</div>
					</div>
				{/each}
				
				{#if activeFilterCount() > 0}
					<button
						onclick={handleOnClearFilters}
						class="text-sm text-gray-600 hover:text-blue-600 font-medium ml-2"
					>
						Clear all
					</button>
				{/if}
			</div>
		</div>
	</div>
</section>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	
	/* Custom select styling to remove native dropdown appearance */
	select {
		background-image: none;
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
	}
	
	/* Remove default arrow in IE */
	select::-ms-expand {
		display: none;
	}
	
	/* Style the dropdown options */
	select option {
		background-color: white;
		color: #374151;
		padding: 0.5rem;
	}
	
	/* Focus styles */
	select:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
</style>