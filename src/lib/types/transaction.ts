export interface Transaction {
	id: string;
	buyerId: string;
	sellerId: string;
	listingId: string;
	amount: Money;
	status: TransactionStatus;
	shipping: TransactionShipping;
	escrow: EscrowDetails;
	timeline: TransactionEvent[];
	createdAt: Date;
	completedAt?: Date;
}

export interface Money {
	amount: number;
	currency: string;
	fees: {
		platform: number;
		payment: number;
		total: number;
	};
	sellerPayout: number;
}

export type TransactionStatus = 
	| 'pending'
	| 'paid'
	| 'shipped'
	| 'delivered'
	| 'completed'
	| 'cancelled'
	| 'disputed';

export interface TransactionShipping {
	address: ShippingAddress;
	method: string;
	trackingNumber?: string;
	carrier?: string;
	shippedAt?: Date;
	deliveredAt?: Date;
}

export interface ShippingAddress {
	fullName: string;
	addressLine1: string;
	addressLine2?: string;
	city: string;
	state?: string;
	postalCode: string;
	country: string;
	phone?: string;
}

export interface EscrowDetails {
	heldUntil?: Date;
	releasedAt?: Date;
	disputeId?: string;
}

export interface TransactionEvent {
	id: string;
	type: string;
	description: string;
	timestamp: Date;
	metadata?: Record<string, unknown>;
}