<script lang="ts">
	import { onMount } from 'svelte';
	import { formatCurrency } from '$lib/utils/currency';
	import { X, CreditCard, Lock, Truck, Check, ChevronRight, ChevronLeft } from 'lucide-svelte';
	import { fade, scale, slide } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { getStripe } from '$lib/stores/stripe';
	import * as m from '$lib/paraglide/messages.js';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	interface Props {
		listing: any;
		isOpen: boolean;
		onClose: () => void;
	}

	let { listing, isOpen, onClose }: Props = $props();

	// Multi-step state
	let currentStep = $state(1); // 1: Order Summary, 2: Payment, 3: Completion
	let isProcessing = $state(false);
	
	// Stripe elements
	let elements: any;
	let cardElement: any;
	let clientSecret = $state('');
	
	// Form data
	let shippingAddress = $state({
		name: '',
		address_line1: '',
		address_line2: '',
		city: '',
		state: '',
		postal_code: '',
		country: 'BG'
	});
	
	let paymentProvider = $state<'stripe' | 'revolut_manual'>('stripe');
	let orderData = $state<any>(null);
	
	// Calculated values
	let itemPrice = $derived(listing?.price || 0);
	let shippingCost = $derived(listing?.shipping_cost || 0);
	let buyerFee = $derived(itemPrice * 0.05 + 1); // 5% + $1
	let totalAmount = $derived(itemPrice + shippingCost + buyerFee);
	
	// Navigation functions
	function goToStep(step: number) {
		currentStep = step;
	}
	
	function handleNextStep() {
		if (currentStep === 1 && validateShipping()) {
			goToStep(2);
			initializePayment();
		} else if (currentStep === 2) {
			processPayment();
		}
	}
	
	function handlePreviousStep() {
		if (currentStep > 1) {
			goToStep(currentStep - 1);
		}
	}
	
	function validateShipping() {
		if (!shippingAddress.name.trim()) {
			toast.error('Please enter your full name');
			return false;
		}
		if (!shippingAddress.address_line1.trim()) {
			toast.error('Please enter your address');
			return false;
		}
		if (!shippingAddress.city.trim()) {
			toast.error('Please enter your city');
			return false;
		}
		if (!shippingAddress.postal_code.trim()) {
			toast.error('Please enter your postal code');
			return false;
		}
		return true;
	}
	
	async function initializePayment() {
		if (paymentProvider === 'stripe') {
			await initializeStripePayment();
		}
	}
	
	async function initializeStripePayment() {
		try {
			isProcessing = true;
			
			const response = await fetch('/api/payment/create-intent', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					listing_id: listing.id,
					shipping_address: shippingAddress
				})
			});
			
			let result;
			try {
				result = await response.json();
			} catch (e) {
				console.error('Failed to parse response:', e);
				throw new Error('Server error - invalid response');
			}
			
			if (!response.ok) {
				console.error('Payment error:', result);
				throw new Error(result.error || result.message || 'Failed to initialize payment');
			}
			
			clientSecret = result.data.client_secret;
			
			// Initialize Stripe Elements
			const stripe = await getStripe();
			if (!stripe) throw new Error('Stripe not loaded');
			
			elements = stripe.elements({ clientSecret });
			
			// Wait for next tick
			await new Promise(resolve => setTimeout(resolve, 100));
			
			// Create and mount card element
			const cardElementContainer = document.getElementById('card-element-new');
			if (cardElementContainer) {
				cardElement = elements.create('card', {
					style: {
						base: {
							fontSize: '16px',
							color: '#424770',
							'::placeholder': { color: '#aab7c4' }
						}
					}
				});
				cardElement.mount(cardElementContainer);
			}
		} catch (error) {
			console.error('Payment initialization error:', error);
			toast.error('Failed to initialize payment');
			goToStep(1);
		} finally {
			isProcessing = false;
		}
	}
	
	async function processPayment() {
		if (paymentProvider === 'stripe') {
			await processStripePayment();
		} else {
			await processManualPayment();
		}
	}
	
	async function processStripePayment() {
		if (!cardElement || !clientSecret) return;
		
		try {
			isProcessing = true;
			const stripe = await getStripe();
			if (!stripe) throw new Error('Stripe not loaded');
			
			const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
				payment_method: {
					card: cardElement,
					billing_details: {
						name: shippingAddress.name,
						address: {
							line1: shippingAddress.address_line1,
							line2: shippingAddress.address_line2,
							city: shippingAddress.city,
							state: shippingAddress.state,
							postal_code: shippingAddress.postal_code,
							country: shippingAddress.country
						}
					}
				}
			});
			
			if (error) {
				throw error;
			}
			
			// Payment successful
			orderData = {
				orderId: paymentIntent.id,
				amount: totalAmount,
				paymentMethod: 'card'
			};
			
			goToStep(3);
			toast.success('Payment successful!');
			
			// Redirect after delay
			setTimeout(() => {
				window.location.href = '/orders';
			}, 3000);
			
		} catch (error: any) {
			console.error('Payment error:', error);
			toast.error(error.message || 'Payment failed');
		} finally {
			isProcessing = false;
		}
	}
	
	async function processManualPayment() {
		try {
			isProcessing = true;
			
			const response = await fetch('/api/payment/revolut/manual-payment', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					listing_id: listing.id,
					shipping_address: shippingAddress
				})
			});
			
			const data = await response.json();
			
			if (!response.ok) {
				throw new Error(data.error || 'Failed to create order');
			}
			
			orderData = {
				orderId: data.order_id,
				amount: data.total_amount,
				paymentMethod: 'revolut_manual',
				paymentInstructions: data.payment_instructions
			};
			
			goToStep(3);
			
		} catch (error: any) {
			console.error('Manual payment error:', error);
			toast.error(error.message || 'Failed to create order');
		} finally {
			isProcessing = false;
		}
	}
	
	function handleClose() {
		// Cleanup
		if (cardElement) {
			cardElement.destroy();
			cardElement = null;
		}
		if (elements) {
			elements = null;
		}
		clientSecret = '';
		currentStep = 1;
		onClose();
	}
	
	// Cleanup on unmount
	$effect(() => {
		return () => {
			if (cardElement) {
				cardElement.destroy();
			}
		};
	});
</script>

{#if isOpen}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" transition:fade={{ duration: 200 }}>
		<div class="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden" transition:scale={{ duration: 200 }}>
			<!-- Header -->
			<div class="bg-white border-b border-gray-200 p-6 flex items-center justify-between">
				<div class="flex items-center gap-4">
					<h2 class="text-xl font-bold text-gray-900">
						{#if currentStep === 1}
							{m.checkout_order_summary()}
						{:else if currentStep === 2}
							{m.checkout_payment_details()}
						{:else}
							{m.checkout_order_complete()}
						{/if}
					</h2>
					<!-- Step indicator -->
					<div class="flex items-center gap-2">
						{#each [1, 2, 3] as step}
							<div class="flex items-center">
								<div class={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
									step <= currentStep ? 'bg-blue-400 text-white' : 'bg-gray-200 text-gray-500'
								}`}>
									{step}
								</div>
								{#if step < 3}
									<ChevronRight class="w-4 h-4 text-gray-400 mx-1" />
								{/if}
							</div>
						{/each}
					</div>
				</div>
				<button
					onclick={handleClose}
					class="p-2 hover:bg-gray-100 rounded-full transition-colors"
				>
					<X class="w-5 h-5 text-gray-500" />
				</button>
			</div>

			<!-- Content -->
			<div class="overflow-y-auto relative" style="max-height: calc(90vh - 200px);">
				{#if isProcessing}
					<Spinner overlay text="Processing payment..." />
				{/if}
				
				{#if currentStep === 1}
					<!-- Step 1: Order Summary & Shipping -->
					<div class="p-6" transition:slide>
						<!-- Product Details -->
						<div class="mb-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-4">Item Details</h3>
							<div class="bg-gray-50 rounded-xl p-4">
								<div class="flex gap-4">
									<img
										src={listing.images[0]}
										alt={listing.title}
										class="w-20 h-20 object-cover rounded-lg"
									/>
									<div class="flex-1">
										<h4 class="font-semibold text-gray-900">{listing.title}</h4>
										<p class="text-sm text-gray-600 mt-1">Size: {listing.size || 'N/A'}</p>
										<p class="text-sm text-gray-600">Condition: {listing.condition}</p>
										<p class="text-sm text-gray-600">Seller: {listing.seller?.username || 'Unknown'}</p>
									</div>
								</div>
							</div>
						</div>

						<!-- Shipping Address -->
						<div class="mb-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
								<Truck class="w-5 h-5" />
								Shipping Address
							</h3>
							<div class="space-y-4">
								<input
									bind:value={shippingAddress.name}
									placeholder="Full Name"
									class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
									required
								/>
								<input
									bind:value={shippingAddress.address_line1}
									placeholder="Address Line 1"
									class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
									required
								/>
								<input
									bind:value={shippingAddress.address_line2}
									placeholder="Address Line 2 (Optional)"
									class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
								/>
								<div class="grid grid-cols-2 gap-4">
									<input
										bind:value={shippingAddress.city}
										placeholder="City"
										class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
										required
									/>
									<input
										bind:value={shippingAddress.state}
										placeholder="State/Province"
										class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
										required
									/>
								</div>
								<input
									bind:value={shippingAddress.postal_code}
									placeholder="Postal Code"
									class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
									required
								/>
							</div>
						</div>

						<!-- Price Breakdown -->
						<div class="bg-blue-50 rounded-xl p-4">
							<div class="space-y-2">
								<div class="flex justify-between text-sm">
									<span>Item Price</span>
									<span class="font-medium">{formatCurrency(itemPrice)}</span>
								</div>
								<div class="flex justify-between text-sm">
									<span>Shipping</span>
									<span class="font-medium">{shippingCost > 0 ? formatCurrency(shippingCost) : 'Free'}</span>
								</div>
								<div class="flex justify-between text-sm text-gray-600">
									<span>Buyer Protection (5% + $1)</span>
									<span>{formatCurrency(buyerFee)}</span>
								</div>
								<div class="border-t border-blue-100 pt-2 mt-2">
									<div class="flex justify-between font-semibold text-lg">
										<span>Total</span>
										<span class="text-blue-600">{formatCurrency(totalAmount)}</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				{:else if currentStep === 2}
					<!-- Step 2: Payment -->
					<div class="p-6" transition:slide>
						<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
							<CreditCard class="w-5 h-5" />
							Payment Method
						</h3>

						<!-- Payment Method Selection -->
						<div class="space-y-3 mb-6">
							<label class="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors {paymentProvider === 'stripe' ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}">
								<input
									type="radio"
									value="stripe"
									bind:group={paymentProvider}
									class="text-blue-400"
								/>
								<div class="ml-3 flex-1">
									<p class="font-medium">Credit/Debit Card</p>
									<p class="text-sm text-gray-600">Secure payment via Stripe</p>
								</div>
								<Lock class="w-4 h-4 text-gray-400" />
							</label>
							
							<label class="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors {paymentProvider === 'revolut_manual' ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}">
								<input
									type="radio"
									value="revolut_manual"
									bind:group={paymentProvider}
									class="text-blue-400"
									disabled
								/>
								<div class="ml-3 flex-1">
									<p class="font-medium">Revolut Transfer</p>
									<p class="text-sm text-gray-600">Manual payment (temporarily disabled)</p>
								</div>
							</label>
						</div>

						{#if paymentProvider === 'stripe'}
							<!-- Card Details -->
							<div class="mb-6">
								<label class="block text-sm font-medium text-gray-700 mb-2">
									Card Information
								</label>
								<div id="card-element-new" class="p-4 border border-gray-300 rounded-lg"></div>
							</div>
						{/if}

						<!-- Order Summary (Compact) -->
						<div class="bg-gray-50 rounded-lg p-4 mb-6">
							<div class="flex justify-between items-center">
								<div class="flex items-center gap-3">
									<img
										src={listing.images[0]}
										alt={listing.title}
										class="w-12 h-12 object-cover rounded"
									/>
									<div>
										<p class="font-medium text-sm">{listing.title}</p>
										<p class="text-xs text-gray-600">Total: {formatCurrency(totalAmount)}</p>
									</div>
								</div>
							</div>
						</div>

						<!-- Security Notice -->
						<div class="flex items-center gap-2 text-sm text-gray-600">
							<Lock class="w-4 h-4" />
							<p>Your payment information is secure and encrypted</p>
						</div>
					</div>
				{:else}
					<!-- Step 3: Order Complete -->
					<div class="p-6 text-center" transition:slide>
						<div class="mb-6">
							<div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Check class="w-10 h-10 text-green-600" />
							</div>
							<h3 class="text-2xl font-bold text-gray-900 mb-2">Order Successful!</h3>
							<p class="text-gray-600">Your order has been placed successfully.</p>
						</div>

						{#if orderData}
							<div class="bg-gray-50 rounded-lg p-4 text-left mb-6">
								<p class="text-sm text-gray-600 mb-1">Order ID</p>
								<p class="font-mono text-sm">{orderData.orderId}</p>
								<p class="text-sm text-gray-600 mt-3 mb-1">Total Amount</p>
								<p class="font-semibold">{formatCurrency(orderData.amount)}</p>
							</div>

							{#if orderData.paymentInstructions}
								<div class="bg-blue-50 rounded-lg p-4 text-left">
									<p class="font-medium text-blue-900 mb-2">Payment Instructions</p>
									<p class="text-sm text-blue-800">{orderData.paymentInstructions}</p>
								</div>
							{/if}
						{/if}

						<p class="text-sm text-gray-600 mt-6">
							Redirecting to your orders in 3 seconds...
						</p>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="border-t border-gray-200 p-6 bg-gray-50">
				<div class="flex items-center justify-between">
					{#if currentStep > 1 && currentStep < 3}
						<button
							onclick={handlePreviousStep}
							class="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
							disabled={isProcessing}
						>
							<ChevronLeft class="w-4 h-4" />
							Back
						</button>
					{:else}
						<div></div>
					{/if}
					
					{#if currentStep < 3}
						<button
							onclick={handleNextStep}
							disabled={isProcessing}
							class="px-6 py-3 bg-blue-400 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
						>
							{#if isProcessing}
								<Spinner size="sm" color="white" />
							{:else if currentStep === 1}
								Continue to Payment
								<ChevronRight class="w-4 h-4" />
							{:else}
								Pay {formatCurrency(totalAmount)}
							{/if}
						</button>
					{:else}
						<button
							onclick={() => window.location.href = '/orders'}
							class="px-6 py-3 bg-blue-400 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors"
						>
							View Orders
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}