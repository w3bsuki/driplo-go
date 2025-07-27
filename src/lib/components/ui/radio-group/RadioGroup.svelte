<script lang="ts">
	import { cn } from '$lib/utils'
	
	interface Props {
		value?: string
		class?: string
		children?: any
	}
	
	let { value = $bindable(), class: className, children }: Props = $props()
	
	export function getGroupValue() {
		return value
	}
</script>

<div class={cn("grid gap-2", className)} role="radiogroup">
	{@render children?.()}
</div>