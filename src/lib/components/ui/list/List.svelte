<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
		type?: 'none' | 'disc' | 'decimal';
		spacing?: 'tight' | 'normal' | 'loose';
	}

	let { 
		class: className, 
		children,
		type = 'none',
		spacing = 'normal'
	}: Props = $props();

	const spacingClasses = {
		tight: 'space-y-1',
		normal: 'space-y-2',
		loose: 'space-y-4'
	};

	const typeClasses = {
		none: '',
		disc: 'list-disc pl-5',
		decimal: 'list-decimal pl-5'
	};

	const element = type === 'decimal' ? 'ol' : 'ul';
</script>

{#if element === 'ol'}
	<ol
		class={cn(
			'text-sm',
			spacingClasses[spacing],
			typeClasses[type],
			className
		)}
	>
		{@render children()}
	</ol>
{:else}
	<ul
		class={cn(
			'text-sm',
			spacingClasses[spacing],
			typeClasses[type],
			className
		)}
	>
		{@render children()}
	</ul>
{/if}