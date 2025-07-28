<script lang="ts">
    import { page } from '$app/stores';
    import OrderDetails from '$lib/components/orders/OrderDetails.svelte';
    import type { PageData } from './$types';
    
    let { data }: { data: PageData } = $props();
</script>

<svelte:head>
    <title>Order Details - Driplo</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
        <div class="mb-6">
            <a href="/orders" class="btn btn-ghost btn-sm">
                ← Back to Orders
            </a>
        </div>
        
        <OrderDetails 
            order={data.order}
            userId={data.session?.user.id || ''} 
        />
    </div>
</div>