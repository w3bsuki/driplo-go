<script lang="ts">
	import { getContext } from 'svelte';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { Writable } from 'svelte/store';

	interface Props {
		value: string;
		class?: string;
		children: Snippet;
	}

	let { value, class: className, children }: Props = $props();

	const context = getContext<{
		activeTab: Writable<string>;
	}>('tabs');

	const { activeTab } = context;
	
	const isActive = $derived($activeTab === value);
</script>

{#if isActive}
	<div
		class={cn(
			'mt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
			className
		)}
	>
		{@render children()}
	</div>
{/if}