<script lang="ts">
	import { getContext } from 'svelte';
	import { cn } from '$lib/utils';
	import Button from '$lib/components/ui/button.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
		onclick?: () => void;
		variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
	}

	let { class: className, children, onclick, variant = 'default' }: Props = $props();

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
	{variant}
	class={cn(className)}
	onclick={handleClick}
>
	{@render children()}
</Button>