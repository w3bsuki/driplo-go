<script lang="ts">
	import { cn } from '$lib/utils';
	import { goto } from '$app/navigation';
	import { ChevronRight } from 'lucide-svelte';
	import type { Category } from '$lib/types';

	interface Props {
		categories?: any[];
	}
	
	let { categories = [] }: Props = $props();

	let selectedCategory = $state('');
	let hoveredCategory = $state('');

	// Category emojis mapping
	const categoryEmojis: Record<string, { emoji: string; color: string }> = {
		women: {
			emoji: '👩',
			color: 'from-pink-400 to-purple-400'
		},
		men: {
			emoji: '👨',
			color: 'from-blue-400 to-indigo-400'
		},
		kids: {
			emoji: '🧸',
			color: 'from-green-400 to-teal-400'
		},
		designer: {
			emoji: '💎',
			color: 'from-yellow-400 to-blue-200'
		},
		shoes: {
			emoji: '👟',
			color: 'from-red-400 to-pink-400'
		},
		bags: {
			emoji: '👜',
			color: 'from-purple-400 to-pink-400'
		}
	};

	const mainCategories = $derived([
		{
			name: 'All',
			value: '',
			slug: '',
			emoji: '🛍️',
			count: 'Browse all',
			color: 'from-blue-200 to-pink-400'
		},
		...categories.map(cat => ({
			name: cat.name,
			value: cat.slug,
			slug: cat.slug,
			emoji: categoryEmojis[cat.slug]?.emoji || '📦',
			count: `${cat.product_count?.[0]?.count || 0} items`,
			color: categoryEmojis[cat.slug]?.color || 'from-gray-400 to-gray-600'
		}))
	]);

	// Removed subcategories - now handled by CategoryDropdown in HeroSearch

	function selectCategory(categorySlug: string) {
		selectedCategory = categorySlug;
		if (categorySlug) {
			// Navigate to dedicated category page
			goto(`/${categorySlug}`);
		} else {
			// Navigate to browse all
			goto('/browse');
		}
	}

	// Removed selectSubcategory function - subcategories now handled by CategoryDropdown
</script>

<section class="pt-3 md:pt-4 pb-1 md:pb-2 bg-gradient-to-b from-blue-50 to-white">
	<div class="container px-4">
		<!-- Main Categories with Circle Images -->
		<div class="mb-1">
			<div class="flex items-start gap-3 md:gap-5 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory justify-start md:justify-center">
				{#each mainCategories as category}
					<button
						onclick={() => selectCategory(category.value)}
						onmouseenter={() => hoveredCategory = category.value}
						onmouseleave={() => hoveredCategory = ''}
						class="group flex-shrink-0 text-center transition-all duration-100 snap-center rounded-sm p-2"
						style="outline: none !important; -webkit-tap-highlight-color: transparent !important; box-shadow: none !important;"
					>
						<!-- Category Emoji Container -->
						<div class="relative mb-2 md:mb-3">
							
							<!-- Emoji Circle -->
							<div class={cn(
								"relative w-16 h-16 md:w-24 md:h-24 mx-auto rounded-sm transition-all duration-100 border-2 flex items-center justify-center",
								`bg-gradient-to-br ${category.color}`,
								selectedCategory === category.value 
									? "border-blue-300 scale-105" 
									: hoveredCategory === category.value
										? "border-blue-200 scale-105"
										: "border-white/30"
							)}>
								<span class={cn(
									"text-2xl md:text-4xl transition-transform duration-100",
									hoveredCategory === category.value && "scale-110"
								)}>
									{category.emoji}
								</span>
							</div>
						</div>
						
						<!-- Category Info -->
						<div class="min-w-[64px] md:min-w-[96px]">
							<h3 class={cn(
								"text-sm md:text-sm font-medium transition-colors duration-100 mb-1",
								selectedCategory === category.value 
									? "text-blue-400" 
									: hoveredCategory === category.value
										? "text-blue-300"
										: "text-gray-900"
							)}>{category.name}</h3>
							<p class={cn(
								"text-xs md:text-sm transition-colors duration-100",
								hoveredCategory === category.value ? "text-gray-600" : "text-gray-400"
							)}>{category.count}</p>
						</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- Removed subcategory pills - now handled by CategoryDropdown in HeroSearch -->
	</div>
</section>

<style>
	/* Hide scrollbar for clean mobile experience */
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	
	/* Remove all browser-specific focus/tap highlights */
	button {
		outline: none !important;
		-webkit-tap-highlight-color: transparent !important;
		-webkit-focus-ring-color: transparent !important;
		-moz-outline: none !important;
		-moz-user-select: none;
		-webkit-user-select: none;
		user-select: none;
		box-shadow: none !important;
	}
	
	button:focus {
		outline: none !important;
		box-shadow: none !important;
		border: none !important;
	}
	
	button:active {
		outline: none !important;
		box-shadow: none !important;
	}
	
	button:focus-visible {
		outline: none !important;
		box-shadow: none !important;
	}
	
	button::-moz-focus-inner {
		border: 0 !important;
		outline: none !important;
	}
</style>