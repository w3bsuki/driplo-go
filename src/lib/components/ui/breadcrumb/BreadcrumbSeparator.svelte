<script lang="ts">
	import { cn } from '$lib/utils';
	import { ChevronRight } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children?: Snippet;
	}

	let { class: className, children }: Props = $props();
</script>

<li role="presentation" class={cn('mx-1', className)}>
	{#if children}
		{@render children()}
	{:else}
		<ChevronRight class="h-3.5 w-3.5 text-gray-400" />
	{/if}
</li>