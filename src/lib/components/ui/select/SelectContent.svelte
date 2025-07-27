<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		class?: string;
		position?: 'popper' | 'item-aligned';
		side?: 'top' | 'right' | 'bottom' | 'left';
		sideOffset?: number;
		align?: 'start' | 'center' | 'end';
		alignOffset?: number;
		avoidCollisions?: boolean;
		collisionBoundary?: Element | Element[];
		collisionPadding?: number;
		sticky?: 'partial' | 'always';
		hideWhenDetached?: boolean;
		[key: string]: any;
	}

	let {
		children,
		class: className,
		position = 'popper',
		side = 'bottom',
		sideOffset = 4,
		align = 'start',
		alignOffset = 0,
		avoidCollisions = true,
		collisionBoundary = [],
		collisionPadding = 10,
		sticky = 'partial',
		hideWhenDetached = false,
		...restProps
	}: Props = $props();
</script>

<SelectPrimitive.Content
	class={cn(
		'relative z-50 min-w-[8rem] overflow-hidden rounded-sm border bg-white text-gray-900 shadow-md',
		className
	)}
	{side}
	{sideOffset}
	{align}
	{alignOffset}
	{avoidCollisions}
	{collisionBoundary}
	{collisionPadding}
	{sticky}
	{hideWhenDetached}
	{...restProps}
>
	<SelectPrimitive.Viewport class="p-1">
		{@render children()}
	</SelectPrimitive.Viewport>
</SelectPrimitive.Content>