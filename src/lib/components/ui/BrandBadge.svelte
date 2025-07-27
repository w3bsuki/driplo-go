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
			container: 'px-1.5 py-0.5 gap-1',
			icon: 'w-3 h-3',
			text: 'text-xs'
		},
		sm: {
			container: 'px-2 py-1 gap-1.5',
			icon: 'w-3.5 h-3.5',
			text: 'text-xs'
		},
		md: {
			container: 'px-2.5 py-1.5 gap-1.5',
			icon: 'w-4 h-4',
			text: 'text-sm'
		},
		lg: {
			container: 'px-3 py-2 gap-2',
			icon: 'w-5 h-5',
			text: 'text-sm'
		}
	};
	
	const classes = sizeClasses[size];
</script>

<div class={cn(
	"inline-flex items-center rounded-sm font-medium",
	classes.container,
	isVerified 
		? "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200" 
		: "bg-gray-100 text-gray-700 border border-gray-200",
	className
)}>
	<Store class={cn(classes.icon, isVerified ? "text-blue-600" : "text-gray-600")} />
	{#if showText}
		<span class={cn(classes.text, "font-medium")}>{brand || 'Brand'}</span>
	{/if}
	{#if isVerified}
		<CheckCircle2 class={cn(classes.icon, "text-blue-600")} />
	{/if}
</div>