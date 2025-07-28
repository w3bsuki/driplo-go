<script lang="ts">
	import { cn } from '$lib/utils';
	import type { CategoryHierarchyItem, SubcategoryItem, BrandItem, ConditionItem, CollectionItem } from './data/categoryData';

	type SectionItem = CategoryHierarchyItem | SubcategoryItem | BrandItem | ConditionItem | CollectionItem;

	interface Props {
		items: SectionItem[];
		gridCols: 2 | 3 | 4 | 6;
		sectionType: 'categories' | 'subcategories' | 'brands' | 'conditions' | 'collections';
		onItemClick: (item: SectionItem) => void;
		showSubcategories?: boolean;
		activeCategory?: string;
		hoveredCategory?: string;
		class?: string;
		emptyMessage?: string;
		loading?: boolean;
	}

	let { 
		items, 
		gridCols, 
		sectionType, 
		onItemClick, 
		showSubcategories = false,
		activeCategory = '',
		hoveredCategory = '',
		class: className = '',
		emptyMessage = 'No items available',
		loading = false
	}: Props = $props();

	// Get grid classes based on column count
	function getGridClasses(): string {
		const gridColsMap = {
			2: 'grid-cols-2',
			3: 'grid-cols-3', 
			4: 'grid-cols-4',
			6: 'grid-cols-6'
		};
		
		return `grid gap-2 ${gridColsMap[gridCols]}`;
	}

	// Get item display properties based on type
	function getItemDisplay(item: SectionItem): { name: string; icon: string; slug?: string; value?: string } {
		switch (sectionType) {
			case 'categories':
				const categoryItem = item as CategoryHierarchyItem;
				return { 
					name: categoryItem.name, 
					icon: categoryItem.icon, 
					slug: categoryItem.slug 
				};
			
			case 'subcategories':
				const subcategoryItem = item as SubcategoryItem;
				return { 
					name: subcategoryItem.name, 
					icon: subcategoryItem.icon, 
					slug: subcategoryItem.slug 
				};
			
			case 'brands':
				const brandItem = item as BrandItem;
				return { 
					name: brandItem.name, 
					icon: brandItem.emoji 
				};
			
			case 'conditions':
				const conditionItem = item as ConditionItem;
				return { 
					name: conditionItem.label, 
					icon: conditionItem.emoji, 
					value: conditionItem.value 
				};
			
			case 'collections':
				const collectionItem = item as CollectionItem;
				return { 
					name: collectionItem.name, 
					icon: collectionItem.icon, 
					slug: collectionItem.slug 
				};
			
			default:
				return { name: 'Unknown', icon: '❓' };
		}
	}

	// Check if item is active/selected
	function isItemActive(item: SectionItem): boolean {
		const display = getItemDisplay(item);
		return display.slug === activeCategory || display.value === activeCategory;
	}

	// Check if item is hovered
	function isItemHovered(item: SectionItem): boolean {
		const display = getItemDisplay(item);
		return display.slug === hoveredCategory || display.value === hoveredCategory;
	}

	// Handle item click
	function handleItemClick(item: SectionItem) {
		onItemClick(item);
	}

	// Handle keyboard navigation
	function handleKeydown(event: KeyboardEvent, item: SectionItem) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleItemClick(item);
		}
	}
</script>

<!-- Category Section Grid -->
<div class={cn('category-section', className)}>
	{#if loading}
		<!-- Loading State -->
		<div class="flex items-center justify-center py-8">
			<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500"></div>
			<span class="ml-2 text-sm text-gray-600">Loading...</span>
		</div>
	{:else if items.length === 0}
		<!-- Empty State -->
		<div class="text-center py-8">
			<div class="text-4xl mb-2">📭</div>
			<p class="text-sm text-gray-500">{emptyMessage}</p>
		</div>
	{:else}
		<!-- Items Grid -->
		<div class={getGridClasses()}>
			{#each items as item, index}
				{@const display = getItemDisplay(item)}
				{@const isActive = isItemActive(item)}
				{@const isHovered = isItemHovered(item)}
				
				<button
					onclick={() => handleItemClick(item)}
					onkeydown={(e) => handleKeydown(e, item)}
					class={cn(
						'group relative flex flex-col items-center p-3 rounded-lg text-center transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500',
						isActive && 'bg-brand-50 text-brand-600 ring-2 ring-brand-500',
						isHovered && !isActive && 'bg-gray-100',
						sectionType === 'categories' && 'min-h-[80px]',
						sectionType === 'subcategories' && 'min-h-[70px]',
						sectionType === 'brands' && 'min-h-[60px]',
						sectionType === 'conditions' && 'min-h-[60px]',
						sectionType === 'collections' && 'min-h-[60px]'
					)}
					type="button"
					aria-label={`Select ${display.name}`}
					tabindex="0"
				>
					<!-- Icon -->
					<div class={cn(
						'text-2xl mb-1 transition-transform duration-200 group-hover:scale-110',
						isActive && 'scale-110'
					)}>
						{display.icon}
					</div>
					
					<!-- Name -->
					<span class={cn(
						'text-xs font-medium leading-tight transition-colors duration-200',
						isActive ? 'text-brand-600' : 'text-gray-700 group-hover:text-gray-900'
					)}>
						{display.name}
					</span>

					<!-- Active Indicator -->
					{#if isActive}
						<div class="absolute inset-0 rounded-lg border-2 border-brand-500 pointer-events-none"></div>
					{/if}

					<!-- Subcategory Count (for main categories) -->
					{#if sectionType === 'categories' && 'subcategories' in item && item.subcategories.length > 0}
						<div class="absolute -top-1 -right-1 bg-brand-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
							{item.subcategories.length}
						</div>
					{/if}
				</button>

				<!-- Subcategories (if enabled and category is active) -->
				{#if showSubcategories && sectionType === 'categories' && 'subcategories' in item && item.subcategories.length > 0 && (isActive || isHovered)}
					<div class="col-span-full mt-2 p-2 bg-gray-50 rounded-lg border">
						<div class="grid grid-cols-2 md:grid-cols-3 gap-1">
							{#each item.subcategories as subcategory}
								<button
									onclick={() => onItemClick(subcategory)}
									class="flex items-center space-x-2 px-2 py-1 text-xs text-gray-600 hover:text-brand-600 hover:bg-white rounded transition-colors"
									type="button"
								>
									<span>{subcategory.icon}</span>
									<span class="truncate">{subcategory.name}</span>
								</button>
							{/each}
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Loading spinner animation */
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.animate-spin {
		animation: spin 1s linear infinite;
	}

	/* Enhanced focus styles for accessibility */
	button:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	/* Smooth hover transitions */
	button:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	/* Category section spacing */
	.category-section {
		min-height: 120px;
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		button {
			min-height: 60px !important;
			padding: 0.5rem;
		}
		
		.text-2xl {
			font-size: 1.25rem;
		}
		
		.text-xs {
			font-size: 0.6rem;
		}
	}
</style>