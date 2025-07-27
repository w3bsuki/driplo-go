<script lang="ts">
    import { onMount } from 'svelte';
    import { formatDistanceToNow } from 'date-fns';
    import type { Database } from '$lib/types/database.types';
    import { Package, ShoppingBag, Clock, ChevronRight, Check, X, Truck, AlertCircle, MoreVertical } from 'lucide-svelte';
    import Spinner from '$lib/components/ui/Spinner.svelte';
    
    type Transaction = {
        id: string;
        listing_id: string;
        buyer_id: string;
        seller_id: string;
        amount: number;
        status: string;
        created_at: string;
        listing?: {
            id: string;
            title: string;
            images: string[];
            price: number;
        };
        buyer?: {
            id: string;
            username: string;
            avatar_url: string | null;
        };
        seller?: {
            id: string;
            username: string;
            avatar_url: string | null;
        };
    };

    export let role: 'buyer' | 'seller' | 'all' = 'all';
    export let status: string | null = null;
    export let dateFrom: string = '';
    export let dateTo: string = '';
    
    let transactions: Transaction[] = [];
    let loading = true;
    let hasMore = false;
    let offset = 0;
    const limit = 20;
    let selectedOrders: Set<string> = new Set();
    let bulkActionLoading = false;

    const statusConfig = {
        pending: { color: 'bg-amber-100 text-amber-800', icon: Clock },
        confirmed: { color: 'bg-blue-100 text-blue-800', icon: Check },
        processing: { color: 'bg-indigo-100 text-indigo-800', icon: Package },
        shipped: { color: 'bg-purple-100 text-purple-800', icon: Truck },
        delivered: { color: 'bg-green-100 text-green-800', icon: Check },
        cancelled: { color: 'bg-red-100 text-red-800', icon: X },
        refunded: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
        disputed: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle }
    };

    async function loadTransactions() {
        try {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: offset.toString()
            });
            
            if (role !== 'all') params.append('role', role);
            if (status) params.append('status', status);
            if (dateFrom) params.append('from', dateFrom);
            if (dateTo) params.append('to', dateTo);
            
            const response = await fetch(`/api/transactions?${params}`);
            const data = await response.json();
            
            if (response.ok && data.data) {
                transactions = offset === 0 ? data.data : [...transactions, ...data.data];
                hasMore = data.hasMore || false;
                offset += limit;
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            loading = false;
        }
    }

    function formatPrice(amount: number) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    function toggleOrder(orderId: string) {
        if (selectedOrders.has(orderId)) {
            selectedOrders.delete(orderId);
        } else {
            selectedOrders.add(orderId);
        }
        selectedOrders = new Set(selectedOrders);
    }

    function toggleAllOrders() {
        if (selectedOrders.size === transactions.length) {
            selectedOrders.clear();
        } else {
            selectedOrders = new Set(transactions.map(t => t.id));
        }
        selectedOrders = new Set(selectedOrders);
    }

    async function bulkAction(action: 'mark_shipped' | 'cancel') {
        if (selectedOrders.size === 0) return;
        
        const confirmed = confirm(`Are you sure you want to ${action.replace('_', ' ')} ${selectedOrders.size} orders?`);
        if (!confirmed) return;
        
        bulkActionLoading = true;
        
        try {
            const response = await fetch('/api/orders/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    orderIds: Array.from(selectedOrders)
                })
            });
            
            if (response.ok) {
                selectedOrders.clear();
                selectedOrders = new Set();
                offset = 0;
                transactions = [];
                await loadTransactions();
            }
        } catch (error) {
            console.error('Bulk action failed:', error);
        } finally {
            bulkActionLoading = false;
        }
    }

    onMount(() => {
        loadTransactions();
    });
</script>

<div class="order-list">
    {#if loading && transactions.length === 0}
        <div class="flex justify-center py-12">
            <Spinner size="lg" text="Loading orders..." />
        </div>
    {:else if transactions.length === 0}
        <div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div class="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Package class="w-8 h-8 text-gray-400" />
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            {#if role === 'buyer'}
                <p class="text-sm text-gray-500 max-w-sm mx-auto">
                    When you purchase items, they'll appear here. Start browsing to find amazing deals!
                </p>
            {:else if role === 'seller'}
                <p class="text-sm text-gray-500 max-w-sm mx-auto">
                    When buyers purchase your items, orders will show up here. Keep listing great items!
                </p>
            {:else}
                <p class="text-sm text-gray-500 max-w-sm mx-auto">
                    No orders match your current filters. Try adjusting them to see more results.
                </p>
            {/if}
        </div>
    {:else}
        <!-- Bulk actions for sellers -->
        {#if role === 'seller' && transactions.length > 0}
            <div class="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <input 
                            type="checkbox" 
                            class="w-5 h-5 sm:w-4 sm:h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                            checked={selectedOrders.size === transactions.length}
                            onchange={handleToggleAllOrders}
                        />
                        <label class="text-sm font-medium text-gray-700 cursor-pointer select-none" onclick={handleToggleAllOrders}>
                            Select All
                            {#if selectedOrders.size > 0}
                                <span class="text-gray-500 font-normal">({selectedOrders.size} selected)</span>
                            {/if}
                        </label>
                    </div>
                    {#if selectedOrders.size > 0}
                        <div class="flex items-center gap-2 self-end sm:self-auto">
                            <button 
                                class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 min-h-11"
                                onclick={() => bulkAction('mark_shipped')}
                                disabled={bulkActionLoading}
                            >
                                <Truck class="w-4 h-4" />
                                <span class="hidden sm:inline">{bulkActionLoading ? 'Processing...' : 'Mark as Shipped'}</span>
                                <span class="sm:hidden">{bulkActionLoading ? '...' : 'Ship'}</span>
                            </button>
                            <button 
                                class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 min-h-11"
                                onclick={() => bulkAction('cancel')}
                                disabled={bulkActionLoading}
                            >
                                <X class="w-4 h-4" />
                                <span class="hidden sm:inline">{bulkActionLoading ? 'Processing...' : 'Cancel'}</span>
                                <span class="sm:hidden">{bulkActionLoading ? '...' : 'Cancel'}</span>
                            </button>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}

        <div class="space-y-3">
            {#each transactions as transaction (transaction.id)}
                {@const config = statusConfig[transaction.status] || statusConfig.pending}
                <div class="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
                    <div class="p-4">
                        <!-- Order header -->
                        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div class="flex items-start gap-3">
                                {#if role === 'seller'}
                                    <input 
                                        type="checkbox" 
                                        class="mt-1 w-5 h-5 sm:w-4 sm:h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 flex-shrink-0"
                                        checked={selectedOrders.has(transaction.id)}
                                        onchange={() => toggleOrder(transaction.id)}
                                    />
                                {/if}
                                <div class="flex items-start gap-3 flex-1">
                                    {#if transaction.listing?.images?.[0]}
                                        <img 
                                            src={transaction.listing.images[0]} 
                                            alt={transaction.listing.title}
                                            width="80"
                                            height="80"
                                            class="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
                                        />
                                    {:else}
                                        <div class="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Package class="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                                        </div>
                                    {/if}
                                    <div class="flex-1 min-w-0">
                                        <h3 class="font-medium text-gray-900 line-clamp-1 sm:line-clamp-2 break-words">
                                            {transaction.listing?.title || 'Unknown Item'}
                                        </h3>
                                        <p class="text-sm text-gray-500 mt-1 truncate">
                                            Order #{transaction.id.slice(0, 13)}
                                        </p>
                                        <p class="text-xs text-gray-400 mt-1 truncate">
                                            {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                                        </p>
                                        <!-- Mobile price & status -->
                                        <div class="flex items-center gap-3 mt-2 sm:hidden">
                                            <span class="text-base font-semibold text-gray-900">
                                                {formatPrice(transaction.amount)}
                                            </span>
                                            <span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full {config.color}">
                                                <svelte:component this={config.icon} class="w-3 h-3" />
                                                <span class="truncate">{transaction.status}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- Desktop price & status -->
                            <div class="hidden sm:flex flex-col items-end gap-2">
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full {config.color}">
                                    <svelte:component this={config.icon} class="w-3 h-3" />
                                    {transaction.status}
                                </span>
                                <span class="text-lg font-semibold text-gray-900">
                                    {formatPrice(transaction.amount)}
                                </span>
                            </div>
                        </div>
                        
                        
                        <!-- Order footer -->
                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 mt-3 border-t border-gray-100">
                            <div class="flex items-center gap-3 min-w-0">
                                {#if role === 'buyer' && transaction.seller}
                                    <img 
                                        src={transaction.seller.avatar_url || `https://ui-avatars.com/api/?name=${transaction.seller.username}&background=87CEEB&color=fff`}
                                        alt={transaction.seller.username}
                                        class="w-8 h-8 rounded-full flex-shrink-0"
                                    />
                                    <div class="min-w-0">
                                        <p class="text-xs text-gray-500">Seller</p>
                                        <p class="text-sm font-medium text-gray-900 truncate">@{transaction.seller.username}</p>
                                    </div>
                                {:else if role === 'seller' && transaction.buyer}
                                    <img 
                                        src={transaction.buyer.avatar_url || `https://ui-avatars.com/api/?name=${transaction.buyer.username}&background=87CEEB&color=fff`}
                                        alt={transaction.buyer.username}
                                        class="w-8 h-8 rounded-full flex-shrink-0"
                                    />
                                    <div class="min-w-0">
                                        <p class="text-xs text-gray-500">Buyer</p>
                                        <p class="text-sm font-medium text-gray-900 truncate">@{transaction.buyer.username}</p>
                                    </div>
                                {/if}
                            </div>
                            <div class="flex items-center gap-2 self-end sm:self-auto">
                                <button class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors min-w-11 min-h-11 flex items-center justify-center">
                                    <MoreVertical class="w-4 h-4" />
                                </button>
                                <a href="/orders/{transaction.id}" class="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors min-h-11">
                                    <span class="hidden sm:inline">View Details</span>
                                    <span class="sm:hidden">View</span>
                                    <ChevronRight class="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
        
        {#if hasMore}
            <div class="mt-6 text-center">
                <button
                    class="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    onclick={handleLoadTransactions}
                    disabled={loading}
                >
                    {#if loading}
                        <Spinner size="sm" />
                    {:else}
                        Load More Orders
                    {/if}
                </button>
            </div>
        {/if}
    {/if}
</div>