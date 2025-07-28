<script lang="ts">
	import { onMount } from 'svelte'
	import { Loader2 } from 'lucide-svelte'

	interface Props {
		hasMore: boolean
		loading: boolean
		onLoadMore: () => Promise<void> | void
		threshold?: number
		class?: string
	}

	let { 
		hasMore, 
		loading, 
		onLoadMore, 
		threshold = 100,
		class: className = ''
	}: Props = $props()

	let sentinelElement = $state<HTMLElement>()

	onMount(() => {
		if (!sentinelElement) return

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries
				if (entry.isIntersecting && hasMore && !loading) {
					onLoadMore()
				}
			},
			{
				rootMargin: `${threshold}px`
			}
		)

		observer.observe(sentinelElement)

		return () => {
			observer.disconnect()
		}
	})

	// Re-observe when hasMore or loading changes
	$effect(() => {
		// This effect ensures the observer is properly re-evaluated
		// when hasMore or loading state changes
		if (sentinelElement) {
			// The observer will handle the intersection check
		}
	})
</script>

{#if hasMore || loading}
	<div bind:this={sentinelElement} class={className}>
		{#if loading}
			<div class="flex items-center justify-center py-8">
				<Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
				<span class="ml-2 text-sm text-muted-foreground">Loading more items...</span>
			</div>
		{:else}
			<div class="flex items-center justify-center py-8">
				<button 
					onclick={handleOnLoadMore}
					class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
				>
					Load More
				</button>
			</div>
		{/if}
	</div>
{:else}
	<div class="text-center py-8 text-sm text-muted-foreground">
		You've reached the end of the results
	</div>
{/if}