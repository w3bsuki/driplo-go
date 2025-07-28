<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { Check } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		class?: string;
		value: string;
		label?: string;
		disabled?: boolean;
		[key: string]: any;
	}

	let {
		children,
		class: className,
		value,
		label,
		disabled = false,
		...restProps
	}: Props = $props();
</script>

<SelectPrimitive.Item
	class={cn(
		'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
		className
	)}
	{value}
	{label}
	{disabled}
	{...restProps}
>
	<span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
		<Check class="h-4 w-4" />
	</span>
	{@render children()}
</SelectPrimitive.Item>