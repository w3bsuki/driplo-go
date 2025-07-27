<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		href?: string;
		isActive?: boolean;
		disabled?: boolean;
		class?: string;
		children: Snippet;
		onclick?: () => void;
	}

	let { href, isActive = false, disabled = false, class: className, children, onclick }: Props = $props();
</script>

{#if href}
	<a
		{href}
		class={cn(
			'flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors duration-100',
			isActive
				? 'bg-brand-500 text-white'
				: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
			disabled && 'pointer-events-none opacity-50',
			className
		)}
		aria-current={isActive ? 'page' : undefined}
		tabindex={disabled ? -1 : undefined}
	>
		{@render children()}
	</a>
{:else}
	<button
		type="button"
		class={cn(
			'flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors duration-100',
			isActive
				? 'bg-brand-500 text-white'
				: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
			disabled && 'pointer-events-none opacity-50',
			className
		)}
		aria-current={isActive ? 'page' : undefined}
		{disabled}
		{onclick}
	>
		{@render children()}
	</button>
{/if}