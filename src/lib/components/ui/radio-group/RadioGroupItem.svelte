<script lang="ts">
	import { cn } from '$lib/utils'
	import { getContext } from 'svelte'
	
	interface Props {
		value: string
		class?: string
		id?: string
	}
	
	let { value: itemValue, class: className, id, ...restProps }: Props = $props()
	
	// This is a simplified version - in production you'd use a proper context
	let groupValue = $bindable()
</script>

<input
	type="radio"
	{id}
	bind:group={groupValue}
	value={itemValue}
	class={cn(
		"aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-fast",
		className
	)}
	{...restProps}
/>