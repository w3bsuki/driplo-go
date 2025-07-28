<script lang="ts">
	import { X } from 'lucide-svelte';
	import { fade, scale } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { logger } from '$lib/services/logger';
	import { focusTrap } from '$lib/utils/focus-trap';
	
	// Import decomposed components
	import { useCheckoutState } from './checkout-modal/hooks/useCheckoutState.svelte';
	import OrderSummary from './checkout-modal/OrderSummary.svelte';
	import ShippingForm from './checkout-modal/ShippingForm.svelte';
	import PaymentSelector from './checkout-modal/PaymentSelector.svelte';
	import PaymentProcessor from './checkout-modal/PaymentProcessor.svelte';
	
	import * as m from '$lib/paraglide/messages.js';

	interface PaymentResult {
		success: boolean;
		order_id?: string;
		payment_intent_id?: string;
		error?: string;
	}

	interface Props {
		listing: any;
		isOpen: boolean;
		onClose: () => void;
	}

	let { listing, isOpen, onClose }: Props = $props();

	// Initialize checkout state management
	const checkoutState = useCheckoutState(listing);

	// Handle payment success
	function handlePaymentSuccess(result: PaymentResult) {
		logger.debug('✅ Payment successful:', result);
		
		if (result.success) {
			toast.success(m.payment_successful());
			
			// Reset state and close modal
			checkoutState.resetCheckoutState();
			onClose();
			
			// Redirect to order confirmation or handle success
			if (result.order_id) {
				// Navigate to order confirmation page
				window.location.href = `/orders/${result.order_id}`;
			} else if (result.payment_intent_id) {
				// Navigate to order confirmation with payment intent
				window.location.href = `/order-confirmation?payment_intent=${result.payment_intent_id}`;
			}
		}
	}

	// Handle payment errors
	function handlePaymentError(error: string) {
		logger.error('❌ Payment failed:', error);
		toast.error(error || m.payment_failed());
		checkoutState.setIsProcessing(false);
	}

	// Handle processing state changes
	function handleProcessingChange(processing: boolean) {
		checkoutState.setIsProcessing(processing);
	}

	// Handle modal close
	function handleClose() {
		// Don't allow closing while processing payment
		if (checkoutState.isProcessing) {
			toast.warning(m.cannot_close_during_payment());
			return;
		}
		
		// Reset state when closing
		checkoutState.resetCheckoutState();
		onClose();
	}

	// Handle shipping address updates
	function handleAddressChange(address: any) {
		checkoutState.updateShippingAddress(address);
	}

	// Handle payment provider changes
	function handleProviderChange(provider: 'stripe' | 'revolut_manual') {
		checkoutState.setPaymentProvider(provider);
	}

	// Check if checkout form is valid
	function isCheckoutValid(): boolean {
		return checkoutState.isShippingAddressValid && checkoutState.totalAmount > 0;
	}
</script>

<!-- Checkout Modal -->
{#if isOpen}
	<div 
		class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" 
		transition:fade={{ duration: 200 }}
		onclick={(e) => {
			// Close modal if clicking backdrop
			if (e.target === e.currentTarget) {
				handleClose();
			}
		}}
		role="dialog"
		aria-modal="true"
		aria-labelledby="checkout-title"
	>
		<div 
			class="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" 
			transition:scale={{ duration: 200 }}
			onclick={(e) => e.stopPropagation()}
			use:focusTrap={{ enabled: isOpen, onDeactivate: handleClose }}
		>
			<!-- Modal Header -->
			<div class="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
				<h2 id="checkout-title" class="text-xl font-bold text-gray-900">
					{m.checkout_title()}
				</h2>
				<button
					onclick={handleClose}
					disabled={checkoutState.isProcessing}
					class="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					aria-label={m.close_modal()}
				>
					<X class="w-5 h-5 text-gray-500" />
				</button>
			</div>

			<!-- Modal Content -->
			<div class="p-6 space-y-6">
				<!-- Order Summary Section -->
				<OrderSummary
					{listing}
					itemPrice={checkoutState.itemPrice}
					shippingCost={checkoutState.shippingCost}
					buyerFee={checkoutState.buyerFee}
					totalAmount={checkoutState.totalAmount}
				/>

				<!-- Shipping Address Section -->
				<ShippingForm
					shippingAddress={checkoutState.shippingAddress}
					onAddressChange={handleAddressChange}
					disabled={checkoutState.isProcessing}
				/>

				<!-- Payment Method Selection -->
				<PaymentSelector
					paymentProvider={checkoutState.paymentProvider}
					onProviderChange={handleProviderChange}
					disabled={checkoutState.isProcessing}
				/>

				<!-- Payment Processing -->
				<PaymentProcessor
					paymentProvider={checkoutState.paymentProvider}
					{listing}
					shippingAddress={checkoutState.shippingAddress}
					totalAmount={checkoutState.totalAmount}
					isProcessing={checkoutState.isProcessing}
					onPaymentSuccess={handlePaymentSuccess}
					onPaymentError={handlePaymentError}
					onProcessingChange={handleProcessingChange}
				/>
			</div>

			<!-- Modal Footer - Processing Indicator -->
			{#if checkoutState.isProcessing}
				<div class="border-t border-gray-200 p-4 bg-gray-50 rounded-b-2xl">
					<div class="flex items-center justify-center space-x-2">
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500"></div>
						<span class="text-sm text-gray-600">{m.processing_please_wait()}</span>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Loading spinner animation */
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.animate-spin {
		animation: spin 1s linear infinite;
	}

	/* Modal overlay backdrop blur effect */
	.modal-backdrop {
		backdrop-filter: blur(4px);
	}

	/* Scrollbar styling for modal content */
	.overflow-y-auto::-webkit-scrollbar {
		width: 6px;
	}

	.overflow-y-auto::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 3px;
	}

	.overflow-y-auto::-webkit-scrollbar-thumb {
		background: #c1c1c1;
		border-radius: 3px;
	}

	.overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background: #a8a8a8;
	}
</style>