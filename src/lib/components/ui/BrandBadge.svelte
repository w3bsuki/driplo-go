<script lang="ts">
	import { Store, CheckCircle2 } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	
	interface Props {
		brand?: string;
		isVerified?: boolean;
		size?: 'xs' | 'sm' | 'md' | 'lg';
		showText?: boolean;
		className?: string;
	}
	
	let { 
		brand,
		isVerified = false, 
		size = 'sm', 
		showText = true,
		className = ''
	}: Props = $props();
	
	const sizeClasses = {
		xs: {
			container: 'px-[var(--spacing-1-5)] py-[var(--spacing-0-5)] gap-[var(--spacing-1)]',
			icon: 'w-3 h-3',
			text: 'text-[var(--font-size-xs)]'
		},
		sm: {
			container: 'px-[var(--spacing-2)] py-[var(--spacing-1)] gap-[var(--spacing-1-5)]',
			icon: 'w-3.5 h-3.5',
			text: 'text-[var(--font-size-xs)]'
		},
		md: {
			container: 'px-[var(--spacing-2-5)] py-[var(--spacing-1-5)] gap-[var(--spacing-1-5)]',
			icon: 'w-4 h-4',
			text: 'text-[var(--font-size-sm)]'
		},
		lg: {
			container: 'px-[var(--spacing-3)] py-[var(--spacing-2)] gap-[var(--spacing-2)]',
			icon: 'w-5 h-5',
			text: 'text-[var(--font-size-sm)]'
		}
	};
	
	const classes = sizeClasses[size];
</script>

<div class={cn(
	"inline-flex items-center rounded-[var(--border-radius-sm)] font-medium",
	classes.container,
	isVerified 
		? "bg-gradient-to-r from-[var(--color-brand-50)] to-[var(--color-info-50)] text-[var(--color-brand-700)] border border-[var(--color-brand-200)]" 
		: "bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-primary)]",
	className
)}>
	<Store class={cn(classes.icon, isVerified ? "text-[var(--color-brand-600)]" : "text-[var(--color-text-secondary)]")} />
	{#if showText}
		<span class={cn(classes.text, "font-medium")}>{brand || 'Brand'}</span>
	{/if}
	{#if isVerified}
		<CheckCircle2 class={cn(classes.icon, "text-[var(--color-brand-600)]")} />
	{/if}
</div>