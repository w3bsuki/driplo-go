<script lang="ts">
	import { Dialog as SheetPrimitive } from 'bits-ui';
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

<SheetPrimitive.Trigger
	class={className}
	{...restProps}
>
	{@render children()}
</SheetPrimitive.Trigger>