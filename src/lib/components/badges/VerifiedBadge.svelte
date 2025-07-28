<script lang="ts">
	import { Check } from 'lucide-svelte';

	interface Props {
		verified: boolean;
		size?: 'sm' | 'md' | 'lg';
		showText?: boolean;
	}

	let { verified, size = 'md', showText = true }: Props = $props();

	const sizeClasses = {
		sm: 'text-xs px-1.5 py-0.5',
		md: 'text-sm px-2 py-1',
		lg: 'text-base px-3 py-1.5'
	};

	const iconSizes = {
		sm: 'w-3 h-3',
		md: 'w-4 h-4',
		lg: 'w-5 h-5'
	};
</script>

{#if verified}
	<div class="inline-flex items-center gap-1 bg-green-100 text-green-700 rounded-full font-medium {sizeClasses[size]}">
		<Check class={iconSizes[size]} />
		{#if showText}
			<span>Verified</span>
		{/if}
	</div>
{/if}