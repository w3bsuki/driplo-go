<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	type $$Props = HTMLAttributes<HTMLDivElement> & {
		variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
	};

	let { 
		variant = 'default',
		class: className = undefined,
		children,
		...restProps
	}: {
		variant?: $$Props['variant'];
		class?: $$Props['class'];
		children?: any;
	} & HTMLAttributes<HTMLDivElement> = $props();

	const variantClasses = {
		default: 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 border-gray-200 dark:border-gray-700',
		destructive: 'bg-error-50 dark:bg-error-500/10 text-error-600 dark:text-error-400 border-error-200 dark:border-error-500/30 [&>svg]:text-error-500',
		success: 'bg-success-50 dark:bg-success-500/10 text-success-600 dark:text-success-400 border-success-200 dark:border-success-500/30 [&>svg]:text-success-500',
		warning: 'bg-warning-50 dark:bg-warning-500/10 text-warning-600 dark:text-warning-400 border-warning-200 dark:border-warning-500/30 [&>svg]:text-warning-500',
		info: 'bg-info-50 dark:bg-info-500/10 text-info-600 dark:text-info-400 border-info-200 dark:border-info-500/30 [&>svg]:text-info-500'
	};
</script>

<div
	class={cn(
		'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4',
		variantClasses[variant],
		className
	)}
	role="alert"
	{...restProps}
>
	{@render children?.()}
</div>