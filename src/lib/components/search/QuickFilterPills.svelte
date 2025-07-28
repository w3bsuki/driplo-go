<script lang="ts">
	import { cn } from '$lib/utils';
	import { throttle } from '$lib/utils/performance';
	import * as m from '$lib/paraglide/messages.js';

	interface QuickFilter {
		icon: any; // Support both string emojis and Lucide components
		name: string;
		action: string;
		ariaLabel?: string;
		variant?: 'golden' | 'blue' | 'pink' | 'hot' | 'sale' | 'default';
		// Legacy support for boolean flags
		color?: 'golden' | 'blue' | 'pink';
		accent?: boolean;
		golden?: boolean;
		blue?: boolean;
		pink?: boolean;
		hot?: boolean;
		sale?: boolean;
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
					"flex items-center gap-[var(--spacing-1-5)] px-[var(--spacing-3)] py-[var(--spacing-2)]",
					"rounded-[var(--border-radius-sm)] border",
					"focus:outline-none focus:ring-2 focus:ring-offset-1",
					"text-[var(--font-size-sm)] font-medium whitespace-nowrap",
					"transition-all duration-[var(--transition-duration-200)]",
					"active:scale-95 flex-shrink-0",
					// Variant-based styling (preferred)
					(filter.variant === 'golden' || filter.golden) && [
						"bg-[var(--color-surface-primary)] border-[var(--color-warning-500)]",
						"hover:bg-[var(--color-warning-50)] text-[var(--color-text-primary)]",
						"focus:ring-[var(--color-warning-500)]"
					],
					(filter.variant === 'blue' || filter.blue) && [
						"bg-[var(--color-surface-primary)] border-[var(--color-brand-400)]",
						"hover:bg-[var(--color-brand-50)] text-[var(--color-text-primary)]",
						"focus:ring-[var(--color-brand-500)]"
					],
					(filter.variant === 'pink' || filter.pink) && [
						"bg-[var(--color-surface-primary)] border-[var(--color-pink-400)]",
						"hover:bg-[var(--color-pink-50)] text-[var(--color-text-primary)]",
						"focus:ring-[var(--color-pink-500)]"
					],
					(filter.variant === 'hot' || filter.hot) && [
						"bg-[var(--color-surface-primary)] border-[var(--color-error-500)]",
						"hover:bg-[var(--color-error-50)] text-[var(--color-text-primary)]",
						"focus:ring-[var(--color-error-500)]"
					],
					(filter.variant === 'sale' || filter.sale) && [
						"bg-[var(--color-surface-primary)] border-[var(--color-warning-500)]",
						"hover:bg-[var(--color-warning-50)] text-[var(--color-text-primary)]",
						"focus:ring-[var(--color-warning-500)]"
					],
					// Default styling when no variant is specified
					!filter.variant && !filter.golden && !filter.blue && !filter.pink && !filter.hot && !filter.sale && [
						"bg-[var(--color-surface-primary)] border-[var(--color-border-primary)]",
						"hover:border-[var(--color-border-secondary)] hover:bg-[var(--color-surface-secondary)]",
						"text-[var(--color-text-secondary)] focus:ring-[var(--color-brand-500)]"
					]
				)}
			>
				{#if typeof filter.icon === 'string'}
					<span class="text-[var(--font-size-sm)]" aria-hidden="true">{filter.icon}</span>
				{:else}
					<svelte:component this={filter.icon} class="h-3.5 w-3.5" />
				{/if}
				<span>{filter.name}</span>
			</button>
		{/each}
	</div>

	{#if showScrollHint && showScrollArrow}
		<div
			class={cn(
				"absolute right-0 top-0 bottom-0 w-12 md:w-16",
				"bg-gradient-to-l from-[var(--color-surface-primary)] via-[var(--color-surface-primary)]/90 to-transparent",
				"pointer-events-none flex items-center justify-end pr-[var(--spacing-2)] md:pr-[var(--spacing-4)]",
				"transition-opacity duration-[var(--transition-duration-300)]"
			)}
			aria-hidden="true"
		>
			<span class="text-[var(--color-brand-400)] text-[var(--font-size-sm)] md:text-[var(--font-size-lg)] animate-pulse">→</span>
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