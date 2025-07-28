<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	type $$Props = HTMLAttributes<HTMLParagraphElement>;

	let { 
		class: className = undefined,
		children,
		...restProps
	} = $props<$$Props & { children?: any }>();
</script>

<div
	class={cn('text-sm [&_p]:leading-relaxed', className)}
	{...restProps}
>
	{@render children?.()}
</div>