<script lang="ts">
	import { onMount } from 'svelte';
	import type { ComponentType, SvelteComponent } from 'svelte';
	import Spinner from './Spinner.svelte';
	
	let { 
		loader,
		show = false,
		preloadOnMount = false,
		loadingText = 'Loading...',
		...restProps
	}: {
		loader: () => Promise<{ default: ComponentType<SvelteComponent> }>;
		show?: boolean;
		preloadOnMount?: boolean;
		loadingText?: string;
		[key: string]: any;
	} = $props();
	
	let Component: ComponentType<SvelteComponent> | null = null;
	let loading = $state(false);
	let error = $state<Error | null>(null);
	
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
	$effect(() => {
		if (show && !Component) {
			loadComponent();
		}
	});
	
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
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div class="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-modal">
				<Spinner size="lg" />
				<p class="mt-4 text-sm text-gray-500 dark:text-gray-400">{loadingText}</p>
			</div>
		</div>
	{:else if error}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div class="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-modal max-w-md border border-gray-200 dark:border-gray-700">
				<h3 class="text-lg font-semibold text-error-500">Loading Error</h3>
				<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
					We encountered an error loading this content. Please try again.
				</p>
				<button 
					class="mt-4 px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 transition-colors"
					onclick={() => {
						error = null;
						loadComponent();
					}}
				>
					Retry
				</button>
			</div>
		</div>
	{:else if Component}
		<Component {...restProps} />
	{/if}
{/if}