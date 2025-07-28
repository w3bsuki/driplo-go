<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { CreditCard } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { logger } from '$lib/services/logger';
	import { useStripePayment } from './hooks/useStripePayment.svelte';
	import { useRevolutPayment } from './hooks/useRevolutPayment.svelte';
	import PaymentInstructions from './PaymentInstructions.svelte';
	import * as m from '$lib/paraglide/messages.js';

	interface ShippingAddress {
		name: string;
		address_line1: string;
		address_line2: string;
		city: string;
		state: string;
		postal_code: string;
		country: string;
	}

	interface PaymentResult {
		success: boolean;
		order_id?: string;
		payment_intent_id?: string;
		error?: string;
	}

	interface Props {
		paymentProvider: 'stripe' | 'revolut_manual';
		listing: any;
		shippingAddress: ShippingAddress;
		totalAmount: number;
		isProcessing: boolean;
		onPaymentSuccess: (result: PaymentResult) => void;
		onPaymentError: (error: string) => void;
		onProcessingChange: (processing: boolean) => void;
	}

	let { 
		paymentProvider, 
		listing, 
		shippingAddress, 
		totalAmount,
		isProcessing,
		onPaymentSuccess, 
		onPaymentError,
		onProcessingChange
	}: Props = $props();

	// Initialize payment hooks
	const stripePayment = useStripePayment();
	const revolutPayment = useRevolutPayment();

	// Payment container element for Stripe
	let stripeContainer: HTMLElement;

	// Initialize payment method when provider changes
	$effect(() => {
		if (paymentProvider === 'stripe' && !stripePayment.clientSecret && !stripePayment.isInitializing) {
			initializePayment();
		}
	});

	// Mount Stripe card element when container is ready
	$effect(() => {
		if (stripeContainer && stripePayment.elements && !stripePayment.cardElementMounted) {
			stripePayment.mountCardElement(stripeContainer);
		}
	});

	// Cleanup on destroy
	onDestroy(() => {
		stripePayment.cleanup();
	});

	async function initializePayment() {
		if (paymentProvider === 'stripe') {
			const paymentData = {
				listing,
				shippingAddress,
				totalAmount
			};
			await stripePayment.initializeStripePayment(paymentData);
		}
	}

	async function processPayment() {
		if (isProcessing) return;

		onProcessingChange(true);

		try {
			if (paymentProvider === 'stripe') {
				await processStripePayment();
			} else if (paymentProvider === 'revolut_manual') {
				await processRevolutPayment();
			}
		} catch (error) {
			logger.error('❌ Payment processing failed:', error);
			const errorMessage = error instanceof Error ? error.message : 'Payment failed';
			onPaymentError(errorMessage);
		} finally {
			onProcessingChange(false);
		}
	}

	async function processStripePayment() {
		const paymentData = {
			listing,
			shippingAddress,
			totalAmount
		};

		const result = await stripePayment.processStripePayment(paymentData);
		
		if (result.success) {
			onPaymentSuccess({
				success: true,
				payment_intent_id: stripePayment.clientSecret
			});
		} else {
			onPaymentError(result.error || 'Stripe payment failed');
		}
	}

	async function processRevolutPayment() {
		const paymentData = {
			listing,
			shippingAddress,
			totalAmount
		};

		const result = await revolutPayment.createManualPayment(paymentData);
		
		if (result.success) {
			// For manual payments, we don't immediately call onPaymentSuccess
			// The user needs to complete the payment manually first
			logger.debug('✅ Manual payment instructions displayed');
		} else {
			onPaymentError(result.error || 'Failed to create manual payment');
		}
	}

	async function confirmManualPayment() {
		onProcessingChange(true);

		try {
			const result = await revolutPayment.confirmManualPayment();
			
			if (result.success) {
				onPaymentSuccess({
					success: true,
					order_id: revolutPayment.revolutOrderId
				});
			} else {
				onPaymentError(result.error || 'Failed to confirm payment');
			}
		} catch (error) {
			logger.error('❌ Manual payment confirmation failed:', error);
			onPaymentError('Failed to confirm payment');
		} finally {
			onProcessingChange(false);
		}
	}

	function openRevolutLink() {
		revolutPayment.openRevolutLink();
	}

	// Validation for payment processing
	function canProcessPayment(): boolean {
		if (paymentProvider === 'stripe') {
			return stripePayment.cardElementMounted && !!stripePayment.clientSecret;
		} else if (paymentProvider === 'revolut_manual') {
			return true; // Manual payments can always be initiated
		}
		return false;
	}

	function getPaymentButtonText(): string {
		if (isProcessing) {
			return paymentProvider === 'stripe' 
				? m.processing_payment() 
				: m.creating_payment();
		}
		
		return paymentProvider === 'stripe' 
			? m.pay_now() 
			: m.create_payment_request();
	}
</script>

<!-- Payment Processor Container -->
<div class="space-y-6">
	<!-- Stripe Payment Form -->
	{#if paymentProvider === 'stripe'}
		<div class="space-y-4">
			<div class="flex items-center space-x-2">
				<CreditCard class="h-5 w-5 text-brand-500" />
				<h3 class="text-lg font-semibold text-gray-900">{m.card_details()}</h3>
			</div>

			<!-- Stripe Initialization Status -->
			{#if stripePayment.isInitializing}
				<div class="flex items-center justify-center py-8">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
					<span class="ml-3 text-sm text-gray-600">{m.loading_payment_form()}</span>
				</div>
			{:else if stripePayment.clientSecret}
				<!-- Stripe Card Element Container -->
				<div class="border border-gray-300 rounded-lg p-4 bg-white">
					<div bind:this={stripeContainer} class="stripe-card-element"></div>
				</div>

				<!-- Stripe Processing Status -->
				{#if !stripePayment.cardElementMounted}
					<div class="flex items-center justify-center py-4">
						<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500"></div>
						<span class="ml-2 text-sm text-gray-600">{m.loading_card_form()}</span>
					</div>
				{/if}
			{:else}
				<!-- Stripe Initialization Failed -->
				<div class="bg-red-50 border border-red-200 rounded-lg p-4">
					<p class="text-sm text-red-700">{m.payment_form_load_error()}</p>
					<button
						onclick={initializePayment}
						class="mt-2 text-sm text-red-600 hover:text-red-800 underline"
					>
						{m.try_again()}
					</button>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Revolut Manual Payment Instructions -->
	{#if paymentProvider === 'revolut_manual' && revolutPayment.showPaymentInstructions && revolutPayment.manualPaymentData}
		<PaymentInstructions
			manualPaymentData={revolutPayment.manualPaymentData}
			onConfirmPayment={confirmManualPayment}
			onOpenRevolutLink={openRevolutLink}
			isProcessing={isProcessing}
			isExpired={revolutPayment.isPaymentExpired()}
		/>
	{/if}

	<!-- Payment Action Button -->
	{#if paymentProvider === 'stripe' || (paymentProvider === 'revolut_manual' && !revolutPayment.showPaymentInstructions)}
		<button
			onclick={processPayment}
			disabled={isProcessing || !canProcessPayment()}
			class="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
		>
			{#if isProcessing}
				<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
			{/if}
			{getPaymentButtonText()}
		</button>
	{/if}

	<!-- Payment Security Notice -->
	<div class="text-center">
		<p class="text-xs text-gray-500">
			{#if paymentProvider === 'stripe'}
				{m.stripe_security_notice()}
			{:else}
				{m.revolut_security_notice()}
			{/if}
		</p>
	</div>
</div>

<style>
	/* Custom styling for Stripe elements */
	.stripe-card-element {
		min-height: 40px;
	}

	/* Loading spinner animation */
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.animate-spin {
		animation: spin 1s linear infinite;
	}

	/* Payment button hover effects */
	button:not(:disabled):hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	button:disabled {
		transform: none;
		box-shadow: none;
	}
</style>