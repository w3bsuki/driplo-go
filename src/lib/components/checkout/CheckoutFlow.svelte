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
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-[var(--spacing-4)]" transition:fade={{ duration: 200 }}>
		<div class="bg-[var(--color-surface-primary)] rounded-[var(--border-radius-2xl)] max-w-lg w-full max-h-[90vh] overflow-hidden" transition:scale={{ duration: 200 }}>
			<!-- Header -->
			<div class="bg-[var(--color-surface-primary)] border-b border-[var(--color-border-primary)] p-[var(--spacing-6)] flex items-center justify-between">
				<div class="flex items-center gap-[var(--spacing-4)]">
					<h2 class="text-[var(--font-size-xl)] font-bold text-[var(--color-text-primary)]">
						{#if currentStep === 1}
							{m.checkout_order_summary()}
						{:else if currentStep === 2}
							{m.checkout_payment_details()}
						{:else}
							{m.checkout_order_complete()}
						{/if}
					</h2>
					<!-- Step indicator -->
					<div class="flex items-center gap-[var(--spacing-2)]">
						{#each [1, 2, 3] as step}
							<div class="flex items-center">
								<div class={`w-8 h-8 rounded-full flex items-center justify-center text-[var(--font-size-sm)] font-medium transition-colors ${
									step <= currentStep ? 'bg-[var(--color-brand-500)] text-[var(--color-white)]' : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)]'
								}`}>
									{step}
								</div>
								{#if step < 3}
									<ChevronRight class="w-4 h-4 text-[var(--color-text-tertiary)] mx-[var(--spacing-1)]" />
								{/if}
							</div>
						{/each}
					</div>
				</div>
				<button
					onclick={handleClose}
					class="p-[var(--spacing-2)] hover:bg-[var(--color-surface-hover)] rounded-full transition-colors"
				>
					<X class="w-5 h-5 text-[var(--color-text-tertiary)]" />
				</button>
			</div>

			<!-- Content -->
			<div class="overflow-y-auto relative max-h-[calc(90vh-200px)]">
				{#if isProcessing}
					<Spinner overlay text="Processing payment..." />
				{/if}
				
				{#if currentStep === 1}
					<!-- Step 1: Order Summary & Shipping -->
					<div class="p-[var(--spacing-6)]" transition:slide>
						<!-- Product Details -->
						<div class="mb-[var(--spacing-6)]">
							<h3 class="text-[var(--font-size-lg)] font-semibold text-[var(--color-text-primary)] mb-[var(--spacing-4)]">Item Details</h3>
							<div class="bg-[var(--color-surface-secondary)] rounded-[var(--border-radius-xl)] p-[var(--spacing-4)]">
								<div class="flex gap-[var(--spacing-4)]">
									<img
										src={listing.images[0]}
										alt={listing.title}
										class="w-20 h-20 object-cover rounded-[var(--border-radius-lg)]"
									/>
									<div class="flex-1">
										<h4 class="font-semibold text-[var(--color-text-primary)]">{listing.title}</h4>
										<p class="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mt-[var(--spacing-1)]">Size: {listing.size || 'N/A'}</p>
										<p class="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">Condition: {listing.condition}</p>
										<p class="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">Seller: {listing.seller?.username || 'Unknown'}</p>
									</div>
								</div>
							</div>
						</div>

						<!-- Shipping Address -->
						<div class="mb-[var(--spacing-6)]">
							<h3 class="text-[var(--font-size-lg)] font-semibold text-[var(--color-text-primary)] mb-[var(--spacing-4)] flex items-center gap-[var(--spacing-2)]">
								<Truck class="w-5 h-5" />
								Shipping Address
							</h3>
							<div class="space-y-[var(--spacing-4)]">
								<input
									bind:value={shippingAddress.name}
									placeholder="Full Name"
									class="w-full px-[var(--spacing-4)] py-[var(--spacing-3)] border border-[var(--color-border-primary)] rounded-[var(--border-radius-lg)] focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-[var(--color-brand-500)]"
									required
								/>
								<input
									bind:value={shippingAddress.address_line1}
									placeholder="Address Line 1"
									class="w-full px-[var(--spacing-4)] py-[var(--spacing-3)] border border-[var(--color-border-primary)] rounded-[var(--border-radius-lg)] focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-[var(--color-brand-500)]"
									required
								/>
								<input
									bind:value={shippingAddress.address_line2}
									placeholder="Address Line 2 (Optional)"
									class="w-full px-[var(--spacing-4)] py-[var(--spacing-3)] border border-[var(--color-border-primary)] rounded-[var(--border-radius-lg)] focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-[var(--color-brand-500)]"
								/>
								<div class="grid grid-cols-2 gap-[var(--spacing-4)]">
									<input
										bind:value={shippingAddress.city}
										placeholder="City"
										class="w-full px-[var(--spacing-4)] py-[var(--spacing-3)] border border-[var(--color-border-primary)] rounded-[var(--border-radius-lg)] focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-[var(--color-brand-500)]"
										required
									/>
									<input
										bind:value={shippingAddress.state}
										placeholder="State/Province"
										class="w-full px-[var(--spacing-4)] py-[var(--spacing-3)] border border-[var(--color-border-primary)] rounded-[var(--border-radius-lg)] focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-[var(--color-brand-500)]"
										required
									/>
								</div>
								<input
									bind:value={shippingAddress.postal_code}
									placeholder="Postal Code"
									class="w-full px-[var(--spacing-4)] py-[var(--spacing-3)] border border-[var(--color-border-primary)] rounded-[var(--border-radius-lg)] focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-[var(--color-brand-500)]"
									required
								/>
							</div>
						</div>

						<!-- Price Breakdown -->
						<div class="bg-[var(--color-brand-50)] rounded-[var(--border-radius-xl)] p-[var(--spacing-4)]">
							<div class="space-y-[var(--spacing-2)]">
								<div class="flex justify-between text-[var(--font-size-sm)]">
									<span>Item Price</span>
									<span class="font-medium">{formatCurrency(itemPrice)}</span>
								</div>
								<div class="flex justify-between text-[var(--font-size-sm)]">
									<span>Shipping</span>
									<span class="font-medium">{shippingCost > 0 ? formatCurrency(shippingCost) : 'Free'}</span>
								</div>
								<div class="flex justify-between text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
									<span>Buyer Protection (5% + $1)</span>
									<span>{formatCurrency(buyerFee)}</span>
								</div>
								<div class="border-t border-[var(--color-brand-100)] pt-[var(--spacing-2)] mt-[var(--spacing-2)]">
									<div class="flex justify-between font-semibold text-[var(--font-size-lg)]">
										<span>Total</span>
										<span class="text-[var(--color-brand-600)]">{formatCurrency(totalAmount)}</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				{:else if currentStep === 2}
					<!-- Step 2: Payment -->
					<div class="p-[var(--spacing-6)]" transition:slide>
						<h3 class="text-[var(--font-size-lg)] font-semibold text-[var(--color-text-primary)] mb-[var(--spacing-4)] flex items-center gap-[var(--spacing-2)]">
							<CreditCard class="w-5 h-5" />
							Payment Method
						</h3>

						<!-- Payment Method Selection -->
						<div class="space-y-[var(--spacing-3)] mb-[var(--spacing-6)]">
							<label class="flex items-center p-[var(--spacing-4)] border rounded-[var(--border-radius-lg)] cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors {paymentProvider === 'stripe' ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)]' : 'border-[var(--color-border-primary)]'}">
								<input
									type="radio"
									value="stripe"
									bind:group={paymentProvider}
									class="text-[var(--color-brand-500)]"
								/>
								<div class="ml-[var(--spacing-3)] flex-1">
									<p class="font-medium">Credit/Debit Card</p>
									<p class="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">Secure payment via Stripe</p>
								</div>
								<Lock class="w-4 h-4 text-[var(--color-text-tertiary)]" />
							</label>
							
							<label class="flex items-center p-[var(--spacing-4)] border rounded-[var(--border-radius-lg)] cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors {paymentProvider === 'revolut_manual' ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)]' : 'border-[var(--color-border-primary)]'}">
								<input
									type="radio"
									value="revolut_manual"
									bind:group={paymentProvider}
									class="text-[var(--color-brand-500)]"
									disabled
								/>
								<div class="ml-[var(--spacing-3)] flex-1">
									<p class="font-medium">Revolut Transfer</p>
									<p class="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">Manual payment (temporarily disabled)</p>
								</div>
							</label>
						</div>

						{#if paymentProvider === 'stripe'}
							<!-- Card Details -->
							<div class="mb-[var(--spacing-6)]">
								<label class="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-primary)] mb-[var(--spacing-2)]">
									Card Information
								</label>
								<div id="card-element-new" class="p-[var(--spacing-4)] border border-[var(--color-border-primary)] rounded-[var(--border-radius-lg)]"></div>
							</div>
						{/if}

						<!-- Order Summary (Compact) -->
						<div class="bg-[var(--color-surface-secondary)] rounded-[var(--border-radius-lg)] p-[var(--spacing-4)] mb-[var(--spacing-6)]">
							<div class="flex justify-between items-center">
								<div class="flex items-center gap-[var(--spacing-3)]">
									<img
										src={listing.images[0]}
										alt={listing.title}
										class="w-12 h-12 object-cover rounded-[var(--border-radius-sm)]"
									/>
									<div>
										<p class="font-medium text-[var(--font-size-sm)]">{listing.title}</p>
										<p class="text-[var(--font-size-xs)] text-[var(--color-text-secondary)]">Total: {formatCurrency(totalAmount)}</p>
									</div>
								</div>
							</div>
						</div>

						<!-- Security Notice -->
						<div class="flex items-center gap-[var(--spacing-2)] text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
							<Lock class="w-4 h-4" />
							<p>Your payment information is secure and encrypted</p>
						</div>
					</div>
				{:else}
					<!-- Step 3: Order Complete -->
					<div class="p-[var(--spacing-6)] text-center" transition:slide>
						<div class="mb-[var(--spacing-6)]">
							<div class="w-20 h-20 bg-[var(--color-success-50)] rounded-full flex items-center justify-center mx-auto mb-[var(--spacing-4)]">
								<Check class="w-10 h-10 text-[var(--color-success-600)]" />
							</div>
							<h3 class="text-[var(--font-size-2xl)] font-bold text-[var(--color-text-primary)] mb-[var(--spacing-2)]">Order Successful!</h3>
							<p class="text-[var(--color-text-secondary)]">Your order has been placed successfully.</p>
						</div>

						{#if orderData}
							<div class="bg-[var(--color-surface-secondary)] rounded-[var(--border-radius-lg)] p-[var(--spacing-4)] text-left mb-[var(--spacing-6)]">
								<p class="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mb-[var(--spacing-1)]">Order ID</p>
								<p class="font-mono text-[var(--font-size-sm)]">{orderData.orderId}</p>
								<p class="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mt-[var(--spacing-3)] mb-[var(--spacing-1)]">Total Amount</p>
								<p class="font-semibold">{formatCurrency(orderData.amount)}</p>
							</div>

							{#if orderData.paymentInstructions}
								<div class="bg-[var(--color-info-50)] rounded-[var(--border-radius-lg)] p-[var(--spacing-4)] text-left">
									<p class="font-medium text-[var(--color-info-600)] mb-[var(--spacing-2)]">Payment Instructions</p>
									<p class="text-[var(--font-size-sm)] text-[var(--color-info-600)]/80">{orderData.paymentInstructions}</p>
								</div>
							{/if}
						{/if}

						<p class="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mt-[var(--spacing-6)]">
							Redirecting to your orders in 3 seconds...
						</p>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="border-t border-[var(--color-border-primary)] p-[var(--spacing-6)] bg-[var(--color-surface-secondary)]">
				<div class="flex items-center justify-between">
					{#if currentStep > 1 && currentStep < 3}
						<button
							onclick={handlePreviousStep}
							class="flex items-center gap-[var(--spacing-2)] px-[var(--spacing-4)] py-[var(--spacing-2)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
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
							class="px-[var(--spacing-6)] py-[var(--spacing-3)] bg-[var(--color-brand-500)] text-[var(--color-white)] rounded-[var(--border-radius-lg)] font-medium hover:bg-[var(--color-brand-600)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-[var(--spacing-2)]"
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
							class="px-[var(--spacing-6)] py-[var(--spacing-3)] bg-[var(--color-brand-500)] text-[var(--color-white)] rounded-[var(--border-radius-lg)] font-medium hover:bg-[var(--color-brand-600)] transition-colors"
						>
							View Orders
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}