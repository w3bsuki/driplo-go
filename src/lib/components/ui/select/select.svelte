<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		value?: string;
		onValueChange?: (value: string) => void;
		disabled?: boolean;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
	}

	let {
		children,
		value = $bindable(),
		onValueChange,
		disabled = false,
		open = $bindable(),
		onOpenChange,
		...restProps
	}: Props = $props();
</script>

<SelectPrimitive.Root
	bind:value
	{onValueChange}
	{disabled}
	bind:open
	{onOpenChange}
	{...restProps}
>
	{@render children()}
</SelectPrimitive.Root>