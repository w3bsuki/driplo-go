<script lang="ts">
	import { getContext } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
		asChild?: boolean;
	}

	let { class: className, children, asChild = false }: Props = $props();

	const context = getContext<{
		show: () => void;
		hide: () => void;
	}>('tooltip');

	const { show, hide } = context;
</script>

{#if asChild}
	<div
		onmouseenter={show}
		onmouseleave={hide}
		onfocus={show}
		onblur={hide}
	>
		{@render children()}
	</div>
{:else}
	<button
		type="button"
		class={className}
		onmouseenter={show}
		onmouseleave={hide}
		onfocus={show}
		onblur={hide}
	>
		{@render children()}
	</button>
{/if}