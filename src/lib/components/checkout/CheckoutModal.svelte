<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { formatCurrency } from '$lib/utils/currency';
	import { X, CreditCard, Lock, Truck, Smartphone, Check, ExternalLink } from 'lucide-svelte';
	import { fade, scale } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { getStripe } from '$lib/stores/stripe';
	import * as m from '$lib/paraglide/messages.js';
	import { logger } from '$lib/services/logger';

	interface Props {
		listing: any;
		isOpen: boolean;
		onClose: () => void;
	}

	let { listing, isOpen, onClose }: Props = $props();

	let elements: any;
	let cardElement: any;
	let isProcessing = $state(false);
	let clientSecret = $state('');
	let paymentProvider = $state<'stripe' | 'revolut_manual'>('stripe'); // Default to Stripe
	let isInitializing = $state(false);
	let cardElementMounted = $state(false);
	let revolutOrderId = $state('');
	let manualPaymentData = $state(null);
	let showPaymentInstructions = $state(false);
	let shippingAddress = $state({
		name: '',
		address_line1: '',
		address_line2: '',
		city: '',
		state: '',
		postal_code: '',
		country: 'BG'
	});

	let totalAmount = $derived(listing ? listing.price + (listing.shipping_cost || 0) : 0);

	// Initialize Stripe when modal opens and Stripe is selected  
	$effect(() => {
		if (isOpen && paymentProvider === 'stripe' && !clientSecret && !isInitializing) {
			logger.debug('🔄 Triggering Stripe initialization...', { isOpen, paymentProvider, clientSecret: !!clientSecret, isInitializing });
			initializeStripePayment();
		}
	});

	// Remove the complex mounting effect - it's causing issues

	async function handleProviderChange(provider: 'stripe' | 'revolut_manual') {
		// Don't reset state if switching to the same provider
		if (paymentProvider === provider) return;
		
		paymentProvider = provider;
		
		// Only reset clientSecret if switching away from Stripe
		if (provider !== 'stripe') {
			clientSecret = '';
		}
		
		revolutOrderId = '';
		manualPaymentData = null;
		showPaymentInstructions = false;
		
		// Clean up existing Stripe elements only if switching away from Stripe
		if (provider !== 'stripe' && cardElement) {
			try {
				logger.debug('🧹 Destroying existing card element...');
				cardElement.destroy();
				logger.debug('✅ Card element destroyed successfully');
			} catch (error) {
				logger.error('❌ Error destroying card element:', error);
			}
			cardElement = null;
			cardElementMounted = false;
		}
		if (provider !== 'stripe' && elements) {
			elements = null;
		}
		
		// Clear the card element container only if switching away from Stripe
		if (provider !== 'stripe') {
			const element = document.getElementById('card-element');
			if (element) {
				// Safely clear the element content
				while (element.firstChild) {
					element.removeChild(element.firstChild);
				}
			}
		}
		
		// Don't manually initialize here - let the effect handle it
	}

	async function initializeStripePayment() {
		if (isInitializing) return;
		
		try {
			isInitializing = true;
			logger.debug('🔄 Initializing Stripe payment...');
			
			// Create payment intent
			const response = await fetch('/api/payment/create-intent', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'same-origin',
				body: JSON.stringify({
					listing_id: listing.id,
					shipping_address: shippingAddress,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				logger.error('❌ Payment intent failed:', data);
				toast.error(data.error || m.checkout_failed_initialize());
				return;
			}

			clientSecret = data.data?.client_secret || data.client_secret;
			logger.debug('✅ Payment intent created successfully', { clientSecret, fullResponse: data });

			// Initialize Stripe Elements
			const stripeInstance = await getStripe();
			if (!stripeInstance) {
				logger.error('❌ Failed to load Stripe instance');
				toast.error(m.checkout_failed_load_payment());
				return;
			}

			logger.debug('✅ Stripe instance loaded successfully');

			elements = stripeInstance.elements({
				clientSecret: clientSecret,
				appearance: {
					theme: 'stripe',
					variables: {
						colorPrimary: '#60a5fa',
						colorBackground: '#ffffff',
						colorText: '#1f2937',
						borderRadius: '8px',
					},
				},
			});

			logger.debug('✅ Stripe Elements created successfully');

			// Create card element
			cardElement = elements.create('card', {
				hidePostalCode: false,
				style: {
					base: {
						fontSize: '16px',
						color: '#1f2937',
						fontFamily: 'system-ui, sans-serif',
						'::placeholder': {
							color: '#9ca3af',
						},
					},
				},
			});

			logger.debug('✅ Card element created successfully');
			
			// Add event listeners for better debugging
			cardElement.on('ready', () => {
				logger.debug('✅ Card element ready for input');
			});

			cardElement.on('change', (event) => {
				if (event.error) {
					logger.warn('⚠️ Card element error:', event.error.message);
				} else {
					logger.debug('✅ Card element input valid');
				}
			});

			// Mount immediately - simple and direct
			setTimeout(() => {
				const container = document.getElementById('card-element');
				if (container && cardElement) {
					// Safely clear the container content
					while (container.firstChild) {
						container.removeChild(container.firstChild);
					}
					cardElement.mount('#card-element');
					cardElementMounted = true;
					logger.debug('✅ Card element mounted successfully');
				}
			}, 100);

		} catch (error) {
			logger.error('❌ Payment initialization error:', error);
			toast.error(m.checkout_failed_initialize());
		} finally {
			isInitializing = false;
		}
	}

	async function handleSubmit() {
		if (isProcessing) return;

		if (paymentProvider === 'stripe') {
			await handleStripePayment();
		} else if (paymentProvider === 'revolut') {
			await handleRevolutPayment();
		} else if (paymentProvider === 'revolut_manual') {
			await handleManualRevolutPayment();
		}
	}

	async function handleStripePayment() {
		if (!cardElement || !clientSecret) {
			logger.error('❌ Missing required elements:', { cardElement: !!cardElement, clientSecret: !!clientSecret });
			toast.error('Payment system not ready. Please try again.');
			return;
		}

		// Verify card element is still mounted
		const cardContainer = document.getElementById('card-element');
		if (!cardContainer || !cardContainer.querySelector('iframe')) {
			logger.error('❌ Card element not properly mounted');
			toast.error('Payment form not ready. Please refresh and try again.');
			cardElementMounted = false;
			return;
		}

		isProcessing = true;

		try {
			const stripeInstance = await getStripe();
			if (!stripeInstance) {
				toast.error(m.checkout_payment_processor_unavailable());
				return;
			}

			logger.debug('🔄 Confirming payment with Stripe...');
			// Confirm payment
			const { error } = await stripeInstance.confirmCardPayment(clientSecret, {
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
							country: shippingAddress.country,
						},
					},
				},
			});

			if (error) {
				toast.error(error.message || m.checkout_payment_failed());
			} else {
				toast.success(m.checkout_payment_successful());
				onClose();
				window.location.href = '/orders';
			}
		} catch (error) {
			logger.error('Payment error:', error);
			toast.error(m.checkout_payment_failed());
		} finally {
			isProcessing = false;
		}
	}

	async function handleRevolutPayment() {
		isProcessing = true;

		try {
			// Create Revolut order if not already created
			if (!revolutOrderId) {
				const orderResponse = await fetch('/api/payment/revolut/create-order', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'same-origin',
					body: JSON.stringify({
						listing_id: listing.id,
						shipping_address: shippingAddress,
					}),
				});

				const orderData = await orderResponse.json();

				if (!orderResponse.ok) {
					toast.error(orderData.error || m.checkout_failed_create_order());
					return;
				}

				revolutOrderId = orderData.order_id;
			}

			// Process payment with Revolut
			const paymentResponse = await fetch('/api/payment/revolut/process-payment', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'same-origin',
				body: JSON.stringify({
					order_id: revolutOrderId,
					payment_method: {
						type: 'revolut_pay',
						revolut_pay: {
							email: shippingAddress.name, // You might want to collect email separately
						},
					},
					billing_address: {
						country_code: shippingAddress.country,
						region: shippingAddress.state,
						city: shippingAddress.city,
						postcode: shippingAddress.postal_code,
						street_line_1: shippingAddress.address_line1,
						street_line_2: shippingAddress.address_line2,
					},
				}),
			});

			const paymentData = await paymentResponse.json();

			if (!paymentResponse.ok) {
				toast.error(paymentData.error || m.checkout_payment_failed());
				return;
			}

			// Redirect to Revolut Pay if redirect URL is provided
			if (paymentData.redirect_url) {
				window.location.href = paymentData.redirect_url;
			} else {
				toast.success(m.checkout_payment_successful());
				onClose();
				window.location.href = '/orders';
			}
		} catch (error) {
			logger.error('Revolut payment error:', error);
			toast.error(m.checkout_payment_failed());
		} finally {
			isProcessing = false;
		}
	}

	async function handleManualRevolutPayment() {
		isProcessing = true;
		logger.debug('🔥 Starting manual Revolut payment for listing:', listing.id);

		try {
			const response = await fetch('/api/payment/revolut/manual-payment', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'same-origin',
				body: JSON.stringify({
					listing_id: listing.id,
					shipping_address: shippingAddress,
				}),
			});

			logger.debug('📡 Response status:', response.status);
			const data = await response.json();
			logger.debug('📋 Response data:', data);

			if (!response.ok) {
				logger.error('❌ API Error:', data);
				toast.error(data.error || m.checkout_failed_create_order());
				return;
			}

			logger.debug('✅ Payment order created successfully');
			manualPaymentData = data;
			showPaymentInstructions = true;
			logger.debug('🎯 UI state updated - showPaymentInstructions:', showPaymentInstructions);
			
		} catch (error) {
			logger.error('💥 Manual Revolut payment error:', error);
			toast.error(m.checkout_failed_create_order());
		} finally {
			isProcessing = false;
		}
	}

	function handleOpenRevolutPaymentLink() {
		if (!manualPaymentData) return;
		
		// Create Revolut payment link with pre-filled amount and reference
		const amount = manualPaymentData.total_amount;
		const reference = manualPaymentData.order_reference;
		const revolutUrl = `https://revolut.me/tin1017?amount=${amount}&reference=${encodeURIComponent(reference)}&currency=USD`;
		
		logger.debug('🔗 Opening Revolut payment link:', revolutUrl);
		
		// Open in new tab so user doesn't lose checkout page
		window.open(revolutUrl, '_blank');
	}

	async function confirmManualPayment() {
		if (!manualPaymentData) return;

		isProcessing = true;

		try {
			const response = await fetch('/api/payment/revolut/manual-payment', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'same-origin',
				body: JSON.stringify({
					transaction_id: manualPaymentData.transaction_id,
					proof_of_payment: 'manual_confirmation', // In a real app, you'd collect screenshot/receipt
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				toast.error(data.error || m.checkout_failed_confirm_payment());
				return;
			}

			toast.success(m.checkout_payment_submitted());
			onClose();
			window.location.href = '/orders';
			
		} catch (error) {
			logger.error('Payment confirmation error:', error);
			toast.error(m.checkout_failed_confirm_payment());
		} finally {
			isProcessing = false;
		}
	}

	function handleClose() {
		onClose();
		clientSecret = '';
		if (cardElement) {
			try {
				logger.debug('🧹 Cleaning up card element on close...');
				cardElement.destroy();
				logger.debug('✅ Card element destroyed successfully on close');
			} catch (error) {
				logger.error('❌ Error destroying card element on close:', error);
			}
			cardElement = null;
			cardElementMounted = false;
		}
		if (elements) {
			elements = null;
		}
		
		// Clear the card element container
		const element = document.getElementById('card-element');
		if (element) {
			// Safely clear the element content
			while (element.firstChild) {
				element.removeChild(element.firstChild);
			}
		}
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" transition:fade={{ duration: 200 }}>
		<div class="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" transition:scale={{ duration: 200 }}>
			<!-- Header -->
			<div class="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
				<h2 class="text-xl font-bold text-gray-900">{m.checkout_title()}</h2>
				<button
					onclick={handleClose}
					class="p-2 hover:bg-gray-100 rounded-full transition-colors"
				>
					<X class="w-5 h-5 text-gray-500" />
				</button>
			</div>

			<!-- Content -->
			<div class="p-6">
				<!-- Order Summary -->
				<div class="mb-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">{m.checkout_order_summary()}</h3>
					<div class="bg-gray-50 rounded-xl p-4">
						<div class="flex gap-4">
							<img
								src={listing.images[0]}
								alt={listing.title}
								class="w-16 h-16 object-cover rounded-lg"
							/>
							<div class="flex-1">
								<h4 class="font-semibold text-gray-900">{listing.title}</h4>
								<p class="text-sm text-gray-600">Size: {listing.size || m.checkout_size_na()}</p>
								<p class="text-sm text-gray-600">Condition: {listing.condition}</p>
							</div>
						</div>
						
						<div class="mt-4 border-t border-gray-200 pt-4">
							<div class="flex justify-between text-sm">
								<span>{m.checkout_item_price()}</span>
								<span>{formatCurrency(listing.price)}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span>{m.checkout_shipping()}</span>
								<span>{listing.shipping_cost > 0 ? formatCurrency(listing.shipping_cost) : m.checkout_free_shipping()}</span>
							</div>
							{#if manualPaymentData?.buyer_fee}
								<div class="flex justify-between text-sm text-gray-600 mt-2 pt-2 border-t border-gray-100">
									<span>{m.checkout_buyer_protection_fee()}</span>
									<span>{formatCurrency(manualPaymentData.buyer_fee)}</span>
								</div>
							{/if}
							<div class="flex justify-between font-semibold text-lg mt-2 pt-2 border-t border-gray-200">
								<span>{m.checkout_total()}</span>
								<span class="text-blue-400">{formatCurrency(manualPaymentData?.total_amount || totalAmount)}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Shipping Address -->
				<div class="mb-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
						<Truck class="w-5 h-5" />
						{m.checkout_shipping_address()}
					</h3>
					<div class="space-y-4">
						<input
							bind:value={shippingAddress.name}
							placeholder="{m.checkout_full_name()}"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
							required
						/>
						<input
							bind:value={shippingAddress.address_line1}
							placeholder="{m.checkout_address_line1()}"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
							required
						/>
						<input
							bind:value={shippingAddress.address_line2}
							placeholder="{m.checkout_address_line2()}"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
						/>
						<div class="grid grid-cols-2 gap-4">
							<input
								bind:value={shippingAddress.city}
								placeholder="{m.checkout_city()}"
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
								required
							/>
							<input
								bind:value={shippingAddress.state}
								placeholder="{m.checkout_state()}"
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
								required
							/>
						</div>
						<input
							bind:value={shippingAddress.postal_code}
							placeholder="{m.checkout_zip_code()}"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
							required
						/>
					</div>
				</div>

				<!-- Payment Provider Selection -->
				<div class="mb-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
						<CreditCard class="w-5 h-5" />
						{m.checkout_payment_method()}
					</h3>
					
					<!-- Payment Method Selection -->
					<div class="space-y-3 mb-6">
						<!-- Stripe Card Payment -->
						<button
							onclick={() => handleProviderChange('stripe')}
							class="w-full text-left border-2 rounded-lg p-4 transition-all {paymentProvider === 'stripe' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}"
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<CreditCard class="w-6 h-6 {paymentProvider === 'stripe' ? 'text-blue-600' : 'text-gray-600'}" />
									<div>
										<h4 class="font-semibold {paymentProvider === 'stripe' ? 'text-blue-900' : 'text-gray-900'}">{m.checkout_credit_card()}</h4>
										<p class="text-sm {paymentProvider === 'stripe' ? 'text-blue-600' : 'text-gray-600'}">{m.checkout_credit_card_desc()}</p>
									</div>
								</div>
								{#if paymentProvider === 'stripe'}
									<Check class="w-5 h-5 text-blue-600" />
								{/if}
							</div>
						</button>

						<!-- Manual Revolut Transfer -->
						<button
							onclick={() => handleProviderChange('revolut_manual')}
							class="w-full text-left border-2 rounded-lg p-4 transition-all {paymentProvider === 'revolut_manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}"
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
										<span class="text-white font-bold">R</span>
									</div>
									<div>
										<h4 class="font-semibold {paymentProvider === 'revolut_manual' ? 'text-blue-900' : 'text-gray-900'}">{m.checkout_revolut_transfer()}</h4>
										<p class="text-sm {paymentProvider === 'revolut_manual' ? 'text-blue-600' : 'text-gray-600'}">{m.checkout_revolut_transfer_desc()}</p>
									</div>
								</div>
								{#if paymentProvider === 'revolut_manual'}
									<Check class="w-5 h-5 text-blue-600" />
								{/if}
							</div>
						</button>
					</div>

					<!-- Payment Provider Content -->
					{#if paymentProvider === 'stripe'}
						<!-- Stripe Card Payment Form -->
						<div class="border border-gray-200 rounded-lg p-4">
							<div id="card-element" class="p-3 border border-gray-300 rounded-md min-h-[50px]"></div>
							{#if clientSecret}
								<p class="text-sm text-green-600 mt-2 flex items-center gap-2">
									<Lock class="w-4 h-4" />
									{m.checkout_secure_payment()}
								</p>
							{/if}
						</div>
					{:else if paymentProvider === 'revolut_manual'}
						{#if !showPaymentInstructions}
							<div class="border border-gray-300 rounded-lg p-4">
								<div class="flex items-center gap-3 mb-4">
									<div class="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
										<span class="text-white font-bold text-lg">R</span>
									</div>
									<div>
										<h4 class="font-semibold text-gray-900">{m.checkout_revolut_transfer()}</h4>
										<p class="text-sm text-gray-600">{m.checkout_revolut_direct_transfer()}</p>
									</div>
								</div>
								<div class="bg-green-50 border border-green-200 rounded-lg p-3">
									<p class="text-sm text-green-700">
										{m.checkout_revolut_benefits()}
									</p>
								</div>
							</div>
						{:else}
							<!-- Payment Instructions -->
							<div class="border border-green-300 rounded-lg p-4 bg-green-50">
								<h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
									<div class="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
										<span class="text-white font-bold text-sm">R</span>
									</div>
									{m.checkout_revolut_instructions()}
								</h4>
								
								<div class="space-y-3 mb-4">
									<div class="bg-white rounded-lg p-3 border border-green-200">
										<p class="text-sm font-medium text-gray-700 mb-2">{m.checkout_send_exact_amount()}</p>
										<p class="text-2xl font-bold text-green-600">${manualPaymentData?.total_amount}</p>
									</div>
									
									<div class="bg-white rounded-lg p-3 border border-green-200">
										<p class="text-sm font-medium text-gray-700 mb-2">{m.checkout_to_driplo_account()}</p>
										<div class="space-y-1">
											<p class="font-mono text-sm"><strong>{m.checkout_revtag()}</strong> {manualPaymentData?.payment_instructions?.recipient_revtag}</p>
											<p class="font-mono text-sm"><strong>{m.checkout_phone()}</strong> {manualPaymentData?.payment_instructions?.recipient_phone}</p>
											<p class="font-mono text-sm"><strong>{m.checkout_name()}</strong> {manualPaymentData?.payment_instructions?.recipient_name}</p>
											<div class="flex items-center gap-1 text-blue-600 mt-2">
												<Check class="w-4 h-4" />
												<span class="text-sm font-medium">{m.checkout_driplo_platform()}</span>
											</div>
										</div>
									</div>
									
									<div class="bg-white rounded-lg p-3 border border-green-200">
										<p class="text-sm font-medium text-gray-700 mb-2">{m.checkout_include_reference()}</p>
										<p class="font-mono text-lg font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded border border-blue-200">
											{manualPaymentData?.order_reference}
										</p>
									</div>
								</div>
								
								<div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
									<p class="text-sm text-blue-800">
										{m.checkout_buyer_protection()}
									</p>
								</div>
								
								<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
									<p class="text-sm text-yellow-800">
										{m.checkout_important_reference()}
									</p>
								</div>
								
								<!-- Quick Pay Button -->
								<div class="mb-4">
									<button
										onclick={handleOpenRevolutPaymentLink}
										class="w-full bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
									>
										<div class="w-6 h-6 bg-white rounded-full flex items-center justify-center">
											<span class="text-black font-bold text-sm">R</span>
										</div>
										{m.checkout_pay_with_revolut({ amount: `$${manualPaymentData?.total_amount}` })}
										<ExternalLink class="w-4 h-4" />
									</button>
									<p class="text-xs text-gray-500 text-center mt-2">
										{m.checkout_revolut_prefilled()}
									</p>
								</div>
								
								<div class="relative mb-4">
									<div class="absolute inset-0 flex items-center">
										<div class="w-full border-t border-gray-300"></div>
									</div>
									<div class="relative flex justify-center text-sm">
										<span class="bg-white px-2 text-gray-500">{m.checkout_or_pay_manually()}</span>
									</div>
								</div>
								
								<button
									onclick={handleConfirmManualPayment}
									disabled={isProcessing}
									class="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
								>
									{isProcessing ? m.checkout_confirming() : m.checkout_payment_sent()}
								</button>
							</div>
						{/if}
					{/if}

				</div>

				<!-- Security Notice -->
				<div class="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
					<div class="flex items-center gap-2 text-green-700">
						<Lock class="w-5 h-5" />
						<span class="text-sm font-medium">{m.checkout_payment_secure()}</span>
					</div>
				</div>

				<!-- Submit Button -->
				{#if !showPaymentInstructions}
					<button
						onclick={handleSubmit}
						disabled={isProcessing}
						class="w-full bg-blue-400 text-white py-4 rounded-xl font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{#if isProcessing}
							{m.checkout_processing()}
						{:else if paymentProvider === 'stripe'}
							{m.checkout_pay_now({ amount: formatCurrency(totalAmount) })}
						{:else}
							{m.checkout_get_revolut_instructions({ amount: formatCurrency(manualPaymentData?.total_amount || totalAmount) })}
						{/if}
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}