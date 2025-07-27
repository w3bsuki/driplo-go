<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className, children }: Props = $props();
</script>

<nav aria-label="breadcrumb" class={cn('', className)}>
	<ol class="flex items-center gap-1.5 text-sm">
		{@render children()}
	</ol>
</nav>