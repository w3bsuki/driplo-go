<script lang="ts">
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

<div
	class={cn('flex flex-col space-y-2 text-center sm:text-left', className)}
	{...restProps}
>
	{@render children()}
</div>