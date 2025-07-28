<script lang="ts">
	import { ChevronDown, ChevronLeft, X } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { clickOutside } from '$lib/actions';
	import { goto } from '$app/navigation';
	import type { Category } from '$lib/types';
	import * as m from '$lib/paraglide/messages.js';
	
	// Import decomposed components and utilities
	import { useCategoryDropdown } from './category-dropdown/hooks/useCategoryDropdown.svelte';
	import { getCategoryData, getCategoryHierarchy } from './category-dropdown/data/categoryData';
	import CategorySection from './category-dropdown/CategorySection.svelte';

	interface Props {
		categories?: Category[];
		isOpen?: boolean;
		onToggle?: () => void;
		onClose?: () => void;
		class?: string;
		initialCategory?: string | null;
	}

	let { 
		categories = [], 
		isOpen = false, 
		onToggle = () => {}, 
		onClose = () => {},
		class: className = '',
		initialCategory = null
	}: Props = $props();

	// Initialize category dropdown state management
	const categoryDropdown = useCategoryDropdown(initialCategory);
	
	// Get category data
	const categoryData = getCategoryData();
	const categoryHierarchy = $derived(getCategoryHierarchy());

	// Handle category navigation
	function handleCategoryClick(item: any) {
		if ('subcategories' in item) {
			// Main category clicked
			categoryDropdown.handleMainCategoryClick(item.slug);
		} else {
			// Subcategory clicked
			categoryDropdown.handleSubcategoryClick(
				categoryDropdown.activeMainCategory, 
				item.slug, 
				onClose
			);
		}
	}

	function handleBrandClick(item: any) {
		categoryDropdown.handleBrandClick(item.name, onClose);
	}

	function handleConditionClick(item: any) {
		categoryDropdown.handleConditionClick(item.value, onClose);
	}

	function handleCollectionClick(item: any) {
		categoryDropdown.handleCollectionClick(item.slug, onClose);
	}

	// Get active subcategories for expanded category
	function getActiveSubcategories() {
		const activeCategory = categoryHierarchy.find(cat => 
			categoryDropdown.activeMainCategory === cat.slug
		);
		return activeCategory?.subcategories || [];
	}
</script>

<!-- Category Dropdown -->
<div 
	class={cn('relative', className)}
>
	<!-- Dropdown Content -->
	{#if isOpen}
		<!-- Invisible backdrop to catch outside clicks -->
		<div 
			class="fixed inset-0 z-[9999]"
			onclick={onClose}
		/>
		
		<!-- Dropdown panel -->
		<div 
			class="relative z-[10000] w-full bg-[var(--color-surface-primary)] rounded-[var(--border-radius-lg)] shadow-[var(--box-shadow-dropdown)] border border-[var(--color-border-primary)] overflow-hidden"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header with Tabs -->
			<div class="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center justify-between">
				<div class="flex items-center gap-1 bg-gray-100 p-0.5 rounded-sm">
					<button
						type="button"
						onclick={(e) => { 
							e.stopPropagation();
							categoryDropdown.setActiveSection('categories');
						}}
						class={cn(
							"px-3 py-1.5 text-xs font-medium rounded-sm transition-colors whitespace-nowrap",
							categoryDropdown.activeSection === 'categories' 
								? "bg-white shadow-sm text-gray-900" 
								: "text-gray-600 hover:text-gray-900"
						)}
					>
						📦 Categories
					</button>
					<button
						type="button"
						onclick={(e) => { 
							e.stopPropagation();
							categoryDropdown.setActiveSection('brands'); 
						}}
						class={cn(
							"px-3 py-1.5 text-xs font-medium rounded-sm transition-colors whitespace-nowrap",
							categoryDropdown.activeSection === 'brands' 
								? "bg-white shadow-sm text-gray-900" 
								: "text-gray-600 hover:text-gray-900"
						)}
					>
						🏷️ Brands
					</button>
					<button
						type="button"
						onclick={(e) => { 
							e.stopPropagation();
							categoryDropdown.setActiveSection('filters');
						}}
						class={cn(
							"px-3 py-1.5 text-xs font-medium rounded-sm transition-colors whitespace-nowrap",
							categoryDropdown.activeSection === 'filters' 
								? "bg-white shadow-sm text-gray-900" 
								: "text-gray-600 hover:text-gray-900"
						)}
					>
						🎯 Filters
					</button>
				</div>
				<button
					type="button"
					onclick={(e) => {
						e.stopPropagation();
						onClose();
					}}
					class="p-1.5 hover:bg-gray-100 rounded-sm transition-colors ml-2"
					aria-label="Close dropdown"
				>
					<X class="w-4 h-4 text-gray-500" />
				</button>
			</div>

			<!-- Content Area -->
			<div class="px-3 py-2 max-h-96 overflow-y-auto">
				{#if categoryDropdown.activeSection === 'categories'}
					<div>
						{#if categoryDropdown.activeMainCategory}
							<!-- Show subcategories for selected category -->
							{@const selectedCategory = categoryHierarchy.find(cat => cat.slug === categoryDropdown.activeMainCategory)}
							{#if selectedCategory}
								<div class="mb-3">
									<button
										onclick={() => {
											categoryDropdown.resetCategory();
										}}
										class="flex items-center gap-1 text-xs text-gray-500 mb-2 hover:text-gray-700"
									>
										<ChevronLeft class="h-3 w-3" />
										<span>Back</span>
									</button>
									<h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
										<span>{selectedCategory.icon}</span>
										<span>{selectedCategory.name}</span>
									</h3>
								</div>
								<div class="grid grid-cols-2 gap-2">
									{#each selectedCategory.subcategories as subcat}
										<button
											onclick={() => handleCategoryClick(subcat)}
											class="flex items-center gap-2 px-3 py-2.5 text-left bg-gray-50 hover:bg-gray-100 rounded-sm transition-colors"
										>
											<span class="text-lg">{subcat.icon}</span>
											<span class="text-sm font-medium text-gray-700">{subcat.name}</span>
										</button>
									{/each}
								</div>
							{/if}
						{:else}
							<!-- Show main categories grid -->
							<div class="grid grid-cols-3 gap-2">
								{#each categoryHierarchy as category}
									<button
										onclick={() => handleCategoryClick(category)}
										class="flex flex-col items-center gap-1 p-2 text-center transition-colors duration-200 hover:bg-gray-50 active:bg-gray-100 rounded-sm"
									>
										<span class="text-xl">{category.icon}</span>
										<span class="text-xs font-medium text-gray-700">{category.name}</span>
									</button>
								{/each}
								
								<!-- Popular Collections -->
								{#each categoryData.popularCollections as collection}
									<button
										onclick={() => handleCollectionClick(collection)}
										class="flex flex-col items-center gap-1 p-2 text-center transition-colors duration-200 hover:bg-gray-50 active:bg-gray-100 rounded-sm"
									>
										<span class="text-xl">{collection.icon}</span>
										<span class="text-xs font-medium text-gray-700">{collection.name}</span>
									</button>
								{/each}
							</div>
						{/if}
					</div>

				{:else if categoryDropdown.activeSection === 'brands'}
					<!-- Brands Grid -->
					<div class="grid grid-cols-3 gap-2">
						{#each categoryData.popularBrands as brand}
							<button
								onclick={() => handleBrandClick(brand)}
								class="flex flex-col items-center gap-1 p-2 text-center transition-colors duration-200 hover:bg-gray-50 active:bg-gray-100 rounded-sm"
							>
								<span class="text-xl">{brand.emoji}</span>
								<span class="text-xs font-medium text-gray-700">{brand.name}</span>
							</button>
						{/each}
					</div>
				{:else if categoryDropdown.activeSection === 'filters'}
					<div class="space-y-4">
						<!-- Conditions -->
						<div>
							<h3 class="text-sm font-medium text-gray-900 mb-2">Condition</h3>
							<div class="grid grid-cols-2 gap-2">
								{#each categoryData.conditionOptions as condition}
									<button
										onclick={() => handleConditionClick(condition)}
										class="flex items-center gap-2 px-3 py-2 text-left bg-gray-50 hover:bg-gray-100 rounded-sm transition-colors"
									>
										<span class="text-lg">{condition.emoji}</span>
										<span class="text-sm font-medium text-gray-700">{condition.label}</span>
									</button>
								{/each}
							</div>
						</div>
						
						<!-- Size Ranges -->
						{#if categoryData.sizeRanges}
							<div class="border-t border-gray-200 pt-3">
								<h3 class="text-sm font-medium text-gray-900 mb-2">Size Ranges</h3>
								<div class="grid grid-cols-3 gap-2">
									{#each categoryData.sizeRanges as size}
										<button
											onclick={() => {
												onClose();
												goto(`/browse?size=${size.value}`);
											}}
											class="px-3 py-2 text-sm font-medium bg-gray-50 hover:bg-gray-100 rounded-sm transition-colors text-center"
										>
											{size.label}
										</button>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>

		</div>
	{/if}
</div>

<style>
	/* Scrollbar styling for dropdown content */
	.overflow-y-auto::-webkit-scrollbar {
		width: 4px;
	}

	.overflow-y-auto::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 2px;
	}

	.overflow-y-auto::-webkit-scrollbar-thumb {
		background: #c1c1c1;
		border-radius: 2px;
	}

	.overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background: #a8a8a8;
	}
</style>