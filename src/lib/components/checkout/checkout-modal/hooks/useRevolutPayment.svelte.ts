/**
 * Revolut Payment Management Hook
 * Handles manual payment creation, instruction display, and confirmation logic
 */

import { logger } from '$lib/services/logger';
import { toast } from 'svelte-sonner';

interface RevolutPaymentState {
	revolutOrderId: string;
	manualPaymentData: ManualPaymentData | null;
	showPaymentInstructions: boolean;
	isCreatingPayment: boolean;
}

interface ManualPaymentData {
	order_id: string;
	amount: number;
	currency: string;
	payment_reference: string;
	revolut_link?: string;
	instructions?: string;
	expires_at?: string;
}

interface PaymentData {
	listing: any;
	shippingAddress: any;
	totalAmount: number;
}

export function useRevolutPayment() {
	// Revolut payment state
	let revolutOrderId = $state('');
	let manualPaymentData = $state<ManualPaymentData | null>(null);
	let showPaymentInstructions = $state(false);
	let isCreatingPayment = $state(false);

	// Create manual payment
	async function createManualPayment(paymentData: PaymentData): Promise<{ success: boolean; error?: string }> {
		if (isCreatingPayment) {
			logger.debug('⏸️ Manual payment creation already in progress');
			return { success: false, error: 'Payment creation already in progress' };
		}

		try {
			isCreatingPayment = true;
			logger.debug('🔄 Creating Revolut manual payment...');

			const response = await fetch('/api/payments/create-manual', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					amount: paymentData.totalAmount,
					listing_id: paymentData.listing?.id,
					shipping_address: paymentData.shippingAddress,
					payment_method: 'revolut_manual'
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || `Failed to create manual payment: ${response.status}`);
			}

			const responseData = await response.json();
			
			// Store payment data
			revolutOrderId = responseData.order_id;
			manualPaymentData = {
				order_id: responseData.order_id,
				amount: responseData.amount,
				currency: responseData.currency || 'BGN',
				payment_reference: responseData.payment_reference,
				revolut_link: responseData.revolut_link,
				instructions: responseData.instructions,
				expires_at: responseData.expires_at
			};

			showPaymentInstructions = true;

			logger.debug('✅ Manual payment created successfully', { 
				orderId: revolutOrderId,
				reference: responseData.payment_reference 
			});

			return { success: true };

		} catch (error) {
			logger.error('❌ Failed to create manual payment:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to create payment';
			toast.error(errorMessage);
			return { success: false, error: errorMessage };
		} finally {
			isCreatingPayment = false;
		}
	}

	// Open Revolut payment link
	function openRevolutLink() {
		if (manualPaymentData?.revolut_link) {
			window.open(manualPaymentData.revolut_link, '_blank', 'noopener,noreferrer');
			logger.debug('🔗 Opened Revolut payment link');
		} else {
			logger.error('❌ No Revolut payment link available');
			toast.error('Payment link not available');
		}
	}

	// Confirm manual payment (when user claims they've paid)
	async function confirmManualPayment(): Promise<{ success: boolean; error?: string }> {
		if (!revolutOrderId) {
			const error = 'No payment order to confirm';
			logger.error('❌ Payment confirmation failed:', error);
			return { success: false, error };
		}

		try {
			logger.debug('🔄 Confirming manual payment...', { orderId: revolutOrderId });

			const response = await fetch('/api/payments/confirm-manual', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					order_id: revolutOrderId
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || `Failed to confirm payment: ${response.status}`);
			}

			logger.debug('✅ Manual payment confirmed successfully');
			toast.success('Payment confirmation received! We will verify your payment shortly.');

			return { success: true };

		} catch (error) {
			logger.error('❌ Failed to confirm manual payment:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to confirm payment';
			toast.error(errorMessage);
			return { success: false, error: errorMessage };
		}
	}

	// Check payment status
	async function checkPaymentStatus(): Promise<{ status: string; verified: boolean } | null> {
		if (!revolutOrderId) {
			return null;
		}

		try {
			const response = await fetch(`/api/payments/status/${revolutOrderId}`);
			
			if (!response.ok) {
				throw new Error(`Failed to check payment status: ${response.status}`);
			}

			const statusData = await response.json();
			logger.debug('💰 Payment status checked', statusData);

			return {
				status: statusData.status,
				verified: statusData.verified || false
			};

		} catch (error) {
			logger.error('❌ Failed to check payment status:', error);
			return null;
		}
	}

	// Hide payment instructions
	function hidePaymentInstructions() {
		showPaymentInstructions = false;
	}

	// Reset Revolut payment state
	function resetRevolutState() {
		revolutOrderId = '';
		manualPaymentData = null;
		showPaymentInstructions = false;
		isCreatingPayment = false;
		logger.debug('🧹 Revolut payment state reset');
	}

	// Get formatted payment amount
	function getFormattedAmount(): string {
		if (!manualPaymentData) return '';
		
		const formatter = new Intl.NumberFormat('bg-BG', {
			style: 'currency',
			currency: manualPaymentData.currency
		});
		
		return formatter.format(manualPaymentData.amount);
	}

	// Check if payment is expired
	function isPaymentExpired(): boolean {
		if (!manualPaymentData?.expires_at) return false;
		
		const expiryDate = new Date(manualPaymentData.expires_at);
		const now = new Date();
		
		return now > expiryDate;
	}

	return {
		// State
		get revolutOrderId() { return revolutOrderId; },
		get manualPaymentData() { return manualPaymentData; },
		get showPaymentInstructions() { return showPaymentInstructions; },
		get isCreatingPayment() { return isCreatingPayment; },

		// Methods
		createManualPayment,
		openRevolutLink,
		confirmManualPayment,
		checkPaymentStatus,
		hidePaymentInstructions,
		resetRevolutState,
		getFormattedAmount,
		isPaymentExpired
	};
}

export type { ManualPaymentData, RevolutPaymentState };