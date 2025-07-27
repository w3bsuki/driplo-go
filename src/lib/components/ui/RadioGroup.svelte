<script lang="ts">
	import { cn } from '$lib/utils'
	
	interface Props {
		value?: string
		class?: string
		children?: any
	}
	
	let { value = $bindable(), class: className, children }: Props = $props()
</script>

<div class={cn("grid gap-2", className)}>
	{@render children?.()}
</div>

<script context="module" lang="ts">
	export const RadioGroupItem = RadioGroupItemComponent
</script>

<script lang="ts">
	import { cn } from '$lib/utils'
	
	interface ItemProps {
		value: string
		class?: string
	}
	
	function RadioGroupItemComponent({ value: itemValue, class: className }: ItemProps) {
		return `<input type="radio" bind:group={selectedValue} value="${itemValue}" class="${cn('h-4 w-4', className)}" />`
	}
</script>