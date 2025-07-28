<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		href?: string;
		class?: string;
		children: Snippet;
	}

	let { href, class: className, children }: Props = $props();
</script>

{#if href}
	<a
		{href}
		class={cn(
			'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 transition-colors duration-150 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 rounded-sm',
			className
		)}
	>
		{@render children()}
	</a>
{:else}
	<span
		class={cn(
			'text-gray-900 dark:text-gray-50 font-medium',
			className
		)}
	>
		{@render children()}
	</span>
{/if}