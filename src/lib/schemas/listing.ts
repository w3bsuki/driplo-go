import { z } from 'zod'
import { LISTING_CONDITIONS, CONDITION_VALUES } from '$lib/config/conditions'

// Re-export for backward compatibility
export const ListingCondition = {
	NEW_WITH_TAGS: LISTING_CONDITIONS.NEW_WITH_TAGS,
	NEW_WITHOUT_TAGS: LISTING_CONDITIONS.NEW_WITHOUT_TAGS,
	VERY_GOOD: LISTING_CONDITIONS.VERY_GOOD,
	GOOD: LISTING_CONDITIONS.GOOD,
	FAIR: LISTING_CONDITIONS.FAIR
} as const

// Shipping types enum
export const ShippingType = {
	STANDARD: 'standard',
	EXPRESS: 'express',
	PICKUP: 'pickup'
} as const

// Helper for Cyrillic validation
const cyrillicRegex = /[\u0400-\u04FF]/
const hasCyrillic = (text: string) => cyrillicRegex.test(text)

// Create locale-aware string validator
export const createLocaleAwareString = (locale?: string) => {
	return z.string().refine((val) => {
		// Skip validation if no locale or not Bulgarian
		if (!locale || locale !== 'bg') return true
		// Allow empty strings
		if (!val || val.trim().length === 0) return true
		// Check if contains Cyrillic for Bulgarian locale
		return hasCyrillic(val)
	}, {
		message: locale === 'bg' ? 'Текстът трябва да бъде на български език' : 'Text must be in Bulgarian'
	})
}

// Create listing validation schema
export const createListingSchema = z.object({
	// Basic Info (Step 1)
	title: z.string()
		.min(3, 'Title must be at least 3 characters')
		.max(100, 'Title must be less than 100 characters')
		.trim(),
	description: z.string()
		.min(10, 'Description must be at least 10 characters')
		.max(2000, 'Description must be less than 2000 characters')
		.trim(),
	category_id: z.string().uuid('Please select a valid category'),
	subcategory_id: z.string().uuid('Please select a subcategory').optional().nullable(),
	
	// Images (Step 2)
	images: z.array(z.string().url())
		.min(1, 'At least one image is required')
		.max(10, 'Maximum 10 images allowed')
		.default([]),
	
	// Pricing & Details (Step 3)
	price: z.number()
		.positive('Price must be greater than 0')
		.max(100000, 'Price must be less than 100,000'),
	condition: z.enum(CONDITION_VALUES as [string, ...string[]], {
		required_error: 'Please select the item condition'
	}),
	brand: z.string().max(50).optional().nullable(),
	size: z.string().max(20).optional().nullable(),
	color: z.string().min(1, 'Please specify the color').max(30),
	materials: z.array(z.string()).optional().default([]),
	
	// Shipping & Location (Step 4)
	location_city: z.string()
		.min(2, 'City name must be at least 2 characters')
		.max(100, 'City name must be less than 100 characters')
		.trim(),
	shipping_type: z.enum(['standard', 'express', 'pickup']).default('standard'),
	shipping_cost: z.number().min(0).default(0),
	ships_worldwide: z.boolean().default(false),
	tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed').optional().default([])
})

// Type for the form data
export type CreateListingFormData = z.infer<typeof createListingSchema>

// Schema for form defaults
export const createListingDefaults: Partial<CreateListingFormData> = {
	title: '',
	description: '',
	category_id: '',
	subcategory_id: null,
	images: [],
	price: 0,
	condition: LISTING_CONDITIONS.NEW_WITH_TAGS,
	brand: null,
	size: null,
	color: '',
	materials: [],
	location_city: '',
	shipping_type: 'standard',
	shipping_cost: 0,
	ships_worldwide: false,
	tags: []
}

// Client-side validation helpers for the new 2-step form
export const validateProductStep = (data: Partial<CreateListingFormData>) => {
	const productSchema = z.object({
		images: createListingSchema.shape.images,
		title: createListingSchema.shape.title,
		category_id: createListingSchema.shape.category_id,
		description: createListingSchema.shape.description,
		condition: createListingSchema.shape.condition,
		price: createListingSchema.shape.price,
		color: createListingSchema.shape.color
	})
	return productSchema.safeParse(data)
}

export const validateDeliveryStep = (data: Partial<CreateListingFormData>) => {
	const deliverySchema = z.object({
		location_city: createListingSchema.shape.location_city,
		shipping_type: createListingSchema.shape.shipping_type
	})
	return deliverySchema.safeParse(data)
}

// Keep old validators for backward compatibility
export const validateStep1 = validateProductStep
export const validateStep2 = (data: Partial<CreateListingFormData>) => {
	return z.object({ images: createListingSchema.shape.images }).safeParse(data)
}
export const validateStep3 = (data: Partial<CreateListingFormData>) => {
	return z.object({ 
		price: createListingSchema.shape.price,
		condition: createListingSchema.shape.condition,
		color: createListingSchema.shape.color
	}).safeParse(data)
}
export const validateStep4 = validateDeliveryStep