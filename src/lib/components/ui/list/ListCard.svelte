<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
		onclick?: () => void;
		hoverable?: boolean;
	}

	let { 
		class: className, 
		children, 
		onclick,
		hoverable = false 
	}: Props = $props();
</script>

<li
	class={cn(
		'rounded-md border border-gray-200 bg-white p-4',
		hoverable && 'transition-colors hover:bg-gray-50',
		onclick && 'cursor-pointer',
		className
	)}
	{onclick}
	role={onclick ? 'button' : undefined}
	tabindex={onclick ? 0 : undefined}
	onkeydown={(e) => {
		if (onclick && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			onclick();
		}
	}}
>
	{@render children()}
</li>