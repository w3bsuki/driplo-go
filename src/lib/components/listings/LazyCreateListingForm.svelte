<script lang="ts">
    import { onMount } from 'svelte';
    import Spinner from '$lib/components/ui/Spinner.svelte';
    import ErrorBoundary from '$lib/components/shared/ErrorBoundary.svelte';
    import { createLazyComponent } from '$lib/utils/lazy-load';
    
    let { open = false, ...restProps }: { open?: boolean; [key: string]: any } = $props();
    
    const lazyForm = createLazyComponent(
        () => import('./CreateListingForm/CreateListingForm.svelte'),
        { preloadOnHover: true }
    );
    
    // Load when dialog opens
    $effect(() => {
        if (open && !lazyForm.component) {
            lazyForm.load();
        }
    });
    
    // Preload on mount if likely to be used
    onMount(() => {
        // Preload after 2 seconds if user is on a listing-related page
        if (window.location.pathname.includes('sell') || 
            window.location.pathname.includes('listing')) {
            setTimeout(() => lazyForm.preload(), 2000);
        }
    });
</script>

{#if open}
    {#if lazyForm.loading}
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div class="bg-background p-8 rounded-sm shadow-lg">
                <Spinner size="lg" />
                <p class="mt-4 text-sm text-muted-foreground">Loading listing form...</p>
            </div>
        </div>
    {:else if lazyForm.component}
        <ErrorBoundary 
            level="detailed" 
            isolate={true}
            onError={(error, context) => {
                console.error('Create listing form error:', error, context);
            }}
            resetKeys={[open]}
        >
            {@const FormComponent = lazyForm.component}
            <FormComponent {open} {...restProps} />
        </ErrorBoundary>
    {/if}
{/if}