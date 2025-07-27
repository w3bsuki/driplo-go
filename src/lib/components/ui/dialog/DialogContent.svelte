<script lang="ts">
	import { cn } from '$lib/utils';
	import { X } from 'lucide-svelte';
	
	interface Props {
		children?: any;
		class?: string;
		showClose?: boolean;
		onClose?: () => void;
	}
	
	let { children, class: className, showClose = true, onClose }: Props = $props();
</script>

<div
	class={cn(
		"w-full max-w-lg bg-white dark:bg-gray-900 rounded-lg shadow-lg border",
		"p-6 animate-in fade-in-0 zoom-in-95",
		className
	)}
>
	{#if showClose}
		<button
			onclick={onClose}
			class="absolute right-4 top-4 rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
		>
			<X class="h-4 w-4" />
			<span class="sr-only">Close</span>
		</button>
	{/if}
	
	{@render children?.()}
</div>

<style>
	@keyframes animate-in {
		from {
			opacity: 0;
			transform: translate(-50%, -48%) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}
	
	.animate-in {
		animation: animate-in 0.2s ease-out;
	}
</style>