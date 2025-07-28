<script lang="ts">
	import { cn } from '$lib/utils';
	
	interface Props {
		children?: any;
		class?: string;
	}
	
	let { children, class: className }: Props = $props();
</script>

<div class={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>
	{@render children?.()}
</div>