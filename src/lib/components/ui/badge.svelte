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
		default: 'bg-gray-50 text-gray-600 border-gray-200',
		secondary: 'bg-blue-50 text-blue-600 border-blue-200',
		success: 'bg-emerald-50 text-emerald-600 border-emerald-200',
		destructive: 'bg-red-50 text-red-600 border-red-200',
		outline: 'border-gray-200 text-gray-600 bg-transparent',
		// Condition variants using CSS variables
		'condition-new-with-tags': 'bg-[hsl(var(--color-condition-new-with-tags))] text-white border-[hsl(var(--color-condition-new-with-tags))]',
		'condition-new-without-tags': 'bg-[hsl(var(--color-condition-new-without-tags))] text-white border-[hsl(var(--color-condition-new-without-tags))]',
		'condition-very-good': 'bg-[hsl(var(--color-condition-very-good))] text-gray-950 border-[hsl(var(--color-condition-very-good))]',
		'condition-good': 'bg-[hsl(var(--color-condition-good))] text-white border-[hsl(var(--color-condition-good))]',
		'condition-fair': 'bg-[hsl(var(--color-condition-fair))] text-white border-[hsl(var(--color-condition-fair))]'
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