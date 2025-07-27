<script lang="ts">
	import { onMount } from 'svelte';
	import type { ComponentType, SvelteComponent } from 'svelte';
	import Spinner from './Spinner.svelte';
	
	export let loader: () => Promise<{ default: ComponentType<SvelteComponent> }>;
	export let show = false;
	export let preloadOnMount = false;
	export let loadingText = 'Loading...';
	
	let Component: ComponentType<SvelteComponent> | null = null;
	let loading = false;
	let error: Error | null = null;
	
	async function loadComponent() {
		if (Component || loading) return;
		
		loading = true;
		error = null;
		
		try {
			const module = await loader();
			Component = module.default;
		} catch (e) {
			error = e as Error;
			console.error('Failed to load modal component:', e);
		} finally {
			loading = false;
		}
	}
	
	// Load when modal opens
	$: if (show && !Component) {
		loadComponent();
	}
	
	// Preload on mount if requested
	onMount(() => {
		if (preloadOnMount) {
			loadComponent();
		}
	});
	
	export function preload() {
		if (!Component && !loading) {
			loadComponent();
		}
	}
</script>

{#if show}
	{#if loading}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
			<div class="bg-card p-8 rounded-lg shadow-lg">
				<Spinner size="lg" />
				<p class="mt-4 text-sm text-muted-foreground">{loadingText}</p>
			</div>
		</div>
	{:else if error}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
			<div class="bg-card p-8 rounded-lg shadow-lg max-w-md">
				<h3 class="text-lg font-semibold text-destructive">Loading Error</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					We encountered an error loading this content. Please try again.
				</p>
				<button 
					class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
					on:click={() => {
						error = null;
						loadComponent();
					}}
				>
					Retry
				</button>
			</div>
		</div>
	{:else if Component}
		<svelte:component this={Component} {...$$restProps} />
	{/if}
{/if}