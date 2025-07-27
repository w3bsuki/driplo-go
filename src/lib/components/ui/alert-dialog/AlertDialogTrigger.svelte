<script lang="ts">
	import { getContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { Writable } from 'svelte/store';

	interface Props {
		class?: string;
		children: Snippet;
		asChild?: boolean;
	}

	let { class: className, children, asChild = false }: Props = $props();

	const context = getContext<{
		setOpen: (value: boolean) => void;
	}>('alert-dialog');

	const { setOpen } = context;

	function handleClick() {
		setOpen(true);
	}
</script>

{#if asChild}
	<div onclick={handleClick}>
		{@render children()}
	</div>
{:else}
	<button
		type="button"
		class={className}
		onclick={handleClick}
	>
		{@render children()}
	</button>
{/if}