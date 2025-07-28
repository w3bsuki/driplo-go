<script lang="ts">
	import { ChevronDown, Menu } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { fly } from 'svelte/transition';
	import CategoryDropdown from '$lib/components/shared/CategoryDropdown.svelte';
	import type { Category } from '$lib/types';
	import * as m from '$lib/paraglide/messages.js';
	import { goto } from '$app/navigation';

	interface Props {
		value?: string;
		placeholder?: string;
		onSearch?: (value: string) => void;
		onCategorySelect?: (category: string) => void;
		categories?: Category[];
		activeCategory?: string;
		class?: string;
		visible?: boolean;
	}

	let {
		value = $bindable(''),
		placeholder = m.browse_search_placeholder(),
		onSearch,
		onCategorySelect,
		categories = [],
		activeCategory = '',
		class: className = '',
		visible = true
	}: Props = $props();

	// Calculate dynamic header height
	let headerHeight = $state(56); // Default mobile header height
	
	$effect(() => {
		if (typeof window === 'undefined') return;
		
		// Get actual header height (NOT including banner since it scrolls away)
		const calculateHeaderHeight = () => {
			const header = document.querySelector('header');
			
			if (header) {
				// The header already has the correct height set via Tailwind classes
				// On mobile: h-14 (56px), on desktop: h-16 (64px)
				headerHeight = header.offsetHeight;
			}
		};
		
		// Calculate initially
		calculateHeaderHeight();
		
		// Recalculate on resize
		const handleResize = () => calculateHeaderHeight();
		window.addEventListener('resize', handleResize);
		
		// Recalculate after a short delay to ensure DOM is ready
		setTimeout(calculateHeaderHeight, 100);
		
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	// Dropdown state
	let isCategoryDropdownOpen = $state(false);

	// Toggle dropdown on button click
	function toggleCategoryDropdown() {
		isCategoryDropdownOpen = !isCategoryDropdownOpen;
	}

	// Close dropdown
	function closeCategoryDropdown() {
		isCategoryDropdownOpen = false;
	}

	function handleSearch() {
		onSearch?.(value);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleSearch();
		}
	}

	// Handle category selection from dropdown
	function handleCategoryClick(category: Category) {
		if (onCategorySelect) {
			onCategorySelect(category.slug);
		} else {
			// Default navigation behavior
			goto(`/${category.slug}`);
		}
		closeCategoryDropdown();
	}
</script>

{#if visible}
	<div 
		class={cn(
			"fixed left-0 right-0 z-40 bg-white border-b shadow-sm transition-[top] duration-300 ease-in-out",
			className
		)}
		style:top="{headerHeight}px"
		transition:fly={{ y: -20, duration: 200 }}
	>
		<div class="container mx-auto px-3 md:px-4 py-2 md:py-3">
			<div class="flex items-center gap-2 md:gap-3 max-w-3xl mx-auto">
				<!-- Category Dropdown Button (matching hero style) -->
				<div class="relative flex-shrink-0">
					<button
						data-categories-button
						onclick={toggleCategoryDropdown}
						class={cn(
							"p-2 rounded-lg transition-all focus:outline-none h-[38px] w-[38px] flex items-center justify-center",
							isCategoryDropdownOpen 
								? "bg-gradient-to-r from-blue-300 to-blue-400 text-white shadow-sm" 
								: "bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200"
						)}
						aria-label="Categories"
					>
						<Menu class={cn(
							"h-4 w-4",
							isCategoryDropdownOpen ? "text-white" : "text-gray-900"
						)} />
					</button>
					
					<!-- Category Dropdown (reusing the same component) -->
					<CategoryDropdown
						{categories}
						isOpen={isCategoryDropdownOpen}
						onToggle={toggleCategoryDropdown}
						onClose={closeCategoryDropdown}
					/>
				</div>

				<!-- Search Input with Emoji -->
				<div class="relative flex-1">
					<span class="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none">🔍</span>
					<input
						type="search"
						bind:value
						{placeholder}
						onkeydown={handleKeydown}
						class={cn(
							"w-full pl-9 pr-20 py-2 h-[38px] text-sm",
							"bg-white border border-gray-200 rounded-lg",
							"placeholder:text-gray-400",
							"focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent",
							"transition-all duration-200"
						)}
					/>
					<!-- Search button -->
					<button
						onclick={handleSearch}
						type="button"
						class={cn(
							"absolute right-1 top-1/2 -translate-y-1/2",
							"px-3 py-1.5 h-[30px] bg-blue-500 text-white rounded-md",
							"text-xs font-medium",
							"hover:bg-blue-600 transition-colors",
							"focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
						)}
					>
						{m.quick_filter_search_button()}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}