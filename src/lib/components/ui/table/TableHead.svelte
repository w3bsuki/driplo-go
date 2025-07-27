<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className, children }: Props = $props();
</script>

<th
	class={cn(
		'h-10 px-3 text-left align-middle font-medium text-gray-600 [&:has([role=checkbox])]:pr-0',
		className
	)}
>
	{@render children()}
</th>