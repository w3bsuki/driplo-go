// Revolut client for future API integration
// Currently using manual payment system

export class RevolutClient {
	// Placeholder for future Revolut Business API integration
	// For now, we're using manual Revolut transfers
	
	constructor() {
		// Manual payment system - no API key needed
	}

	// These methods are placeholders for future API integration
	async createOrder(_orderData: any) {
		throw new Error('Revolut API not implemented - using manual payments');
	}

	async getOrder(_orderId: string) {
		throw new Error('Revolut API not implemented - using manual payments');
	}

	async createPayment(_orderId: string, _paymentData: any) {
		throw new Error('Revolut API not implemented - using manual payments');
	}

	async getPayment(_paymentId: string) {
		throw new Error('Revolut API not implemented - using manual payments');
	}

	async capturePayment(_paymentId: string, _amount?: number) {
		throw new Error('Revolut API not implemented - using manual payments');
	}

	async refundPayment(_paymentId: string, _amount?: number, _reason?: string) {
		throw new Error('Revolut API not implemented - using manual payments');
	}
}

export const revolut = new RevolutClient();