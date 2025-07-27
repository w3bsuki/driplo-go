<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className, children }: Props = $props();
</script>

<h2
	id="alert-dialog-title"
	class={cn('text-lg font-semibold', className)}
>
	{@render children()}
</h2>