<script lang="ts">
	import { Heart } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import * as m from '$lib/paraglide/messages.js';
	
	interface Props {
		liked: boolean;
		likeLoading: boolean;
		onToggleLike: (e: MouseEvent) => void;
	}
	
	let { 
		liked,
		likeLoading,
		onToggleLike
	}: Props = $props();
</script>

<div class="flex items-center justify-between">
	<button
		onclick={onToggleLike}
		class={cn(
			"absolute top-[var(--spacing-2)] right-[var(--spacing-2)] h-[var(--button-height-sm)] w-[var(--button-height-sm)] rounded-[var(--border-radius-sm)] bg-[var(--color-surface-primary)]/95 backdrop-blur-sm border border-[var(--color-border-primary)] hover:border-[var(--color-border-hover)] transition-all duration-[var(--transition-duration-100)] flex items-center justify-center hover:scale-105 active:scale-95 shadow-[var(--box-shadow-sm)] btn-compact-safe",
			"focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-1",
			likeLoading && "opacity-50 cursor-not-allowed"
		)}
		aria-label={liked ? m.listing_unlike() : m.listing_like()}
		aria-pressed={liked}
		disabled={likeLoading}
		type="button"
	>
		<Heart 
			class={cn("h-4 w-4", liked ? "fill-[var(--color-error-500)] text-[var(--color-error-500)]" : "text-[var(--color-text-secondary)]")} 
			aria-hidden="true"
		/>
	</button>
</div>