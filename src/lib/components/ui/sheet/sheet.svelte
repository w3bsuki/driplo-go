<script lang="ts">
	import { Dialog as SheetPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		closeOnEscape?: boolean;
		closeOnOutsideClick?: boolean;
		portal?: HTMLElement | string | null;
		forceMount?: boolean;
		openFocus?: HTMLElement | string | null;
		closeFocus?: HTMLElement | string | null;
		preventScroll?: boolean;
		role?: 'dialog' | 'alertdialog';
		[key: string]: any;
	}

	let {
		children,
		open = $bindable(),
		onOpenChange,
		closeOnEscape = true,
		closeOnOutsideClick = true,
		portal,
		forceMount = false,
		openFocus,
		closeFocus,
		preventScroll = true,
		role = 'dialog',
		...restProps
	}: Props = $props();
</script>

<SheetPrimitive.Root
	bind:open
	{onOpenChange}
	{closeOnEscape}
	{closeOnOutsideClick}
	{portal}
	{forceMount}
	{openFocus}
	{closeFocus}
	{preventScroll}
	{role}
	{...restProps}
>
	{@render children()}
</SheetPrimitive.Root>