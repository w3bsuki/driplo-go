<script lang="ts">
    import { formatDistanceToNow } from 'date-fns';
    import { createEventDispatcher } from 'svelte';
    import type { Database } from '$lib/types/database.types';
    
    type Message = Database['public']['Tables']['messages']['Row'] & {
        sender: {
            id: string;
            username: string;
            avatar_url: string | null;
        };
        conversation: {
            id: string;
            listing: {
                title: string;
                images: string[] | null;
            };
        };
    };

    type SearchResult = {
        conversation: {
            id: string;
            listing: {
                title: string;
                images: string[] | null;
            };
        };
        messages: Message[];
    };

    export let isOpen = false;
    export let userId: string;

    const dispatch = createEventDispatcher<{
        close: void;
        selectConversation: { conversationId: string };
    }>();

    let searchQuery = '';
    let searchResults: SearchResult[] = [];
    let searching = false;
    let searchTimeout: NodeJS.Timeout;

    $: if (searchQuery.trim().length >= 2) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch();
        }, 300);
    } else {
        searchResults = [];
    }

    async function performSearch() {
        if (searchQuery.trim().length < 2) return;

        searching = true;
        try {
            const response = await fetch(`/api/messages/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (response.ok) {
                searchResults = data.results;
            } else {
                console.error('Search failed:', data.error);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            searching = false;
        }
    }

    function highlightText(text: string, query: string): string {
        if (!query) return text;
        
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
    }

    function selectConversation(conversationId: string) {
        dispatch('selectConversation', { conversationId });
        dispatch('close');
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            dispatch('close');
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
    <!-- Modal overlay -->
    <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <!-- Header -->
            <div class="p-4 border-b">
                <div class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold">Search Messages</h2>
                    <button
                        class="btn btn-sm btn-ghost btn-circle"
                        onclick={() => dispatch('close')}
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <!-- Search input -->
                <div class="mt-4 relative">
                    <input
                        type="text"
                        bind:value={searchQuery}
                        placeholder="Search messages..."
                        class="input input-bordered w-full pr-10"
                        autofocus
                    />
                    <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {#if searching}
                            <span class="loading loading-spinner loading-sm"></span>
                        {:else}
                            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Search results -->
            <div class="flex-1 overflow-y-auto p-4">
                {#if searchQuery.trim().length < 2}
                    <div class="text-center text-gray-500 py-8">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        <p>Type at least 2 characters to search</p>
                    </div>
                {:else if searching}
                    <div class="text-center py-8">
                        <span class="loading loading-spinner loading-lg"></span>
                        <p class="mt-2 text-gray-500">Searching...</p>
                    </div>
                {:else if searchResults.length === 0}
                    <div class="text-center text-gray-500 py-8">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <p>No messages found for "{searchQuery}"</p>
                    </div>
                {:else}
                    <div class="space-y-4">
                        {#each searchResults as result}
                            <div class="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                 onclick={() => selectConversation(result.conversation.id)}>
                                
                                <!-- Conversation header -->
                                <div class="flex items-center gap-3 mb-3">
                                    <div class="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                        {#if result.conversation.listing.images && result.conversation.listing.images.length > 0}
                                            <img 
                                                src={result.conversation.listing.images[0]} 
                                                alt={result.conversation.listing.title}
                                                class="w-full h-full object-cover rounded-lg"
                                            />
                                        {:else}
                                            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                                            </svg>
                                        {/if}
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="font-medium text-gray-900">{result.conversation.listing.title}</h3>
                                        <p class="text-sm text-gray-500">{result.messages.length} matching message{result.messages.length > 1 ? 's' : ''}</p>
                                    </div>
                                </div>

                                <!-- Matching messages -->
                                <div class="space-y-2">
                                    {#each result.messages.slice(0, 3) as message}
                                        <div class="flex items-start gap-2 p-2 bg-gray-50 rounded">
                                            <div class="flex-shrink-0">
                                                {#if message.sender.avatar_url}
                                                    <img 
                                                        src={message.sender.avatar_url} 
                                                        alt={message.sender.username}
                                                        class="w-6 h-6 rounded-full"
                                                    />
                                                {:else}
                                                    <div class="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                                                        {message.sender.username[0].toUpperCase()}
                                                    </div>
                                                {/if}
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <div class="flex items-center gap-2">
                                                    <span class="text-sm font-medium text-gray-900">{message.sender.username}</span>
                                                    <span class="text-xs text-gray-500">
                                                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p class="text-sm text-gray-600 truncate">
                                                    {@html highlightText(message.message_text, searchQuery)}
                                                </p>
                                            </div>
                                        </div>
                                    {/each}
                                    
                                    {#if result.messages.length > 3}
                                        <p class="text-sm text-gray-500 text-center">
                                            +{result.messages.length - 3} more message{result.messages.length - 3 > 1 ? 's' : ''}
                                        </p>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    :global(mark) {
        padding: 0.125rem 0.25rem;
        border-radius: 0.25rem;
    }
</style>