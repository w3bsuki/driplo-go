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
		setActiveTab: (tab: string) => void;
	}>('tabs');

	const { activeTab, setActiveTab } = context;
	
	const isActive = $derived($activeTab === value);
</script>

<button
	type="button"
	onclick={() => setActiveTab(value)}
	class={cn(
		'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ring-offset-white disabled:pointer-events-none disabled:opacity-50',
		isActive
			? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 shadow-sm border border-gray-200 dark:border-gray-700'
			: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800',
		className
	)}
>
	{@render children()}
</button>