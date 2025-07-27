<script lang="ts">
	import { getContext } from 'svelte';
	import { cn } from '$lib/utils';
	import Button from '$lib/components/ui/button.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
		onclick?: () => void;
	}

	let { class: className, children, onclick }: Props = $props();

	const context = getContext<{
		setOpen: (value: boolean) => void;
	}>('alert-dialog');

	const { setOpen } = context;

	function handleClick() {
		onclick?.();
		setOpen(false);
	}
</script>

<Button
	variant="outline"
	class={cn('mt-2 sm:mt-0', className)}
	onclick={handleClick}
>
	{@render children()}
</Button>