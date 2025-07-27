import { z } from 'zod'
import type { CreateListingFormData } from '$lib/schemas/listing'

// Enhanced validation schemas with better error messages
export const titleSchema = z.string()
	.min(3, 'Title needs at least 3 characters')
	.max(100, 'Title is too long (max 100 characters)')
	.trim()
	.refine(val => val.length > 0, 'Title is required')
	.refine(
		val => !(/^[^a-zA-Z0-9]+$/.test(val)), 
		'Title must contain letters or numbers'
	)

export const descriptionSchema = z.string()
	.min(10, 'Please add more details (min 10 characters)')
	.max(2000, 'Description is too long (max 2000 characters)')
	.trim()
	.refine(val => val.length > 0, 'Description is required')
	.refine(
		val => val.split(/\s+/).length >= 3,
		'Please write at least a few words about your item'
	)

export const priceSchema = z.number()
	.positive('Price must be greater than 0')
	.max(100000, 'Price seems too high (max $100,000)')
	.refine(val => val > 0.01, 'Price must be at least $0.01')
	.refine(val => Number.isFinite(val), 'Please enter a valid price')

export const categorySchema = z.string()
	.uuid('Please select a valid category')
	.refine(val => val.length > 0, 'Please select a category')

export const colorSchema = z.string()
	.min(1, 'Please specify the color')
	.max(30, 'Color name is too long')
	.trim()
	.refine(
		val => /^[a-zA-Z\s&/-]+$/.test(val),
		'Please use only letters for color (e.g., "Blue & White")'
	)

export const locationSchema = z.string()
	.min(2, 'City name must be at least 2 characters')
	.max(100, 'City name is too long')
	.trim()
	.refine(val => val.length > 0, 'City is required')
	.refine(
		val => /^[a-zA-Z\s,.-]+$/.test(val),
		'Please enter a valid city name'
	)

export const imagesSchema = z.array(z.string().url())
	.min(1, 'Please add at least one photo')
	.max(10, 'Maximum 10 photos allowed')
	.refine(
		images => images.every(url => url.startsWith('http')),
		'Invalid image URL detected'
	)

// Step-specific validation
export const step1Schema = z.object({
	title: titleSchema,
	category_id: categorySchema,
	description: descriptionSchema,
	subcategory_id: z.string().uuid().optional().nullable()
})

export const step2Schema = z.object({
	images: imagesSchema
})

export const step3Schema = z.object({
	price: priceSchema,
	condition: z.enum(['new_with_tags', 'new_without_tags', 'very_good', 'good', 'fair']),
	color: colorSchema,
	brand: z.string().max(50).optional().nullable(),
	size: z.string().max(20).optional().nullable(),
	materials: z.array(z.string()).optional().default([])
})

export const step4Schema = z.object({
	location_city: locationSchema,
	shipping_type: z.enum(['standard', 'express', 'pickup']),
	shipping_cost: z.number().min(0).default(0),
	ships_worldwide: z.boolean().default(false),
	tags: z.array(z.string()).max(5).optional().default([])
})

// Helper functions for validation
export function validateStep(step: number, data: Partial<CreateListingFormData>) {
	try {
		switch (step) {
			case 1:
				return step1Schema.parse(data)
			case 2:
				return step2Schema.parse(data)
			case 3:
				return step3Schema.parse(data)
			case 4:
				return step4Schema.parse(data)
			default:
				throw new Error('Invalid step')
		}
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { 
				success: false, 
				errors: error.errors.reduce((acc, err) => ({
					...acc,
					[err.path.join('.')]: err.message
				}), {})
			}
		}
		throw error
	}
}

// Validate single field
export function validateField(field: string, value: any): string | null {
	try {
		switch (field) {
			case 'title':
				titleSchema.parse(value)
				break
			case 'description':
				descriptionSchema.parse(value)
				break
			case 'price':
				priceSchema.parse(value)
				break
			case 'category_id':
				categorySchema.parse(value)
				break
			case 'color':
				colorSchema.parse(value)
				break
			case 'location_city':
				locationSchema.parse(value)
				break
			case 'images':
				imagesSchema.parse(value)
				break
		}
		return null
	} catch (error) {
		if (error instanceof z.ZodError) {
			return error.errors[0]?.message || 'Invalid value'
		}
		return 'Validation error'
	}
}

// Smart suggestions based on input
export function getSuggestions(field: string, value: string): string[] {
	switch (field) {
		case 'color':
			const colors = [
				'Black', 'White', 'Gray', 'Navy', 'Blue', 'Red', 'Pink',
				'Green', 'Yellow', 'Orange', 'Purple', 'Brown', 'Beige',
				'Multi-color', 'Gold', 'Silver'
			]
			return colors.filter(c => 
				c.toLowerCase().includes(value.toLowerCase())
			).slice(0, 5)
			
		case 'size':
			const sizes = [
				'XS', 'S', 'M', 'L', 'XL', 'XXL', 
				'One Size', '36', '38', '40', '42', '44',
				'US 6', 'US 8', 'US 10', 'EU 36', 'EU 40'
			]
			return sizes.filter(s => 
				s.toLowerCase().includes(value.toLowerCase())
			).slice(0, 5)
			
		case 'brand':
			// In real app, this would fetch from database
			const brands = [
				'Nike', 'Adidas', 'Zara', 'H&M', 'Uniqlo',
				'Ralph Lauren', 'Tommy Hilfiger', 'Calvin Klein'
			]
			return brands.filter(b => 
				b.toLowerCase().includes(value.toLowerCase())
			).slice(0, 5)
			
		default:
			return []
	}
}

// Format currency for display
export function formatPrice(price: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 2
	}).format(price)
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
	return input
		.replace(/[<>]/g, '') // Remove potential HTML tags
		.trim()
}

// Check if draft has significant changes
export function hasSignificantChanges(
	original: Partial<CreateListingFormData>, 
	current: Partial<CreateListingFormData>
): boolean {
	const significantFields = [
		'title', 'description', 'price', 'category_id', 'images'
	]
	
	return significantFields.some(field => {
		const originalValue = original[field as keyof CreateListingFormData]
		const currentValue = current[field as keyof CreateListingFormData]
		
		if (Array.isArray(originalValue) && Array.isArray(currentValue)) {
			return JSON.stringify(originalValue) !== JSON.stringify(currentValue)
		}
		
		return originalValue !== currentValue
	})
}