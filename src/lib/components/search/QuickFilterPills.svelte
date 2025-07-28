<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import { throttle } from '$lib/utils/performance';
	import * as m from '$lib/paraglide/messages.js';

	interface QuickFilter {
		icon: string;
		name: string;
		action: string;
		ariaLabel?: string;
		variant?: 'golden' | 'blue' | 'pink' | 'hot' | 'sale' | 'default';
	}

	interface Props {
		filters: QuickFilter[];
		onFilterClick: (action: string) => void;
		class?: string;
		showScrollHint?: boolean;
		maxVisibleFilters?: number;
	}

	let {
		filters,
		onFilterClick,
		class: className = '',
		showScrollHint = true,
		maxVisibleFilters
	}: Props = $props();

	let containerRef: HTMLElement;
	let showScrollArrow = $state(true);

	const SCROLL_THROTTLE_DELAY = 100;
	const SCROLL_THRESHOLD = 10;

	function handleScroll() {
		if (containerRef) {
			showScrollArrow = containerRef.scrollLeft < SCROLL_THRESHOLD;
		}
	}

	const throttledHandleScroll = throttle(handleScroll, SCROLL_THROTTLE_DELAY);

	function handleKeyDown(event: KeyboardEvent, action: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onFilterClick(action);
		}
	}

	const displayFilters = $derived(
		maxVisibleFilters ? filters.slice(0, maxVisibleFilters) : filters
	);

	const getFilterClasses = (variant?: string) => cn(
		"flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm font-medium whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-95 flex-shrink-0",
		{
			'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0': variant === 'blue',
			'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white border-0': variant === 'pink', 
			'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white border-0': variant === 'golden',
			'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0': variant === 'hot',
			'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0': variant === 'sale',
			'border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300': !variant || variant === 'default'
		}
	);
</script>

<div class="relative overflow-hidden {className}">
	<div
		bind:this={containerRef}
		onscroll={throttledHandleScroll}
		class="flex items-center gap-2 overflow-x-auto scrollbar-hide"
		role="group"
		aria-label={m.filter_categories()}
	>
		{#each displayFilters as filter}
			<button
				onclick={() => onFilterClick(filter.action)}
				onkeydown={(e) => handleKeyDown(e, filter.action)}
				aria-label={filter.ariaLabel || filter.name}
				class={getFilterClasses(filter.variant)}
			>
				<span class="text-sm" aria-hidden="true">{filter.icon}</span>
				<span>{filter.name}</span>
			</button>
		{/each}
	</div>

	{#if showScrollHint && showScrollArrow}
		<div
			class="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none flex items-center justify-end pr-2"
			aria-hidden="true"
		>
			<span class="text-blue-400 text-sm animate-pulse">→</span>
		</div>
	{/if}
</div>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>