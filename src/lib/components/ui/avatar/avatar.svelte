<script lang="ts">
	import { type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
		class?: string;
		children: Snippet;
	}

	let {
		class: className = '',
		children,
		...restProps
	}: AvatarProps = $props();
</script>

<span
	class={cn(
		'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
		className
	)}
	{...restProps}
>
	{@render children()}
</span>