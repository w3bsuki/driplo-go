<script lang="ts">
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils/cn';
	import * as m from '$lib/paraglide/messages.js';
	import type { HTMLInputAttributes } from 'svelte/elements';
	
	interface SearchBarProps extends Omit<HTMLInputAttributes, 'onkeydown' | 'type' | 'placeholder'> {
		value?: string;
		placeholder?: string;
		class?: string;
		onSearch?: (query: string) => void;
	}
	
	let {
		value = $bindable(''),
		placeholder = m.header_search_placeholder(),
		class: className = '',
		onSearch,
		...restProps
	}: SearchBarProps = $props();
	
	function handleSearch() {
		if (onSearch) {
			onSearch(value.trim());
		} else {
			// Default navigation behavior
			if (value.trim()) {
				goto(`/browse?q=${encodeURIComponent(value.trim())}`);
			} else {
				goto('/browse');
			}
		}
	}
	
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleSearch();
		}
	}
</script>

<div class={cn("relative", className)} role="search">
	<span class="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none" aria-hidden="true">🔍</span>
	<input
		{...restProps}
		type="search"
		{placeholder}
		bind:value
		onkeydown={handleKeyDown}
		class={cn(
			"w-full h-[var(--input-height-lg)] rounded-sm",
			"border border-input bg-background",
			"pl-10 pr-4 text-sm placeholder:text-muted-foreground",
			"focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-transparent",
			"transition-all duration-100 will-change-transform"
		)}
		aria-label="Search products"
		autocomplete="off"
	/>
</div>

<style>
	/* Enhanced search input focus animation with GPU acceleration */
	input[type="search"]:focus-visible {
		transform: scale(1.01) translateZ(0);
		transition: transform 150ms cubic-bezier(0.5, 1.25, 0.75, 1.25),
		           box-shadow 150ms ease-out;
		backface-visibility: hidden;
	}
	
	/* Respect reduced motion preferences */
	@media (prefers-reduced-motion: reduce) {
		input[type="search"]:focus-visible {
			transform: scale(1) translateZ(0);
			transition-duration: 0.01ms;
		}
	}
</style>