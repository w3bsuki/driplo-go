<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    export let orderId: string;
    
    const dispatch = createEventDispatcher();
    
    let shipping_carrier = '';
    let tracking_number = '';
    let shipping_label_url = '';
    let submitting = false;
    let error = '';

    const carriers = [
        { value: 'usps', label: 'USPS' },
        { value: 'ups', label: 'UPS' },
        { value: 'fedex', label: 'FedEx' },
        { value: 'dhl', label: 'DHL' },
        { value: 'other', label: 'Other' }
    ];

    async function handleSubmit(event: Event) {
        event.preventDefault();
        
        if (!shipping_carrier || !tracking_number) {
            error = 'Please fill in all required fields';
            return;
        }
        
        submitting = true;
        error = '';
        
        try {
            const response = await fetch(`/api/orders/${orderId}/ship`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shipping_carrier,
                    tracking_number,
                    shipping_label_url: shipping_label_url || undefined
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                dispatch('shipped', data);
            } else {
                error = data.error || 'Failed to update shipping information';
            }
        } catch (err) {
            error = 'An error occurred. Please try again.';
        } finally {
            submitting = false;
        }
    }
</script>

<div class="modal modal-open">
    <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Shipping Information</h3>
        
        <form onsubmit={handleSubmit}>
            <div class="space-y-4">
                {#if error}
                    <div class="alert alert-error">
                        <p>{error}</p>
                    </div>
                {/if}
                
                <div class="form-control">
                    <label class="label" for="carrier">
                        <span class="label-text">Shipping Carrier <span class="text-error">*</span></span>
                    </label>
                    <select 
                        id="carrier"
                        bind:value={shipping_carrier}
                        class="select select-bordered"
                        required
                    >
                        <option value="">Select a carrier</option>
                        {#each carriers as carrier}
                            <option value={carrier.value}>{carrier.label}</option>
                        {/each}
                    </select>
                </div>
                
                <div class="form-control">
                    <label class="label" for="tracking">
                        <span class="label-text">Tracking Number <span class="text-error">*</span></span>
                    </label>
                    <input 
                        id="tracking"
                        type="text" 
                        bind:value={tracking_number}
                        placeholder="Enter tracking number"
                        class="input input-bordered"
                        required
                    />
                </div>
                
                <div class="form-control">
                    <label class="label" for="label-url">
                        <span class="label-text">Shipping Label URL (optional)</span>
                    </label>
                    <input 
                        id="label-url"
                        type="url" 
                        bind:value={shipping_label_url}
                        placeholder="https://..."
                        class="input input-bordered"
                    />
                    <label class="label">
                        <span class="label-text-alt">URL to the shipping label PDF</span>
                    </label>
                </div>
            </div>
            
            <div class="modal-action">
                <button 
                    type="button"
                    class="btn btn-ghost"
                    onclick={() => dispatch('cancel')}
                    disabled={submitting}
                >
                    Cancel
                </button>
                <button 
                    type="submit"
                    class="btn btn-primary"
                    disabled={submitting}
                >
                    {submitting ? 'Updating...' : 'Mark as Shipped'}
                </button>
            </div>
        </form>
    </div>
    <button type="button" class="modal-backdrop" onclick={() => dispatch('cancel')} aria-label="Close modal"></button>
</div>