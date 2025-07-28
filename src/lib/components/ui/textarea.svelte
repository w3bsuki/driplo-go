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
		"flex w-full rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white transition-all duration-100 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 input-compact-safe h-auto",
		size === 'sm' && 'min-h-[calc(var(--input-height-sm)*2)]',
		size === 'md' && 'min-h-[calc(var(--input-height-md)*2)]',
		size === 'lg' && 'min-h-[calc(var(--input-height-lg)*2)]',
		className
	)}
	{...restProps}
/>