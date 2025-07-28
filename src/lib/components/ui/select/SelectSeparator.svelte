<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		class?: string;
		[key: string]: any;
	}

	let {
		class: className,
		...restProps
	}: Props = $props();
</script>

<div
	class={cn('-mx-1 my-1 h-px bg-gray-200', className)}
	{...restProps}
></div>