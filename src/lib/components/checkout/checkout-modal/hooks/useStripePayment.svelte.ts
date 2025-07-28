/**
 * Stripe Payment Management Hook
 * Handles Stripe initialization, card element lifecycle, and payment processing
 */

import { getStripe } from '$lib/stores/stripe';
import { logger } from '$lib/services/logger';
import { toast } from 'svelte-sonner';

interface StripePaymentState {
	clientSecret: string;
	cardElement: any;
	elements: any;
	isInitializing: boolean;
	cardElementMounted: boolean;
	stripe: any;
}

interface PaymentData {
	listing: any;
	shippingAddress: any;
	totalAmount: number;
}

export function useStripePayment() {
	// Stripe state
	let clientSecret = $state('');
	let cardElement = $state<any>(null);
	let elements = $state<any>(null);
	let isInitializing = $state(false);
	let cardElementMounted = $state(false);
	let stripe = $state<any>(null);

	// Initialize Stripe payment
	async function initializeStripePayment(paymentData: PaymentData) {
		if (isInitializing || clientSecret) {
			logger.debug('⏸️ Stripe initialization skipped - already in progress or completed');
			return;
		}

		try {
			isInitializing = true;
			logger.debug('🔄 Starting Stripe payment initialization...');

			// Create payment intent
			const response = await fetch('/api/payments/create-intent', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					amount: paymentData.totalAmount,
					listing_id: paymentData.listing?.id,
					shipping_address: paymentData.shippingAddress
				})
			});

			if (!response.ok) {
				throw new Error(`Failed to create payment intent: ${response.status}`);
			}

			const { client_secret } = await response.json();
			clientSecret = client_secret;

			logger.debug('✅ Payment intent created', { clientSecret: !!clientSecret });

			// Initialize Stripe elements
			await initializeStripeElements();

		} catch (error) {
			logger.error('❌ Failed to initialize Stripe payment:', error);
			toast.error('Failed to initialize payment. Please try again.');
		} finally {
			isInitializing = false;
		}
	}

	// Initialize Stripe elements
	async function initializeStripeElements() {
		try {
			stripe = await getStripe();
			if (!stripe) {
				throw new Error('Stripe not available');
			}

			elements = stripe.elements({
				clientSecret,
				appearance: {
					theme: 'stripe',
					variables: {
						colorPrimary: '#87ceeb',
						colorBackground: '#ffffff',
						colorText: '#1f2937',
						colorDanger: '#ef4444',
						borderRadius: '6px'
					}
				}
			});

			logger.debug('✅ Stripe elements initialized');
		} catch (error) {
			logger.error('❌ Failed to initialize Stripe elements:', error);
			toast.error('Failed to load payment form. Please refresh and try again.');
		}
	}

	// Mount card element
	function mountCardElement(container: HTMLElement) {
		if (!elements || cardElementMounted) {
			logger.debug('⏸️ Card element mount skipped - elements not ready or already mounted');
			return;
		}

		try {
			cardElement = elements.create('payment', {
				layout: 'tabs'
			});

			cardElement.mount(container);
			cardElementMounted = true;

			logger.debug('✅ Card element mounted');

			// Listen for changes in the card element
			cardElement.on('change', (event: any) => {
				if (event.error) {
					logger.debug('Card element error:', event.error);
				}
			});

		} catch (error) {
			logger.error('❌ Failed to mount card element:', error);
			toast.error('Failed to load payment form. Please refresh and try again.');
		}
	}

	// Unmount card element
	function unmountCardElement() {
		if (cardElement && cardElementMounted) {
			try {
				cardElement.unmount();
				cardElementMounted = false;
				logger.debug('✅ Card element unmounted');
			} catch (error) {
				logger.error('❌ Failed to unmount card element:', error);
			}
		}
	}

	// Process Stripe payment
	async function processStripePayment(paymentData: PaymentData): Promise<{ success: boolean; error?: string }> {
		if (!stripe || !elements || !clientSecret) {
			const error = 'Payment system not properly initialized';
			logger.error('❌ Payment processing failed:', error);
			return { success: false, error };
		}

		try {
			logger.debug('🔄 Processing Stripe payment...');

			const { error: submitError } = await elements.submit();
			if (submitError) {
				logger.error('❌ Payment submission failed:', submitError);
				return { success: false, error: submitError.message };
			}

			const { error: confirmError } = await stripe.confirmPayment({
				elements,
				clientSecret,
				confirmParams: {
					return_url: `${window.location.origin}/order-confirmation`,
					payment_method_data: {
						billing_details: {
							name: paymentData.shippingAddress.name,
							address: {
								line1: paymentData.shippingAddress.address_line1,
								line2: paymentData.shippingAddress.address_line2,
								city: paymentData.shippingAddress.city,
								state: paymentData.shippingAddress.state,
								postal_code: paymentData.shippingAddress.postal_code,
								country: paymentData.shippingAddress.country
							}
						}
					}
				},
				redirect: 'if_required'
			});

			if (confirmError) {
				logger.error('❌ Payment confirmation failed:', confirmError);
				return { success: false, error: confirmError.message };
			}

			logger.debug('✅ Stripe payment processed successfully');
			return { success: true };

		} catch (error) {
			logger.error('❌ Unexpected error during payment processing:', error);
			return { success: false, error: 'An unexpected error occurred. Please try again.' };
		}
	}

	// Cleanup Stripe resources
	function cleanup() {
		unmountCardElement();
		cardElement = null;
		elements = null;
		clientSecret = '';
		cardElementMounted = false;
		isInitializing = false;
		logger.debug('🧹 Stripe cleanup completed');
	}

	// Reset Stripe state
	function resetStripeState() {
		cleanup();
		stripe = null;
	}

	return {
		// State
		get clientSecret() { return clientSecret; },
		get cardElement() { return cardElement; },
		get elements() { return elements; },
		get isInitializing() { return isInitializing; },
		get cardElementMounted() { return cardElementMounted; },
		get stripe() { return stripe; },

		// Methods
		initializeStripePayment,
		mountCardElement,
		unmountCardElement,
		processStripePayment,
		cleanup,
		resetStripeState
	};
}