<script lang="ts">
	import { cn } from '$lib/utils';
	import { ChevronRight } from 'lucide-svelte';
	import PaginationLink from './PaginationLink.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		href?: string;
		class?: string;
		children?: Snippet;
		onclick?: () => void;
		disabled?: boolean;
	}

	let { href, class: className, children, onclick, disabled = false }: Props = $props();
</script>

<PaginationLink
	{href}
	{onclick}
	{disabled}
	class={cn('gap-1 px-2.5', className)}
	aria-label="Go to next page"
>
	{#if children}
		<span class="sr-only sm:not-sr-only">{@render children()}</span>
	{/if}
	<ChevronRight class="h-4 w-4" />
</PaginationLink>