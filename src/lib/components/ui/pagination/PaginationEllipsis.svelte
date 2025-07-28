<script lang="ts">
	import { cn } from '$lib/utils';
	import { MoreHorizontal } from 'lucide-svelte';

	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();
</script>

<span
	aria-hidden
	class={cn('flex h-8 w-8 items-center justify-center', className)}
>
	<MoreHorizontal class="h-4 w-4 text-gray-400" />
	<span class="sr-only">More pages</span>
</span>