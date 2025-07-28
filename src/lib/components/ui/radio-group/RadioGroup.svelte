<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	interface Props {
		value?: string;
		onValueChange?: (value: string) => void;
		disabled?: boolean;
		required?: boolean;
		orientation?: 'horizontal' | 'vertical';
		class?: string;
		children?: any;
	}

	let { 
		value = $bindable(),
		onValueChange,
		disabled = false,
		required = false,
		orientation = 'vertical',
		class: className,
		children
	}: Props = $props();

	function handleValueChange(newValue: string) {
		value = newValue;
		onValueChange?.(newValue);
	}
</script>

<RadioGroupPrimitive.Root
	bind:value
	onValueChange={handleValueChange}
	{disabled}
	{required}
	{orientation}
	class={cn("grid gap-2", className)}
>
	{@render children?.()}
</RadioGroupPrimitive.Root>