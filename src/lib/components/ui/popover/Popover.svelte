<script lang="ts">
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import type { Snippet } from 'svelte';

	interface Props {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		children: Snippet;
	}

	let { open = false, onOpenChange, children }: Props = $props();

	const isOpen = writable(open);
	
	$effect(() => {
		isOpen.set(open);
	});

	$effect(() => {
		const unsubscribe = isOpen.subscribe((value) => {
			if (value !== open) {
				onOpenChange?.(value);
			}
		});
		return unsubscribe;
	});

	setContext('popover', {
		isOpen,
		setOpen: (value: boolean) => {
			isOpen.set(value);
			onOpenChange?.(value);
		}
	});
</script>

{@render children()}