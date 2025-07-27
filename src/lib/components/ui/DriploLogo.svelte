<script lang="ts">
	import { cn } from '$lib/utils';
	
	interface Props {
		size?: 'sm' | 'md' | 'lg';
		showEmoji?: boolean;
		className?: string;
	}
	
	let { 
		size = 'md', 
		showEmoji = true,
		className = ''
	}: Props = $props();
	
	const sizeClasses = {
		sm: 'text-xl md:text-2xl',
		md: 'text-2xl md:text-3xl',
		lg: 'text-3xl md:text-4xl'
	};
	
	// Emoji needs to be ~1.3x larger to match capital letter height
	const emojiSizes = {
		sm: 'text-2xl md:text-3xl',
		md: 'text-3xl md:text-4xl',
		lg: 'text-4xl md:text-5xl'
	};
</script>

<div class={cn("flex items-center gap-0.5", className)}>
	<span 
		class={cn(
			"font-black tracking-tight text-gray-900 leading-none",
			sizeClasses[size]
		)}
	>
		Driplo
	</span>
	{#if showEmoji}
		<span 
			class={cn(
				"inline-flex items-center justify-center",
				emojiSizes[size],
				"leading-none"
			)}
			role="img"
			aria-label="Clothing"
			style="transform: translateY(-0.1em)"
		>
			👕
		</span>
	{/if}
</div>