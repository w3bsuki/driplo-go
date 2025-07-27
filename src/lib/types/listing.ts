export interface Listing {
	id: string;
	sellerId: string;
	title: string;
	description: string;
	category: Category;
	subcategory?: string;
	brand?: string;
	size?: string;
	condition: Condition;
	price: Price;
	images: ListingImage[];
	measurements?: Measurements;
	tags: string[];
	status: ListingStatus;
	analytics: ListingAnalytics;
	shipping: ShippingOptions;
	createdAt: Date;
	updatedAt: Date;
}

export type Category = 
	| 'women'
	| 'men'
	| 'kids'
	| 'accessories'
	| 'shoes'
	| 'bags'
	| 'jewelry'
	| 'beauty';

export type Condition = 
	| 'new_with_tags'
	| 'excellent'
	| 'good'
	| 'fair';

export interface Price {
	amount: number;
	currency: string;
	negotiable: boolean;
}

export interface ListingImage {
	id: string;
	url: string;
	thumbnailUrl?: string;
	order: number;
}

export interface Measurements {
	chest?: number;
	waist?: number;
	hips?: number;
	length?: number;
	shoulders?: number;
	sleeves?: number;
	inseam?: number;
}

export type ListingStatus = 
	| 'active'
	| 'sold'
	| 'reserved'
	| 'deleted';

export interface ListingAnalytics {
	views: number;
	likes: number;
	shares: number;
	saves: number;
}

export interface ShippingOptions {
	methods: ShippingMethod[];
	handlingTime: number; // days
	fromLocation?: {
		city?: string;
		country: string;
	};
}

export interface ShippingMethod {
	id: string;
	name: string;
	price: number;
	estimatedDays: {
		min: number;
		max: number;
	};
}