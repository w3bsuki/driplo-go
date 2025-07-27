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
		isOpen: Writable<boolean>;
		setOpen: (value: boolean) => void;
	}>('popover');

	const { isOpen, setOpen } = context;

	function handleClick() {
		setOpen(!$isOpen);
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
		aria-expanded={$isOpen}
		aria-haspopup="true"
	>
		{@render children()}
	</button>
{/if}