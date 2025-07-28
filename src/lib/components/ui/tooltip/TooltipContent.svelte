<script lang="ts">
	import { getContext } from 'svelte';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { Writable } from 'svelte/store';

	interface Props {
		class?: string;
		children: Snippet;
		side?: 'top' | 'right' | 'bottom' | 'left';
		sideOffset?: number;
	}

	let { 
		class: className, 
		children,
		side = 'top',
		sideOffset = 4
	}: Props = $props();

	const context = getContext<{
		isOpen: Writable<boolean>;
	}>('tooltip');

	const { isOpen } = context;

	const sideClasses = {
		top: 'bottom-full left-1/2 -translate-x-1/2 mb-1',
		right: 'left-full top-1/2 -translate-y-1/2 ml-1',
		bottom: 'top-full left-1/2 -translate-x-1/2 mt-1',
		left: 'right-full top-1/2 -translate-y-1/2 mr-1'
	};
</script>

{#if $isOpen}
	<div
		role="tooltip"
		class={cn(
			'absolute z-tooltip rounded-md bg-gray-900 dark:bg-gray-700 px-3 py-1.5 text-xs text-white dark:text-gray-50 animate-in fade-in-0 zoom-in-95 duration-100 shadow-md border border-gray-700 dark:border-gray-600',
			sideClasses[side],
			className
		)}
	>
		{@render children()}
		<div 
			class={cn(
				'absolute h-1.5 w-1.5 rotate-45 bg-gray-900 dark:bg-gray-700 border-l border-b border-gray-700 dark:border-gray-600',
				side === 'top' && 'top-full left-1/2 -translate-x-1/2 -translate-y-1',
				side === 'right' && 'right-full top-1/2 -translate-y-1/2 translate-x-1',
				side === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 translate-y-1',
				side === 'left' && 'left-full top-1/2 -translate-y-1/2 -translate-x-1'
			)}
		/>
	</div>
{/if}