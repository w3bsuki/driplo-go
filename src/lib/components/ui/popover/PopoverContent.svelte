<script lang="ts">
	import { getContext, onMount, tick } from 'svelte';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { Writable } from 'svelte/store';

	interface Props {
		class?: string;
		children: Snippet;
		align?: 'start' | 'center' | 'end';
		side?: 'top' | 'right' | 'bottom' | 'left';
		sideOffset?: number;
	}

	let { 
		class: className, 
		children, 
		align = 'center',
		side = 'bottom',
		sideOffset = 4
	}: Props = $props();

	const context = getContext<{
		isOpen: Writable<boolean>;
		setOpen: (value: boolean) => void;
	}>('popover');

	const { isOpen, setOpen } = context;

	let contentEl: HTMLDivElement;

	function handleClickOutside(e: MouseEvent) {
		if (contentEl && !contentEl.contains(e.target as Node)) {
			setOpen(false);
		}
	}

	function handleEscape(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			setOpen(false);
		}
	}

	onMount(() => {
		if ($isOpen) {
			document.addEventListener('click', handleClickOutside);
			document.addEventListener('keydown', handleEscape);
			
			return () => {
				document.removeEventListener('click', handleClickOutside);
				document.removeEventListener('keydown', handleEscape);
			};
		}
	});

	$effect(() => {
		if ($isOpen) {
			tick().then(() => {
				document.addEventListener('click', handleClickOutside);
				document.addEventListener('keydown', handleEscape);
			});
		} else {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleEscape);
		}
	});

	const alignClasses = {
		start: 'left-0',
		center: 'left-1/2 -translate-x-1/2',
		end: 'right-0'
	};

	const sideClasses = {
		top: `bottom-full mb-${sideOffset / 4}`,
		right: `left-full ml-${sideOffset / 4}`,
		bottom: `top-full mt-${sideOffset / 4}`,
		left: `right-full mr-${sideOffset / 4}`
	};
</script>

{#if $isOpen}
	<div
		bind:this={contentEl}
		class={cn(
			'absolute z-50 w-72 rounded-md border border-gray-200 bg-white p-4 text-gray-900 shadow-md outline-none animate-in fade-in zoom-in-95 duration-100',
			sideClasses[side],
			alignClasses[align],
			className
		)}
		role="dialog"
		aria-modal="false"
	>
		{@render children()}
	</div>
{/if}