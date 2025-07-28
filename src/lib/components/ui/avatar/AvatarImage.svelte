<script lang="ts">
	import type { HTMLImgAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface AvatarImageProps extends HTMLImgAttributes {
		class?: string;
	}

	let {
		class: className = '',
		src,
		alt = '',
		...restProps
	}: AvatarImageProps = $props();
</script>

{#if src}
	<img
		{src}
		{alt}
		class={cn('aspect-square h-full w-full object-cover', className)}
		{...restProps}
	/>
{/if}