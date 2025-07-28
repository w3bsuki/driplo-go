<script lang="ts" generics="T extends import('svelte').Component">
	import { cn } from '$lib/utils';
	import type { ComponentProps } from 'svelte';
	
	interface Props {
		icon: T;
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
		class?: string;
		strokeWidth?: number;
		[key: string]: any;
	}
	
	let {
		icon: IconComponent,
		size = 'md',
		class: className,
		...restProps
	}: Props = $props();
	
	// Icon sizes aligned with design system
	const sizes = {
		xs: 'w-3 h-3',     // 12px
		sm: 'w-4 h-4',     // 16px
		md: 'w-5 h-5',     // 20px
		lg: 'w-6 h-6',     // 24px
		xl: 'w-8 h-8'      // 32px
	};
	
	// Ensure proper stroke width for different sizes
	const strokeWidths = {
		xs: 2,
		sm: 2,
		md: 1.5,
		lg: 1.5,
		xl: 1.5
	};
</script>

<IconComponent 
	class={cn(sizes[size], className)}
	strokeWidth={restProps['strokeWidth'] ?? strokeWidths[size]}
	{...restProps}
/>