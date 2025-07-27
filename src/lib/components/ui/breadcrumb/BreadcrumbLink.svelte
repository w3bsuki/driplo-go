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
			'text-gray-600 hover:text-gray-900 transition-colors duration-100 font-medium',
			className
		)}
	>
		{@render children()}
	</a>
{:else}
	<span
		class={cn(
			'text-gray-900 font-medium',
			className
		)}
	>
		{@render children()}
	</span>
{/if}