<script lang="ts">
	import { ChevronLeft, X } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { goto } from '$app/navigation';
	import type { Category } from '$lib/types';
	
	// Import decomposed components and utilities
	import { useCategoryDropdown } from './category-dropdown/hooks/useCategoryDropdown.svelte';
	import { getCategoryData, getCategoryHierarchy } from './category-dropdown/data/categoryData';

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
</script>

<!-- Category Dropdown -->
<div class={cn('relative', className)}>
	{#if isOpen}
		<!-- Invisible backdrop to catch outside clicks -->
		<div 
			class="fixed inset-0 z-40"
			onclick={onClose}
		/>
		
		<!-- Dropdown panel -->
		<div 
			class="relative z-50 w-full bg-[var(--color-surface-primary)] rounded-[var(--border-radius-lg)] shadow-[var(--box-shadow-dropdown)] border border-[var(--color-border-primary)] overflow-hidden"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header with Tabs -->
			<div class="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-primary)] px-[var(--spacing-3)] py-[var(--spacing-2)] flex items-center justify-between">
				<div class="flex items-center gap-[var(--spacing-1)] bg-[var(--color-surface-tertiary)] p-[0.125rem] rounded-[var(--border-radius-sm)]">
					<button
						type="button"
						onclick={() => categoryDropdown.setActiveSection('categories')}
						class={cn(
							"px-[var(--spacing-3)] py-[var(--spacing-1-5)] text-[var(--font-size-xs)] font-medium rounded-[var(--border-radius-sm)] transition-colors whitespace-nowrap",
							categoryDropdown.activeSection === 'categories' 
								? "bg-[var(--color-surface-primary)] shadow-sm text-[var(--color-text-primary)]" 
								: "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
						)}
					>
						📦 Categories
					</button>
					<button
						type="button"
						onclick={() => categoryDropdown.setActiveSection('brands')}
						class={cn(
							"px-[var(--spacing-3)] py-[var(--spacing-1-5)] text-[var(--font-size-xs)] font-medium rounded-[var(--border-radius-sm)] transition-colors whitespace-nowrap",
							categoryDropdown.activeSection === 'brands' 
								? "bg-[var(--color-surface-primary)] shadow-sm text-[var(--color-text-primary)]" 
								: "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
						)}
					>
						🏷️ Brands
					</button>
					<button
						type="button"
						onclick={() => categoryDropdown.setActiveSection('filters')}
						class={cn(
							"px-[var(--spacing-3)] py-[var(--spacing-1-5)] text-[var(--font-size-xs)] font-medium rounded-[var(--border-radius-sm)] transition-colors whitespace-nowrap",
							categoryDropdown.activeSection === 'filters' 
								? "bg-[var(--color-surface-primary)] shadow-sm text-[var(--color-text-primary)]" 
								: "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
						)}
					>
						🎯 Filters
					</button>
				</div>
				<button
					type="button"
					onclick={onClose}
					class="p-[var(--spacing-1-5)] hover:bg-[var(--color-surface-hover)] rounded-[var(--border-radius-sm)] transition-colors"
					aria-label="Close dropdown"
				>
					<X class="w-4 h-4 text-[var(--color-text-tertiary)]" />
				</button>
			</div>

			<!-- Content Area -->
			<div class="px-[var(--spacing-3)] py-[var(--spacing-2)] max-h-[24rem] overflow-y-auto">
				{#if categoryDropdown.activeSection === 'categories'}
					<div>
						{#if categoryDropdown.activeMainCategory}
							<!-- Show subcategories for selected category -->
							{@const selectedCategory = categoryHierarchy.find(cat => cat.slug === categoryDropdown.activeMainCategory)}
							{#if selectedCategory}
								<div class="mb-3">
									<button
										onclick={() => categoryDropdown.resetCategory()}
										class="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] mb-2 hover:text-[var(--color-text-secondary)]"
									>
										<ChevronLeft class="h-3 w-3" />
										<span>Back</span>
									</button>
									<h3 class="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
										<span>{selectedCategory.icon}</span>
										<span>{selectedCategory.name}</span>
									</h3>
								</div>
								<div class="grid grid-cols-2 gap-2">
									{#each selectedCategory.subcategories as subcat}
										<button
											onclick={() => handleCategoryClick(subcat)}
											class="flex items-center gap-2 px-3 py-2.5 text-left bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-tertiary)] rounded-[var(--border-radius-sm)] transition-colors"
										>
											<span class="text-lg">{subcat.icon}</span>
											<span class="text-sm font-medium text-[var(--color-text-secondary)]">{subcat.name}</span>
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
										class="flex flex-col items-center gap-1 p-2 text-center transition-colors duration-200 hover:bg-[var(--color-surface-secondary)] active:bg-[var(--color-surface-tertiary)] rounded-[var(--border-radius-sm)]"
									>
										<span class="text-xl">{category.icon}</span>
										<span class="text-xs font-medium text-[var(--color-text-secondary)]">{category.name}</span>
									</button>
								{/each}
								
								<!-- Popular Collections -->
								{#each categoryData.popularCollections as collection}
									<button
										onclick={() => handleCollectionClick(collection)}
										class="flex flex-col items-center gap-1 p-2 text-center transition-colors duration-200 hover:bg-[var(--color-surface-secondary)] active:bg-[var(--color-surface-tertiary)] rounded-[var(--border-radius-sm)]"
									>
										<span class="text-xl">{collection.icon}</span>
										<span class="text-xs font-medium text-[var(--color-text-secondary)]">{collection.name}</span>
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
								class="flex flex-col items-center gap-1 p-2 text-center transition-colors duration-200 hover:bg-[var(--color-surface-secondary)] active:bg-[var(--color-surface-tertiary)] rounded-[var(--border-radius-sm)]"
							>
								<span class="text-xl">{brand.emoji}</span>
								<span class="text-xs font-medium text-[var(--color-text-secondary)]">{brand.name}</span>
							</button>
						{/each}
					</div>
				{:else if categoryDropdown.activeSection === 'filters'}
					<div class="space-y-4">
						<!-- Conditions -->
						<div>
							<h3 class="text-sm font-medium text-[var(--color-text-primary)] mb-2">Condition</h3>
							<div class="grid grid-cols-2 gap-2">
								{#each categoryData.conditionOptions as condition}
									<button
										onclick={() => handleConditionClick(condition)}
										class="flex items-center gap-2 px-3 py-2 text-left bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-tertiary)] rounded-[var(--border-radius-sm)] transition-colors"
									>
										<span class="text-lg">{condition.emoji}</span>
										<span class="text-sm font-medium text-[var(--color-text-secondary)]">{condition.label}</span>
									</button>
								{/each}
							</div>
						</div>
						
						<!-- Size Ranges -->
						{#if categoryData.sizeRanges}
							<div class="border-t border-[var(--color-border-primary)] pt-3">
								<h3 class="text-sm font-medium text-[var(--color-text-primary)] mb-2">Size Ranges</h3>
								<div class="grid grid-cols-3 gap-2">
									{#each categoryData.sizeRanges as size}
										<button
											onclick={() => {
												onClose();
												goto(`/browse?size=${size.value}`);
											}}
											class="px-3 py-2 text-sm font-medium bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-tertiary)] rounded-[var(--border-radius-sm)] transition-colors text-center"
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
			
			<!-- CTA Section -->
			<div class="border-t border-[var(--color-border-primary)] px-[var(--spacing-3)] py-[var(--spacing-3)] bg-[var(--color-surface-secondary)]">
				<div class="flex items-center justify-between gap-[var(--spacing-3)]">
					<button
						onclick={() => {
							onClose();
							goto('/browse');
						}}
						class="flex-1 px-[var(--spacing-4)] py-[var(--spacing-2)] text-[var(--font-size-sm)] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[var(--color-surface-primary)] hover:bg-[var(--color-surface-tertiary)] border border-[var(--color-border-primary)] rounded-[var(--border-radius-sm)] transition-colors"
					>
						🔍 View All
					</button>
					<button
						onclick={() => {
							onClose();
							goto('/browse?filter=sale');
						}}
						class="flex-1 px-[var(--spacing-4)] py-[var(--spacing-2)] text-[var(--font-size-sm)] font-medium text-[var(--color-error-600)] hover:text-[var(--color-error-500)] bg-[var(--color-surface-primary)] hover:bg-[var(--color-error-50)] border border-[var(--color-error-200)] rounded-[var(--border-radius-sm)] transition-colors"
					>
						🔥 Sale Items
					</button>
				</div>
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
		background: var(--color-surface-secondary);
		border-radius: 2px;
	}

	.overflow-y-auto::-webkit-scrollbar-thumb {
		background: var(--color-border-secondary);
		border-radius: 2px;
	}

	.overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background: var(--color-border-primary);
	}
</style>