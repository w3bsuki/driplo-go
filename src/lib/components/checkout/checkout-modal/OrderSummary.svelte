<script lang="ts">
	import { formatCurrency } from '$lib/utils/currency';

	interface Props {
		listing: any;
		itemPrice: number;
		shippingCost: number;
		buyerFee?: number;
		totalAmount: number;
	}

	let { listing, itemPrice, shippingCost, buyerFee = 0, totalAmount }: Props = $props();
</script>

<!-- Order Summary Section -->
<div class="space-y-4">
	<h3 class="text-lg font-semibold text-gray-900">Order Summary</h3>
	
	<!-- Product Information -->
	<div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
		<div class="flex-shrink-0">
			<img
				src={listing?.image_url || listing?.images?.[0]?.url}
				alt={listing?.title}
				class="w-16 h-16 object-cover rounded-lg"
			/>
		</div>
		<div class="flex-1 min-w-0">
			<h4 class="text-sm font-medium text-gray-900 truncate">
				{listing?.title}
			</h4>
			<div class="mt-1 space-y-1">
				{#if listing?.condition}
					<p class="text-xs text-gray-600">
						Condition: <span class="font-medium">{listing.condition}</span>
					</p>
				{/if}
				{#if listing?.size}
					<p class="text-xs text-gray-600">
						Size: <span class="font-medium">{listing.size}</span>
					</p>
				{/if}
				{#if listing?.brand}
					<p class="text-xs text-gray-600">
						Brand: <span class="font-medium">{listing.brand}</span>
					</p>
				{/if}
			</div>
		</div>
		<div class="text-right">
			<p class="text-sm font-medium text-gray-900">
				{formatCurrency(itemPrice)}
			</p>
		</div>
	</div>

	<!-- Price Breakdown -->
	<div class="space-y-3 border-t pt-4">
		<div class="flex justify-between text-sm">
			<span class="text-gray-600">Item price</span>
			<span class="text-gray-900">{formatCurrency(itemPrice)}</span>
		</div>
		
		{#if shippingCost > 0}
			<div class="flex justify-between text-sm">
				<span class="text-gray-600">Shipping</span>
				<span class="text-gray-900">{formatCurrency(shippingCost)}</span>
			</div>
		{/if}
		
		{#if buyerFee > 0}
			<div class="flex justify-between text-sm">
				<span class="text-gray-600">Service fee</span>
				<span class="text-gray-900">{formatCurrency(buyerFee)}</span>
			</div>
		{/if}
		
		<div class="border-t pt-3">
			<div class="flex justify-between">
				<span class="text-base font-medium text-gray-900">Total</span>
				<span class="text-base font-medium text-gray-900">{formatCurrency(totalAmount)}</span>
			</div>
		</div>
	</div>
</div>