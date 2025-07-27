<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { cn } from '$lib/utils';
	import { X } from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	import type { Writable } from 'svelte/store';

	interface Props {
		class?: string;
		children: Snippet;
		showClose?: boolean;
	}

	let { class: className, children, showClose = false }: Props = $props();

	const context = getContext<{
		isOpen: Writable<boolean>;
		setOpen: (value: boolean) => void;
	}>('alert-dialog');

	const { isOpen, setOpen } = context;

	let dialogEl: HTMLDivElement;

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			setOpen(false);
		}
	}

	function handleEscape(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			setOpen(false);
		}
	}

	onMount(() => {
		if ($isOpen && dialogEl) {
			dialogEl.focus();
		}
	});

	$effect(() => {
		if ($isOpen) {
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = '';
			};
		}
	});
</script>

{#if $isOpen}
	<div
		class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
		onclick={handleBackdropClick}
		onkeydown={handleEscape}
		tabindex="-1"
		role="presentation"
	>
		<div
			bind:this={dialogEl}
			role="alertdialog"
			aria-modal="true"
			aria-labelledby="alert-dialog-title"
			aria-describedby="alert-dialog-description"
			class={cn(
				'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg bg-white p-6 shadow-lg animate-in fade-in zoom-in-95 duration-200',
				className
			)}
			tabindex="-1"
		>
			{#if showClose}
				<button
					type="button"
					onclick={() => setOpen(false)}
					class="absolute right-4 top-4 rounded-md opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:pointer-events-none"
				>
					<X class="h-4 w-4" />
					<span class="sr-only">Close</span>
				</button>
			{/if}
			{@render children()}
		</div>
	</div>
{/if}