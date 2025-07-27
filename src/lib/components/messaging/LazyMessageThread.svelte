<script lang="ts">
    import { onMount } from 'svelte';
    import type { Database } from '$lib/types/database';
    import type { SupabaseClient } from '@supabase/supabase-js';
    import Spinner from '$lib/components/ui/Spinner.svelte';
    import { createLazyComponent } from '$lib/utils/lazy-load';
    
    export let conversationId: string;
    export let userId: string;
    export let supabase: SupabaseClient<Database>;
    export let useVirtualScrolling = false;
    
    const lazyThread = createLazyComponent(
        () => import('./MessageThread.svelte')
    );
    
    // Load component when conversationId is provided
    $: if (conversationId && !lazyThread.component) {
        lazyThread.load();
    }
    
    // Preload if on messages page
    onMount(() => {
        if (window.location.pathname.includes('messages')) {
            setTimeout(() => lazyThread.preload(), 1000);
        }
    });
</script>

{#if conversationId}
    {#if lazyThread.loading}
        <div class="flex items-center justify-center h-64">
            <div class="text-center">
                <Spinner size="lg" />
                <p class="mt-4 text-sm text-muted-foreground">Loading conversation...</p>
            </div>
        </div>
    {:else if lazyThread.component}
        <svelte:component 
            this={lazyThread.component} 
            {conversationId}
            {userId}
            {supabase}
            {useVirtualScrolling}
            {...$$restProps} 
        />
    {/if}
{/if}