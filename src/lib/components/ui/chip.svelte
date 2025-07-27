<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	
	interface Props {
		variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
		size?: 'sm' | 'md' | 'lg';
		dismissible?: boolean;
		interactive?: boolean;
		selected?: boolean;
		class?: string;
		children: Snippet;
		onclick?: (e: MouseEvent) => void;
		ondismiss?: () => void;
	}
	
	let { 
		variant = 'default',
		size = 'md',
		dismissible = false,
		interactive = false,
		selected = false,
		class: className,
		children,
		onclick,
		ondismiss
	}: Props = $props();
	
	const variants = {
		default: 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200',
		primary: 'bg-brand-100 text-brand-700 border-brand-200 hover:bg-brand-200',
		secondary: 'bg-secondary-100 text-secondary-700 border-secondary-200 hover:bg-secondary-200',
		success: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200',
		warning: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200',
		destructive: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
	};
	
	const sizes = {
		sm: 'chip-size-sm',
		md: 'chip-size-md',
		lg: 'chip-size-lg'
	};
	
	const selectedStyles = selected ? 'ring-2 ring-brand-500 ring-offset-1' : '';
	const interactiveStyles = interactive ? 'cursor-pointer active:scale-95' : '';
	
	function handleDismiss(e: MouseEvent) {
		e.stopPropagation();
		ondismiss?.();
	}
</script>

{#if interactive}
	<button
		{onclick}
		class={cn(
			'inline-flex items-center rounded-sm border font-medium transition-all duration-100',
			variants[variant],
			sizes[size],
			selectedStyles,
			interactiveStyles,
			className
		)}
	>
		{@render children()}
		{#if dismissible}
			<button
				onclick={handleDismiss}
				class="ml-1.5 -mr-1 p-0.5 rounded-sm hover:bg-black/10 transition-colors duration-100"
				aria-label="Remove"
			>
				<svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
					<path d="M9 3L3 9M3 3l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
				</svg>
			</button>
		{/if}
	</button>
{:else}
	<span
		class={cn(
			'inline-flex items-center rounded-sm border font-medium transition-colors duration-100',
			variants[variant],
			sizes[size],
			className
		)}
	>
		{@render children()}
		{#if dismissible}
			<button
				onclick={handleDismiss}
				class="ml-1.5 -mr-1 p-0.5 rounded-sm hover:bg-black/10 transition-colors duration-100 touch-safe min-w-[20px] min-h-[20px]"
				aria-label="Remove"
			>
				<svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
					<path d="M9 3L3 9M3 3l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
				</svg>
			</button>
		{/if}
	</span>
{/if}