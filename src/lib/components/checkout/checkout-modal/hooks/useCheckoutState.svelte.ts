/**
 * Checkout State Management Hook
 * Centralizes shipping address, payment provider selection, and calculated totals
 */

interface ShippingAddress {
	name: string;
	address_line1: string;
	address_line2: string;
	city: string;
	state: string;
	postal_code: string;
	country: string;
}

interface CheckoutState {
	shippingAddress: ShippingAddress;
	paymentProvider: 'stripe' | 'revolut_manual';
	isProcessing: boolean;
	itemPrice: number;
	shippingCost: number;
	buyerFee: number;
	totalAmount: number;
}

interface Listing {
	price: number;
	shipping_cost?: number;
	// Add other listing properties as needed
}

export function useCheckoutState(listing: Listing) {
	// Shipping address state
	let shippingAddress = $state<ShippingAddress>({
		name: '',
		address_line1: '',
		address_line2: '',
		city: '',
		state: '',
		postal_code: '',
		country: 'BG'
	});

	// Payment provider selection
	let paymentProvider = $state<'stripe' | 'revolut_manual'>('stripe');

	// Processing state
	let isProcessing = $state(false);

	// Calculated values (reactive derivations)
	let itemPrice = $derived(listing?.price || 0);
	let shippingCost = $derived(listing?.shipping_cost || 0);
	let buyerFee = $derived(0); // Can be calculated based on business rules
	let totalAmount = $derived(itemPrice + shippingCost + buyerFee);

	// Address validation
	let isShippingAddressValid = $derived(
		shippingAddress.name.trim() !== '' &&
		shippingAddress.address_line1.trim() !== '' &&
		shippingAddress.city.trim() !== '' &&
		shippingAddress.postal_code.trim() !== '' &&
		shippingAddress.country.trim() !== ''
	);

	// Methods to update state
	function updateShippingAddress(updates: Partial<ShippingAddress>) {
		shippingAddress = { ...shippingAddress, ...updates };
	}

	function setPaymentProvider(provider: 'stripe' | 'revolut_manual') {
		paymentProvider = provider;
	}

	function setIsProcessing(processing: boolean) {
		isProcessing = processing;
	}

	function resetCheckoutState() {
		shippingAddress = {
			name: '',
			address_line1: '',
			address_line2: '',
			city: '',
			state: '',
			postal_code: '',
			country: 'BG'
		};
		paymentProvider = 'stripe';
		isProcessing = false;
	}

	return {
		// State
		get shippingAddress() { return shippingAddress; },
		get paymentProvider() { return paymentProvider; },
		get isProcessing() { return isProcessing; },
		
		// Calculated values
		get itemPrice() { return itemPrice; },
		get shippingCost() { return shippingCost; },
		get buyerFee() { return buyerFee; },
		get totalAmount() { return totalAmount; },
		get isShippingAddressValid() { return isShippingAddressValid; },

		// Methods
		updateShippingAddress,
		setPaymentProvider,
		setIsProcessing,
		resetCheckoutState
	};
}

export type { ShippingAddress, CheckoutState };