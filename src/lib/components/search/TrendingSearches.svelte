<script lang="ts">
	import { cn } from '$lib/utils';
	import * as m from '$lib/paraglide/messages.js';

	interface Props {
		searches: string[];
		onSearchClick: (term: string) => void;
		class?: string;
		maxVisible?: number;
	}

	let {
		searches,
		onSearchClick,
		class: className = '',
		maxVisible = 3
	}: Props = $props();

	const visibleSearches = $derived(searches.slice(0, maxVisible));

	function handleKeyDown(event: KeyboardEvent, term: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onSearchClick(term);
		}
	}
</script>

<div class={cn("flex items-center justify-center gap-2 flex-wrap text-xs md:text-sm", className)}>
	<span class="text-gray-500" aria-label={m.search_trending_searches()}>
		{m.search_trending()}:
	</span>
	{#each visibleSearches as term}
		<button
			onclick={() => onSearchClick(term)}
			onkeydown={(e) => handleKeyDown(e, term)}
			aria-label="{m.search_trending_searches()}: {term}"
			class={cn(
				"text-gray-600 hover:text-blue-400 active:text-blue-400",
				"focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1",
				"rounded px-1 transition-colors duration-200",
				"underline-offset-2 hover:underline"
			)}
		>
			{term}
		</button>
	{/each}
</div>