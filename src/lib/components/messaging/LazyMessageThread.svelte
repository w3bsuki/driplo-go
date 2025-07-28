<script lang="ts">
    import { onMount } from 'svelte';
    import type { Database } from '$lib/types/database';
    import type { SupabaseClient } from '@supabase/supabase-js';
    import Spinner from '$lib/components/ui/Spinner.svelte';
    import ErrorBoundary from '$lib/components/shared/ErrorBoundary.svelte';
    import { createLazyComponent } from '$lib/utils/lazy-load';
    
    let { 
        conversationId, 
        userId, 
        supabase, 
        useVirtualScrolling = false,
        ...restProps
    }: { 
        conversationId: string; 
        userId: string; 
        supabase: SupabaseClient<Database>; 
        useVirtualScrolling?: boolean;
        [key: string]: any;
    } = $props();
    
    const lazyThread = createLazyComponent(
        () => import('./MessageThread.svelte')
    );
    
    // Load component when conversationId is provided
    $effect(() => {
        if (conversationId && !lazyThread.component) {
            lazyThread.load();
        }
    });
    
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
        <ErrorBoundary 
            level="detailed" 
            isolate={true}
            onError={(error, context) => {
                console.error('Message thread error:', error, context);
            }}
            resetKeys={[conversationId, userId]}
        >
            {@const ThreadComponent = lazyThread.component}
            <ThreadComponent 
                {conversationId}
                {userId}
                {supabase}
                {useVirtualScrolling}
                {...restProps} 
            />
        </ErrorBoundary>
    {/if}
{/if}