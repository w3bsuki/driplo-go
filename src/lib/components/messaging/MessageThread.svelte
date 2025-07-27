<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { formatDistanceToNow } from 'date-fns';
    import type { Database } from '$lib/types/database.types';
    import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
    import { decrementUnreadCount } from '$lib/stores/messages';
    // import VirtualList from '$lib/components/ui/VirtualList.svelte';
    
    type Message = Database['public']['Tables']['messages']['Row'] & {
        sender: {
            id: string;
            username: string;
            avatar_url: string | null;
        };
    };

    export let conversationId: string;
    export let userId: string;
    export let supabase: SupabaseClient<Database>;
    export let useVirtualScrolling = false;
    
    let messages: Message[] = [];
    let newMessage = '';
    let loading = true;
    let sending = false;
    let hasMore = false;
    let messagesContainer: HTMLDivElement;
    let realtimeChannel: RealtimeChannel;
    let attachments: { file: File; preview: string; type: string }[] = [];
    let uploading = false;
    let fileInput: HTMLInputElement;
    // let virtualListRef: VirtualList;
    
    // Virtual scrolling configuration
    $: shouldUseVirtualScrolling = useVirtualScrolling && messages.length > 100;

    async function loadMessages(before?: string) {
        try {
            const url = `/api/messages/conversations/${conversationId}` + 
                        (before ? `?before=${before}` : '');
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (response.ok) {
                messages = before ? [...data.messages, ...messages] : data.messages;
                hasMore = data.hasMore;
                
                if (!before) {
                    // Scroll to bottom for initial load
                    setTimeout(scrollToBottom, 100);
                    
                    // Decrement unread count for messages that will be marked as read
                    const unreadMessages = data.messages.filter(msg => 
                        !msg.is_read && msg.sender_id !== userId
                    );
                    if (unreadMessages.length > 0) {
                        decrementUnreadCount(unreadMessages.length);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            loading = false;
        }
    }

    async function sendMessage() {
        if ((!newMessage.trim() && attachments.length === 0) || sending) return;
        
        sending = true;
        uploading = true;
        const messageContent = newMessage;
        const messageAttachments = [...attachments];
        newMessage = '';
        attachments = [];
        
        try {
            // Upload attachments first
            const uploadedAttachments = [];
            for (const attachment of messageAttachments) {
                const uploaded = await uploadAttachment(attachment.file);
                if (uploaded) {
                    uploadedAttachments.push(uploaded);
                }
            }
            
            uploading = false;
            
            const response = await fetch('/api/messages/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_id: conversationId,
                    content: messageContent,
                    attachments: uploadedAttachments
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Message will be added via realtime subscription
                scrollToBottom();
            } else {
                // Restore message and attachments on error
                newMessage = messageContent;
                attachments = messageAttachments;
                console.error('Error sending message:', data.error);
            }
        } catch (error) {
            newMessage = messageContent;
            attachments = messageAttachments;
            console.error('Error sending message:', error);
        } finally {
            sending = false;
            uploading = false;
        }
    }

    function scrollToBottom() {
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    function setupRealtimeSubscription() {
        realtimeChannel = supabase
            .channel(`conversation:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                async (payload) => {
                    // Fetch the complete message with sender info
                    const response = await fetch(`/api/messages/${payload.new.id}`);
                    if (response.ok) {
                        const data = await response.json();
                        messages = [...messages, data.message];
                        setTimeout(scrollToBottom, 100);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    // Update read status in real-time
                    if (payload.new.is_read !== payload.old.is_read) {
                        messages = messages.map(msg => 
                            msg.id === payload.new.id 
                                ? { ...msg, is_read: payload.new.is_read, read_at: payload.new.read_at }
                                : msg
                        );
                    }
                }
            )
            .subscribe();
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    }

    function handleFileSelect(event: Event) {
        const target = event.target as HTMLInputElement;
        const files = target.files;
        if (files) {
            for (const file of files) {
                addAttachment(file);
            }
        }
    }

    function addAttachment(file: File) {
        if (attachments.length >= 5) {
            alert('Maximum 5 attachments allowed');
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        // Validate file type (images only for now)
        if (!file.type.startsWith('image/')) {
            alert('Only image files are supported');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = e.target?.result as string;
            attachments = [...attachments, {
                file,
                preview,
                type: 'image'
            }];
        };
        reader.readAsDataURL(file);
    }

    function removeAttachment(index: number) {
        attachments = attachments.filter((_, i) => i !== index);
    }

    async function uploadAttachment(file: File): Promise<{ url: string; name: string; size: number; type: string } | null> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'general');

            const response = await fetch('/api/upload/image', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    url: data.publicUrl,
                    name: file.name,
                    size: file.size,
                    type: 'image'
                };
            }
        } catch (error) {
            console.error('Error uploading attachment:', error);
        }
        return null;
    }

    onMount(() => {
        loadMessages();
        setupRealtimeSubscription();
    });

    onDestroy(() => {
        if (realtimeChannel) {
            supabase.removeChannel(realtimeChannel);
        }
    });
</script>

<div class="message-thread flex flex-col h-full">
    <!-- Messages -->
    {#if loading && messages.length === 0}
        <div class="flex justify-center py-8">
            <div class="loading loading-spinner loading-lg"></div>
        </div>
    {:else}
        <!-- Regular scrolling for shorter conversations -->
        <div 
            bind:this={messagesContainer}
            class="flex-1 overflow-y-auto p-4 space-y-4"
        >
            {#if hasMore}
                <button
                    class="btn btn-sm btn-ghost w-full"
                    onclick={() => loadMessages(messages[0]?.created_at)}
                >
                    Load earlier messages
                </button>
            {/if}
            
            {#each messages as message (message.id)}
                {@const isOwnMessage = message.sender_id === userId}
                
                <div class="flex {isOwnMessage ? 'justify-end' : 'justify-start'}">
                    <div class="max-w-[70%] {isOwnMessage ? 'order-2' : 'order-1'}">
                        {#if !isOwnMessage}
                            <div class="flex items-center gap-2 mb-1">
                                <div class="avatar">
                                    <div class="w-6 h-6 rounded-full bg-gray-200">
                                        {#if message.sender.avatar_url}
                                            <img src={message.sender.avatar_url} alt={message.sender.username} width="24" height="24" class="w-full h-full rounded-full object-cover" />
                                        {:else}
                                            <div class="flex items-center justify-center h-full text-xs">
                                                {message.sender.username[0].toUpperCase()}
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                                <span class="text-sm font-medium">{message.sender.username}</span>
                            </div>
                        {/if}
                        
                        <div class="flex items-end gap-2">
                            <div class="px-4 py-2 rounded-2xl {isOwnMessage ? 'bg-primary text-primary-content' : 'bg-gray-100 text-gray-900'}">
                                <p class="whitespace-pre-wrap break-words">{message.message_text}</p>
                                
                                <!-- Display attachments -->
                                {#if message.attachments && Array.isArray(message.attachments) && message.attachments.length > 0}
                                    <div class="mt-2 space-y-2">
                                        {#each message.attachments as attachment (attachment.url)}
                                            {#if attachment.type === 'image'}
                                                <div class="rounded-lg overflow-hidden max-w-xs">
                                                    <img 
                                                        src={attachment.url} 
                                                        alt={attachment.name || 'Image attachment'}
                                                        class="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                                        onclick={() => window.open(attachment.url, '_blank')}
                                                    />
                                                </div>
                                            {:else}
                                                <div class="flex items-center gap-2 p-2 bg-opacity-20 bg-white rounded-lg">
                                                    <div class="flex-shrink-0">
                                                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v12H4V4zm2 2v8h8V6H6z"/>
                                                        </svg>
                                                    </div>
                                                    <div class="flex-1 min-w-0">
                                                        <p class="text-sm font-medium truncate">{attachment.name || 'File'}</p>
                                                        {#if attachment.size}
                                                            <p class="text-xs opacity-75">{Math.round(attachment.size / 1024)} KB</p>
                                                        {/if}
                                                    </div>
                                                    <button
                                                        class="btn btn-xs btn-ghost"
                                                        onclick={() => window.open(attachment.url, '_blank')}
                                                    >
                                                        Download
                                                    </button>
                                                </div>
                                            {/if}
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                            <div class="flex items-center gap-1">
                                <span class="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                </span>
                                {#if isOwnMessage}
                                    <div class="flex items-center" title={message.is_read ? 'Read' : 'Sent'}>
                                        {#if message.is_read}
                                            <!-- Double checkmark for read -->
                                            <svg class="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                                            </svg>
                                            <svg class="w-3 h-3 text-blue-500 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                                            </svg>
                                        {:else}
                                            <!-- Single checkmark for sent -->
                                            <svg class="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                                            </svg>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
    
    <!-- Message input -->
    <div class="border-t p-4">
        <!-- Attachment previews -->
        {#if attachments.length > 0}
            <div class="mb-4">
                <div class="flex flex-wrap gap-2">
                    {#each attachments as attachment, index (index)}
                        <div class="relative">
                            <img 
                                src={attachment.preview} 
                                alt="Attachment preview" 
                                class="w-16 h-16 object-cover rounded-lg"
                            />
                            <button
                                type="button"
                                class="absolute -top-2 -right-2 btn btn-xs btn-circle btn-error"
                                onclick={() => removeAttachment(index)}
                            >
                                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
                                </svg>
                            </button>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        <form onsubmit={(e) => { e.preventDefault(); sendMessage(); }} class="flex gap-2">
            <div class="flex-1">
                <textarea
                    bind:value={newMessage}
                    onkeydown={handleKeydown}
                    placeholder="Type a message..."
                    rows="1"
                    class="textarea textarea-bordered w-full resize-none"
                    disabled={sending}
                ></textarea>
            </div>
            <div class="flex gap-2">
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    bind:this={fileInput}
                    onchange={handleFileSelect}
                    class="hidden"
                />
                <button
                    type="button"
                    class="btn btn-ghost btn-square"
                    onclick={() => fileInput.click()}
                    disabled={sending || attachments.length >= 5}
                    title="Add image"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                </button>
                <button
                    type="submit"
                    class="btn btn-primary"
                    disabled={(!newMessage.trim() && attachments.length === 0) || sending}
                >
                    {#if uploading}
                        <span class="loading loading-spinner loading-xs"></span>
                        Uploading...
                    {:else if sending}
                        <span class="loading loading-spinner loading-xs"></span>
                        Sending...
                    {:else}
                        Send
                    {/if}
                </button>
            </div>
        </form>
    </div>
</div>

