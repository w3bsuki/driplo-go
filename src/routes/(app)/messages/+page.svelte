<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import ConversationList from '$lib/components/messaging/ConversationList.svelte';
    import MessageSearch from '$lib/components/messaging/MessageSearch.svelte';
    import type { PageData } from './$types';
    
    let { data }: { data: PageData } = $props();
    let showSearch = $state(false);
    let showArchived = $state(false);

    function handleSelectConversation(event: CustomEvent<{ conversationId: string }>) {
        goto(`/messages/${event.detail.conversationId}`);
    }
</script>

<svelte:head>
    <title>Messages - Driplo</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">
        <div class="bg-white rounded-lg shadow-sm border">
            <div class="grid grid-cols-1 lg:grid-cols-3 h-[75vh] max-h-[600px]">
                <!-- Conversation list -->
                <div class="border-r overflow-y-auto">
                    <!-- Header with search -->
                    <div class="p-6 border-b">
                        <div class="flex items-center justify-between mb-4">
                            <h1 class="text-xl font-semibold">Messages</h1>
                            <button
                                class="btn btn-sm btn-ghost btn-circle"
                                onclick={() => showSearch = true}
                                title="Search messages"
                            >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                </svg>
                            </button>
                        </div>
                        
                        <!-- Tabs -->
                        <div class="tabs tabs-boxed">
                            <button
                                class="tab {!showArchived ? 'tab-active' : ''}"
                                onclick={() => showArchived = false}
                            >
                                Active
                            </button>
                            <button
                                class="tab {showArchived ? 'tab-active' : ''}"
                                onclick={() => showArchived = true}
                            >
                                Archived
                            </button>
                        </div>
                    </div>
                    
                    <!-- Conversation list -->
                    <div class="p-6">
                        <ConversationList userId={data.session?.user.id || ''} {showArchived} />
                    </div>
                </div>
                
                <!-- Empty state for desktop -->
                <div class="hidden lg:flex lg:col-span-2 items-center justify-center p-8">
                    <div class="text-center">
                        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p class="text-gray-500">Select a conversation to start messaging</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Search Modal -->
<MessageSearch 
    bind:isOpen={showSearch} 
    userId={data.session?.user.id || ''} 
    onclose={() => showSearch = false}
    onselectConversation={handleSelectConversation}
/>