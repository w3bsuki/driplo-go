<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	interface Props {
		value: string;
		disabled?: boolean;
		class?: string;
		id?: string;
		children?: any;
	}

	let { 
		value: itemValue, 
		disabled = false,
		class: className, 
		id,
		children,
		...restProps 
	}: Props = $props();
</script>

<RadioGroupPrimitive.Item
	value={itemValue}
	{disabled}
	{id}
	class={cn(
		"aspect-square h-4 w-4 rounded-full border border-gray-300 text-brand-600 ring-offset-background",
		"focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
		"disabled:cursor-not-allowed disabled:opacity-50",
		"data-[state=checked]:bg-brand-600 data-[state=checked]:border-brand-600 data-[state=checked]:text-white",
		"hover:border-brand-400 transition-all duration-200",
		className
	)}
	{...restProps}
>
	<RadioGroupPrimitive.ItemIndicator class="flex items-center justify-center">
		<div class="h-2 w-2 rounded-full bg-current" />
	</RadioGroupPrimitive.ItemIndicator>
	{#if children}
		{@render children()}
	{/if}
</RadioGroupPrimitive.Item>