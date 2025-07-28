<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	import type { BadgeProps } from '$lib/types/ui';
	
	// Extended badge props with condition variants
	interface ExtendedBadgeProps extends Omit<BadgeProps, 'variant'> {
		variant?: BadgeProps['variant'] | 
			'condition-new-with-tags' | 'condition-new-without-tags' | 'condition-very-good' | 
			'condition-good' | 'condition-fair';
	}
	
	type Props = ExtendedBadgeProps;

	let { variant = 'default', size = 'md', class: className, children }: Props = $props();

	const variants = {
		default: 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border-primary)]',
		secondary: 'bg-[var(--color-brand-50)] text-[var(--color-brand-600)] border-[var(--color-brand-200)]',
		success: 'bg-[var(--color-success-50)] text-[var(--color-success-600)] border-[var(--color-success-500)]/20',
		destructive: 'bg-[var(--color-error-50)] text-[var(--color-error-600)] border-[var(--color-error-500)]/20',
		outline: 'border-[var(--color-border-primary)] text-[var(--color-text-secondary)] bg-transparent',
		// Condition variants using token system
		'condition-new-with-tags': 'bg-[var(--color-success-500)] text-[var(--color-white)] border-[var(--color-success-500)]',
		'condition-new-without-tags': 'bg-[var(--color-success-500)] text-[var(--color-white)] border-[var(--color-success-500)]',
		'condition-very-good': 'bg-[var(--color-warning-500)] text-[var(--color-gray-950)] border-[var(--color-warning-500)]',
		'condition-good': 'bg-[var(--color-warning-600)] text-[var(--color-white)] border-[var(--color-warning-600)]',
		'condition-fair': 'bg-[var(--color-error-500)] text-[var(--color-white)] border-[var(--color-error-500)]'
	};

	const sizes = {
		sm: 'badge-size-sm',
		md: 'badge-size-md',
		lg: 'badge-size-lg'
	};
</script>

<span
	class={cn(
		'inline-flex items-center justify-center rounded-[var(--radius-sm)] border',
		variants[variant],
		sizes[size],
		className
	)}
>
	{@render children()}
</span>