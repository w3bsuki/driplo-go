<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { formatDistanceToNow } from 'date-fns';
    import type { Database } from '$lib/types/database.types';
    import Spinner from '$lib/components/ui/Spinner.svelte';
    
    type Conversation = Database['public']['Tables']['conversations']['Row'] & {
        listing: {
            id: string;
            title: string;
            images: string[];
            price: number;
        };
        buyer: {
            id: string;
            username: string;
            avatar_url: string | null;
        };
        seller: {
            id: string;
            username: string;
            avatar_url: string | null;
        };
        last_message: {
            id: string;
            message_text: string;
            created_at: string;
            sender_id: string;
        } | null;
        unread_count: number;
    };

    export let userId: string;
    export let showArchived = false;
    
    let conversations: Conversation[] = [];
    let loading = true;
    let hasMore = false;
    let offset = 0;
    const limit = 20;

    async function loadConversations() {
        try {
            const archivedParam = showArchived ? '&archived=true' : '';
            const response = await fetch(`/api/messages/conversations?limit=${limit}&offset=${offset}${archivedParam}`);
            const data = await response.json();
            
            if (response.ok) {
                conversations = offset === 0 ? data.conversations : [...conversations, ...data.conversations];
                hasMore = data.hasMore;
                offset += limit;
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            loading = false;
        }
    }

    async function archiveConversation(conversationId: string) {
        try {
            const response = await fetch(`/api/messages/conversations/${conversationId}/archive`, {
                method: 'POST'
            });
            
            if (response.ok) {
                // Remove from current list
                conversations = conversations.filter(c => c.id !== conversationId);
            }
        } catch (error) {
            console.error('Error archiving conversation:', error);
        }
    }

    async function unarchiveConversation(conversationId: string) {
        try {
            const response = await fetch(`/api/messages/conversations/${conversationId}/archive`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // Remove from current list
                conversations = conversations.filter(c => c.id !== conversationId);
            }
        } catch (error) {
            console.error('Error unarchiving conversation:', error);
        }
    }

    // Refresh when showArchived changes
    $: if (showArchived !== undefined) {
        offset = 0;
        loadConversations();
    }

    function getOtherUser(conversation: Conversation) {
        return userId === conversation.buyer_id ? conversation.seller : conversation.buyer;
    }

    function formatLastMessage(conversation: Conversation) {
        if (!conversation.last_message) return 'No messages yet';
        
        const isOwnMessage = conversation.last_message.sender_id === userId;
        const prefix = isOwnMessage ? 'You: ' : '';
        
        return prefix + conversation.last_message.message_text;
    }

    onMount(() => {
        loadConversations();
    });
</script>

<div class="conversation-list">
    <h2 class="text-2xl font-bold mb-6">Messages</h2>
    
    {#if loading && conversations.length === 0}
        <div class="flex justify-center py-8">
            <Spinner size="lg" text="Loading conversations..." />
        </div>
    {:else if conversations.length === 0}
        <div class="text-center py-12">
            <p class="text-gray-500">No conversations yet</p>
            <p class="text-sm text-gray-400 mt-2">
                Start a conversation by messaging a seller about their listing
            </p>
        </div>
    {:else}
        <div class="space-y-2">
            {#each conversations as conversation (conversation.id)}
                {@const otherUser = getOtherUser(conversation)}
                {@const isActive = $page.params.id === conversation.id}
                
                <div class="relative group">
                    <button
                        class="w-full text-left p-4 rounded-lg hover:bg-gray-50 transition-colors
                               {isActive ? 'bg-gray-100' : ''}"
                        onclick={() => goto(`/messages/${conversation.id}`)}
                    >
                        <div class="flex items-start gap-3">
                            <!-- Avatar -->
                            <div class="avatar">
                                <div class="w-12 h-12 rounded-full bg-gray-200">
                                    {#if otherUser.avatar_url}
                                        <img src={otherUser.avatar_url} alt={otherUser.username} width="48" height="48" class="w-full h-full rounded-full object-cover" />
                                    {:else}
                                        <div class="flex items-center justify-center h-full text-lg font-semibold">
                                            {otherUser.username[0].toUpperCase()}
                                        </div>
                                    {/if}
                                </div>
                            </div>
                            
                            <!-- Content -->
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between mb-1">
                                    <h3 class="font-semibold truncate">{otherUser.username}</h3>
                                    {#if conversation.last_message}
                                        <span class="text-xs text-gray-500">
                                            {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                                        </span>
                                    {/if}
                                </div>
                                
                                <p class="text-sm text-gray-600 truncate mb-1">
                                    {conversation.listing.title}
                                </p>
                                
                                <p class="text-sm text-gray-500 truncate">
                                    {formatLastMessage(conversation)}
                                </p>
                            </div>
                            
                            <!-- Unread badge -->
                            {#if conversation.unread_count > 0}
                                <div class="badge badge-primary badge-sm">
                                    {conversation.unread_count}
                                </div>
                            {/if}
                        </div>
                    </button>
                    
                    <!-- Archive/Unarchive button -->
                    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div class="dropdown dropdown-end">
                            <label tabindex="0" class="btn btn-ghost btn-xs btn-circle">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                                </svg>
                            </label>
                            <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                                {#if showArchived}
                                    <li>
                                        <button
                                            onclick={(e) => { e.stopPropagation(); unarchiveConversation(conversation.id); }}
                                            class="text-sm"
                                        >
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
                                            </svg>
                                            Unarchive
                                        </button>
                                    </li>
                                {:else}
                                    <li>
                                        <button
                                            onclick={(e) => { e.stopPropagation(); archiveConversation(conversation.id); }}
                                            class="text-sm"
                                        >
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
                                            </svg>
                                            Archive
                                        </button>
                                    </li>
                                {/if}
                            </ul>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
        
        {#if hasMore}
            <button
                class="btn btn-outline btn-sm w-full mt-4 flex items-center justify-center"
                onclick={handleLoadConversations}
                disabled={loading}
            >
                {#if loading}
                    <Spinner size="sm" />
                {:else}
                    Load More
                {/if}
            </button>
        {/if}
    {/if}
</div>