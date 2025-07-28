<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	type $$Props = HTMLAttributes<HTMLHeadingElement>;

	let { 
		class: className = undefined,
		children,
		...restProps
	} = $props<$$Props & { children?: any }>();
</script>

<h5
	class={cn('mb-1 font-medium leading-none tracking-tight', className)}
	{...restProps}
>
	{@render children?.()}
</h5>