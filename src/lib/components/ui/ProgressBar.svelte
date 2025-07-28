<script lang="ts">
	import { Progress } from 'bits-ui';
	import { cn } from '$lib/utils';
	
	interface Props {
		value: number;
		max?: number;
		class?: string;
		showLabel?: boolean;
		label?: string;
		size?: 'xs' | 'sm' | 'md' | 'lg';
		variant?: 'default' | 'success' | 'warning' | 'error';
	}
	
	let {
		value = 0,
		max = 100,
		class: className = '',
		showLabel = false,
		label = '',
		size = 'md',
		variant = 'default'
	}: Props = $props();
	
	let percentage = $derived(Math.min(Math.max((value / max) * 100, 0), 100));
	let displayLabel = $derived(label || `${Math.round(percentage)}%`);
	
	const sizeClasses = {
		xs: 'h-1',
		sm: 'h-2',
		md: 'h-3',
		lg: 'h-4'
	};
	
	const variantClasses = {
		default: 'bg-brand-500',
		success: 'bg-success-500',
		warning: 'bg-warning-500',
		error: 'bg-error-500'
	};
	
	const bgClasses = {
		default: 'bg-gray-200',
		success: 'bg-success-100',
		warning: 'bg-warning-100',
		error: 'bg-error-100'
	};
</script>

<div class={cn("w-full", className)}>
	{#if showLabel}
		<div class="flex justify-between items-center mb-1">
			<span class="text-sm font-medium text-gray-700">{displayLabel}</span>
		</div>
	{/if}
	
	<Progress.Root 
		{value} 
		{max} 
		class={cn(
			"relative overflow-hidden rounded-full transition-all duration-300",
			sizeClasses[size],
			bgClasses[variant]
		)}
		aria-label={label || "Progress"}
	>
		<div
			class={cn(
				"h-full transition-all duration-500 ease-out rounded-full",
				variantClasses[variant]
			)}
			style="width: {percentage}%"
		></div>
	</Progress.Root>
</div>