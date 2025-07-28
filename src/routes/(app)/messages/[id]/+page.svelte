<script lang="ts">
    import { page } from '$app/stores';
    import ConversationList from '$lib/components/messaging/ConversationList.svelte';
    import MessageThread from '$lib/components/messaging/MessageThread.svelte';
    import type { PageData } from './$types';
    
    let { data }: { data: PageData } = $props();
</script>

<svelte:head>
    <title>Messages - Driplo</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">
        <div class="bg-white rounded-lg shadow-sm border">
            <div class="grid grid-cols-1 lg:grid-cols-3 h-[75vh] max-h-[600px]">
                <!-- Conversation list -->
                <div class="hidden lg:block border-r overflow-y-auto p-6">
                    <ConversationList userId={data.session?.user.id || ''} />
                </div>
                
                <!-- Message thread -->
                <div class="lg:col-span-2">
                    <MessageThread 
                        conversationId={$page.params.id} 
                        userId={data.session?.user.id || ''} 
                        supabase={data.supabase}
                    />
                </div>
            </div>
        </div>
        
        <!-- Mobile back button -->
        <div class="lg:hidden mt-4">
            <a href="/messages" class="btn btn-outline btn-sm">
                ← Back to conversations
            </a>
        </div>
    </div>
</div>