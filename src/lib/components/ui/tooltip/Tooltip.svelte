<script lang="ts">
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import type { Snippet } from 'svelte';

	interface Props {
		delayDuration?: number;
		children: Snippet;
	}

	let { delayDuration = 500, children }: Props = $props();

	const isOpen = writable(false);
	let timeoutId: number;

	setContext('tooltip', {
		isOpen,
		show: () => {
			clearTimeout(timeoutId);
			timeoutId = window.setTimeout(() => {
				isOpen.set(true);
			}, delayDuration);
		},
		hide: () => {
			clearTimeout(timeoutId);
			isOpen.set(false);
		}
	});
</script>

{@render children()}