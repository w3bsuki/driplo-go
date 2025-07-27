<script lang="ts">
	import { Dialog as SheetPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		class?: string;
		[key: string]: any;
	}

	let {
		children,
		class: className,
		...restProps
	}: Props = $props();
</script>

<SheetPrimitive.Title
	class={cn('text-lg font-semibold text-foreground', className)}
	{...restProps}
>
	{@render children()}
</SheetPrimitive.Title>