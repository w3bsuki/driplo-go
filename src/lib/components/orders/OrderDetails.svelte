<script lang="ts">
    import { format } from 'date-fns';
    import ShippingForm from './ShippingForm.svelte';
    import type { Database } from '$lib/types/database.types';
    
    type Order = Database['public']['Tables']['orders']['Row'] & {
        buyer: {
            id: string;
            username: string;
            email: string;
            avatar_url: string | null;
        };
        seller: {
            id: string;
            username: string;
            email: string;
            avatar_url: string | null;
        };
        order_items: Array<{
            id: string;
            quantity: number;
            price: number;
            total: number;
            item_snapshot: any;
            listing: {
                id: string;
                title: string;
                images: string[];
            };
        }>;
        status_history: Array<{
            id: string;
            from_status: string | null;
            to_status: string;
            reason: string | null;
            created_at: string;
            changed_by_user: {
                username: string;
            } | null;
        }>;
        shipping_events: Array<{
            id: string;
            event_type: string;
            event_description: string | null;
            location: string | null;
            created_at: string;
        }>;
    };

    export let order: Order;
    export let userId: string;
    
    let showShippingForm = false;

    const statusColors = {
        pending: 'badge-warning',
        confirmed: 'badge-info',
        processing: 'badge-info',
        shipped: 'badge-primary',
        delivered: 'badge-success',
        cancelled: 'badge-error',
        refunded: 'badge-error',
        disputed: 'badge-warning'
    };

    async function loadOrder() {
        try {
            const response = await fetch(`/api/orders/${order.id}`);
            const data = await response.json();
            
            if (response.ok) {
                order = data.order;
            }
        } catch (error) {
            console.error('Error loading order:', error);
        }
    }

    async function updateOrderStatus(newStatus: string, reason?: string) {
        if (!order) return;
        
        try {
            const response = await fetch(`/api/orders/${order.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    status_reason: reason
                })
            });
            
            if (response.ok) {
                await loadOrder();
            }
        } catch (error) {
            console.error('Error updating order:', error);
        }
    }

    function formatPrice(cents: number) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(cents / 100);
    }

    function canShipOrder() {
        return order && 
               userId === order.seller_id && 
               (order.status === 'confirmed' || order.status === 'processing') &&
               !order.tracking_number;
    }

    function canMarkDelivered() {
        return order && 
               userId === order.buyer_id && 
               order.status === 'shipped';
    }

    function canCancelOrder() {
        return order && 
               (userId === order.buyer_id || userId === order.seller_id) && 
               ['pending', 'confirmed', 'processing'].includes(order.status);
    }

    async function cancelOrder() {
        if (!order) return;
        
        const reason = prompt('Please provide a reason for cancellation:');
        if (!reason) return;
        
        try {
            const response = await fetch(`/api/orders/${order.id}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });
            
            if (response.ok) {
                await loadOrder();
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
        }
    }

    async function completeOrder() {
        if (!order) return;
        
        const confirmed = confirm('Are you sure you want to mark this order as delivered?');
        if (!confirmed) return;
        
        try {
            const response = await fetch(`/api/orders/${order.id}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    reason: 'Order delivered and confirmed by buyer' 
                })
            });
            
            if (response.ok) {
                await loadOrder();
            }
        } catch (error) {
            console.error('Error completing order:', error);
        }
    }

</script>

{#if !order}
    <div class="alert alert-error">
        <p>Order not found</p>
    </div>
{:else}
    <div class="space-y-6">
        <!-- Order header -->
        <div class="card bg-base-100 shadow-sm border">
            <div class="card-body">
                <div class="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-bold">Order #{order.order_number}</h2>
                        <p class="text-gray-500">
                            Placed on {format(new Date(order.created_at), 'PPP')}
                        </p>
                    </div>
                    <div class="text-right">
                        <span class="badge {statusColors[order.status]} badge-lg mb-2">
                            {order.status}
                        </span>
                        <p class="text-2xl font-bold">
                            {formatPrice(order.total_amount)}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Order items -->
        <div class="card bg-base-100 shadow-sm border">
            <div class="card-body">
                <h3 class="text-lg font-semibold mb-4">Order Items</h3>
                <div class="space-y-4">
                    {#each order.order_items as item (item.id)}
                        <div class="flex gap-4">
                            <div class="w-24 h-24 rounded overflow-hidden bg-gray-100">
                                {#if item.listing.images?.[0]}
                                    <img 
                                        src={item.listing.images[0]} 
                                        alt={item.listing.title}
                                        width="96"
                                        height="96"
                                        class="w-full h-full object-cover"
                                    />
                                {/if}
                            </div>
                            <div class="flex-1">
                                <h4 class="font-semibold">{item.listing.title}</h4>
                                <p class="text-sm text-gray-500">
                                    {item.item_snapshot.description}
                                </p>
                                <div class="mt-2">
                                    <span class="text-sm">
                                        Qty: {item.quantity} × {formatPrice(item.price)} = 
                                        <strong>{formatPrice(item.total)}</strong>
                                    </span>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
                
                <!-- Price breakdown -->
                <div class="divider"></div>
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatPrice(order.subtotal)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Shipping</span>
                        <span>{formatPrice(order.shipping_cost)}</span>
                    </div>
                    {#if order.tax_amount > 0}
                        <div class="flex justify-between">
                            <span>Tax</span>
                            <span>{formatPrice(order.tax_amount)}</span>
                        </div>
                    {/if}
                    <div class="divider my-2"></div>
                    <div class="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span>{formatPrice(order.total_amount)}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Shipping information -->
        <div class="card bg-base-100 shadow-sm border">
            <div class="card-body">
                <h3 class="text-lg font-semibold mb-4">Shipping Information</h3>
                
                {#if order.shipping_address}
                    <div class="space-y-2 mb-4">
                        <p><strong>Ship to:</strong></p>
                        <p>{order.shipping_address.name}</p>
                        <p>{order.shipping_address.address_line_1}</p>
                        {#if order.shipping_address.address_line_2}
                            <p>{order.shipping_address.address_line_2}</p>
                        {/if}
                        <p>
                            {order.shipping_address.city}, 
                            {order.shipping_address.state} 
                            {order.shipping_address.postal_code}
                        </p>
                        <p>{order.shipping_address.country}</p>
                    </div>
                {/if}
                
                {#if order.tracking_number}
                    <div class="bg-gray-50 p-4 rounded">
                        <p class="font-semibold mb-2">Tracking Information</p>
                        <p>Carrier: {order.shipping_carrier}</p>
                        <p>Tracking Number: <code>{order.tracking_number}</code></p>
                        {#if order.shipped_at}
                            <p class="text-sm text-gray-500 mt-2">
                                Shipped on {format(new Date(order.shipped_at), 'PPP')}
                            </p>
                        {/if}
                    </div>
                {/if}
                
                <!-- Action buttons -->
                <div class="flex gap-2 flex-wrap">
                    {#if canShipOrder()}
                        <button 
                            class="btn btn-primary"
                            onclick={() => showShippingForm = true}
                        >
                            Mark as Shipped
                        </button>
                    {/if}
                    
                    {#if canMarkDelivered()}
                        <button 
                            class="btn btn-success"
                            onclick={handleCompleteOrder}
                        >
                            Mark as Delivered
                        </button>
                    {/if}
                    
                    {#if canCancelOrder()}
                        <button 
                            class="btn btn-error btn-outline"
                            onclick={handleCancelOrder}
                        >
                            Cancel Order
                        </button>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Order history -->
        {#if order.status_history.length > 0}
            <div class="card bg-base-100 shadow-sm border">
                <div class="card-body">
                    <h3 class="text-lg font-semibold mb-4">Order History</h3>
                    <div class="space-y-3">
                        {#each order.status_history as event (event.id)}
                            <div class="flex items-start gap-3">
                                <div class="w-2 h-2 rounded-full bg-gray-400 mt-2"></div>
                                <div class="flex-1">
                                    <p class="font-medium">
                                        {event.from_status ? `${event.from_status} → ` : ''}
                                        {event.to_status}
                                    </p>
                                    {#if event.reason}
                                        <p class="text-sm text-gray-600">{event.reason}</p>
                                    {/if}
                                    <p class="text-xs text-gray-500">
                                        {format(new Date(event.created_at), 'PPp')}
                                        {#if event.changed_by_user}
                                            by {event.changed_by_user.username}
                                        {/if}
                                    </p>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}
    </div>
{/if}

<!-- Shipping form modal -->
{#if showShippingForm && order}
    <ShippingForm 
        orderId={order.id}
        on:shipped={() => {
            showShippingForm = false;
            loadOrder();
        }}
        on:cancel={() => showShippingForm = false}
    />
{/if}