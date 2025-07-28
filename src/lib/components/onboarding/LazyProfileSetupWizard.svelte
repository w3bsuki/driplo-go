<script lang="ts">
    import { onMount } from 'svelte';
    import Spinner from '$lib/components/ui/Spinner.svelte';
    import { createLazyComponent } from '$lib/utils/lazy-load';
    
    let { open = false, currentStep = 1, ...restProps }: { open?: boolean; currentStep?: number; [key: string]: any } = $props();
    
    const lazyWizard = createLazyComponent(
        () => import('./ProfileSetupWizard.svelte')
    );
    
    // Load when dialog opens
    $effect(() => {
        if (open && !lazyWizard.component) {
            lazyWizard.load();
        }
    });
    
    // Preload for new users
    onMount(() => {
        // Check if user might need onboarding (e.g., from URL params or user state)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('onboarding') || window.location.pathname.includes('welcome')) {
            lazyWizard.preload();
        }
    });
</script>

{#if open}
    {#if lazyWizard.loading}
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div class="bg-background p-8 rounded-sm shadow-lg">
                <Spinner size="lg" />
                <p class="mt-4 text-sm text-muted-foreground">Loading setup wizard...</p>
            </div>
        </div>
    {:else if lazyWizard.component}
        {@const WizardComponent = lazyWizard.component}
        <WizardComponent {open} {currentStep} {...restProps} />
    {/if}
{/if}