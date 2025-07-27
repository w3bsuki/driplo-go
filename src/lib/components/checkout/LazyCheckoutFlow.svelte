<script lang="ts">
	import { onMount } from 'svelte';
	import type { Listing } from '$lib/types';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import ErrorBoundary from '$lib/components/shared/ErrorBoundary.svelte';
	
	import type { CheckoutFlowProps } from '$lib/types/components';
	
	type Props = Pick<CheckoutFlowProps, 'listing' | 'isOpen'> & {
		// Additional lazy-specific props
		preloadOnHover?: boolean;
	};
	
	let {
		listing,
		isOpen,
		preloadOnHover = true
	}: Props = $props();
	
	let CheckoutFlow: any = null;
	let loading = false;
	let error: Error | null = null;
	
	async function loadCheckoutFlow() {
		if (CheckoutFlow || loading) return;
		
		loading = true;
		try {
			const module = await import('./CheckoutFlow.svelte');
			CheckoutFlow = module.default;
		} catch (e) {
			error = e as Error;
			console.error('Failed to load checkout flow:', e);
		} finally {
			loading = false;
		}
	}
	
	// Load when modal opens
	$: if (isOpen && !CheckoutFlow) {
		loadCheckoutFlow();
	}
	
	// Preload on hover/focus of buy button
	export function preload() {
		if (!CheckoutFlow && !loading) {
			loadCheckoutFlow();
		}
	}
</script>

{#if isOpen}
	{#if loading}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
			<div class="bg-background p-8 rounded-lg shadow-lg">
				<Spinner size="lg" />
				<p class="mt-4 text-sm text-muted-foreground">Loading checkout...</p>
			</div>
		</div>
	{:else if error}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
			<div class="bg-background p-8 rounded-lg shadow-lg max-w-md">
				<h3 class="text-lg font-semibold text-destructive">Error Loading Checkout</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					We're having trouble loading the checkout. Please try again.
				</p>
				<button 
					class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
					onclick={() => {
						error = null;
						loadCheckoutFlow();
					}}
				>
					Retry
				</button>
			</div>
		</div>
	{:else if CheckoutFlow}
		<ErrorBoundary 
			level="detailed" 
			isolate={true}
			onError={(error, context) => {
				console.error('Checkout flow error:', error, context);
				// In a real app, send to error tracking service
			}}
			resetKeys={[listing.id, isOpen]}
		>
			<svelte:component this={CheckoutFlow} {listing} {isOpen} {...$$restProps} />
		</ErrorBoundary>
	{/if}
{/if}