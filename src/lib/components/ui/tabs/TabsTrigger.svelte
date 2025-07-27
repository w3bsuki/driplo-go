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
		'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
		isActive
			? 'bg-white text-gray-900 shadow-sm'
			: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
		className
	)}
>
	{@render children()}
</button>