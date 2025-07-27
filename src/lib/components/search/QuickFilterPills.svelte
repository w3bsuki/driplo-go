<script lang="ts">
	import { cn } from '$lib/utils';
	import { throttle } from '$lib/utils/performance';
	import * as m from '$lib/paraglide/messages.js';

	interface QuickFilter {
		icon: string;
		name: string;
		action: string;
		ariaLabel?: string;
		color?: 'golden' | 'blue' | 'pink';
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

	// Constants for better maintainability
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

	// Slice filters if maxVisibleFilters is provided
	const displayFilters = $derived(
		maxVisibleFilters ? filters.slice(0, maxVisibleFilters) : filters
	);
</script>

<div class="relative overflow-hidden {className}">
	<div
		bind:this={containerRef}
		onscroll={throttledHandleScroll}
		class="flex items-center gap-2 md:gap-2.5 overflow-x-auto scrollbar-hide"
		role="group"
		aria-label={m.filter_categories()}
	>
		{#each displayFilters as filter}
			<button
				onclick={() => onFilterClick(filter.action)}
				onkeydown={(e) => handleKeyDown(e, filter.action)}
				aria-label={filter.ariaLabel || filter.name}
				aria-pressed="false"
				class={cn(
					"flex items-center gap-1.5 px-3 py-2",
					"rounded-lg border",
					"focus:outline-none focus:ring-2 focus:ring-offset-1",
					"text-xs font-medium whitespace-nowrap",
					"transition-all duration-200",
					"active:scale-95 flex-shrink-0",
					filter.color === 'golden' && [
						"bg-gradient-to-r from-yellow-50 to-amber-50 border-amber-300",
						"hover:from-yellow-100 hover:to-amber-100 hover:border-amber-400",
						"text-amber-800 focus:ring-amber-400"
					],
					filter.color === 'blue' && [
						"bg-gradient-to-r from-blue-50 to-sky-50 border-blue-300",
						"hover:from-blue-100 hover:to-sky-100 hover:border-blue-400",
						"text-blue-800 focus:ring-blue-400"
					],
					filter.color === 'pink' && [
						"bg-gradient-to-r from-pink-50 to-rose-50 border-pink-300",
						"hover:from-pink-100 hover:to-rose-100 hover:border-pink-400",
						"text-pink-800 focus:ring-pink-400"
					],
					!filter.color && [
						"bg-white border-gray-200",
						"hover:border-gray-300 hover:bg-gray-50",
						"text-gray-700 focus:ring-blue-400"
					]
				)}
			>
				<span class="text-sm" aria-hidden="true">{filter.icon}</span>
				<span>{filter.name}</span>
			</button>
		{/each}
	</div>

	{#if showScrollHint && showScrollArrow}
		<div
			class={cn(
				"absolute right-0 top-0 bottom-0 w-12 md:w-16",
				"bg-gradient-to-l from-white via-white/90 to-transparent",
				"pointer-events-none flex items-center justify-end pr-2 md:pr-4",
				"transition-opacity duration-300"
			)}
			aria-hidden="true"
		>
			<span class="text-blue-400 text-sm md:text-lg animate-pulse">→</span>
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