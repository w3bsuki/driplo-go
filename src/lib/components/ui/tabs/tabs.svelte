<script lang="ts">
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		value?: string;
		onValueChange?: (value: string) => void;
		class?: string;
		children: Snippet;
	}

	let { value = '', onValueChange, class: className, children }: Props = $props();

	const activeTab = writable(value);
	$effect(() => {
		activeTab.set(value);
	});

	setContext('tabs', {
		activeTab,
		setActiveTab: (tab: string) => {
			activeTab.set(tab);
			onValueChange?.(tab);
		}
	});
</script>

<div class={cn('w-full', className)}>
	{@render children()}
</div>