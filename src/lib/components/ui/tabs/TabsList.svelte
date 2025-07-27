<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className, children }: Props = $props();
</script>

<div
	class={cn(
		'inline-flex h-8 items-center justify-center rounded-md bg-gray-50 p-0.5 text-gray-600 border border-gray-200',
		className
	)}
>
	{@render children()}
</div>