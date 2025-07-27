<script lang="ts">
	import { type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface AvatarFallbackProps extends HTMLAttributes<HTMLSpanElement> {
		class?: string;
		children: Snippet;
	}

	let {
		class: className = '',
		children,
		...restProps
	}: AvatarFallbackProps = $props();
</script>

<span
	class={cn(
		'flex h-full w-full items-center justify-center rounded-full bg-gray-200',
		className
	)}
	{...restProps}
>
	{@render children()}
</span>