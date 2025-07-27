<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className, children }: Props = $props();
</script>

<nav
	role="navigation"
	aria-label="pagination"
	class={cn('mx-auto flex w-full justify-center', className)}
>
	<ul class="flex flex-row items-center gap-1">
		{@render children()}
	</ul>
</nav>