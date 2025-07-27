<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className, children }: Props = $props();
</script>

<tfoot
	class={cn(
		'border-t bg-gray-50/50 font-medium [&>tr]:last:border-b-0',
		className
	)}
>
	{@render children()}
</tfoot>