<script lang="ts">
	import { cn } from '$lib/utils'
	
	interface Props extends Record<string, any> {
		class?: string
		value?: string
		size?: 'sm' | 'md' | 'lg'
	}
	
	let { class: className, value = $bindable(), size = 'md', ...restProps }: Props = $props()
</script>

<textarea
	bind:value
	class={cn(
		"flex w-full rounded-sm border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-100 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 input-compact-safe",
		className
	)}
	style={`min-height: calc(var(--input-height-${size}) * 2); height: auto;`}
	{...restProps}
/>