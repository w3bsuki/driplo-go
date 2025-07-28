<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { ChevronDown } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		class?: string;
		size?: 'sm' | 'md' | 'lg';
		[key: string]: any;
	}

	let {
		children,
		class: className,
		size = 'md',
		...restProps
	}: Props = $props();
</script>

<SelectPrimitive.Trigger
	class={cn(
		'flex w-full items-center justify-between rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white transition-all duration-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 input-compact-safe',
		size === 'sm' && 'h-[var(--input-height-sm)]',
		size === 'md' && 'h-[var(--input-height-md)]',
		size === 'lg' && 'h-[var(--input-height-lg)]',
		className
	)}
	{...restProps}
>
	{@render children()}
	<ChevronDown class="h-4 w-4 opacity-50" />
</SelectPrimitive.Trigger>