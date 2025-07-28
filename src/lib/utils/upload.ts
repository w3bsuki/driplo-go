import type { SupabaseClient } from '@supabase/supabase-js'

export async function uploadListingImage(
	supabase: SupabaseClient,
	file: File,
	userId: string,
	index: number
): Promise<string> {
	const fileExt = file.name.split('.').pop()
	const fileName = `${userId}/${Date.now()}_${index}.${fileExt}`
	const filePath = `listings/${fileName}`

	const { error } = await supabase.storage
		.from('listings')
		.upload(filePath, file, {
			cacheControl: '3600',
			upsert: false
		})

	if (error) {
		throw error
	}

	// Get public URL
	const { data } = supabase.storage
		.from('listings')
		.getPublicUrl(filePath)

	return data.publicUrl
}

export async function deleteListingImage(
	supabase: SupabaseClient,
	imageUrl: string
): Promise<void> {
	// Extract file path from URL
	const url = new URL(imageUrl)
	const pathParts = url.pathname.split('/storage/v1/object/public/listings/')
	
	if (pathParts.length < 2) {
		console.error('Invalid image URL format')
		return
	}

	const filePath = pathParts[1]

	const { error } = await supabase.storage
		.from('listings')
		.remove([filePath])

	if (error) {
		console.error('Error deleting image:', error)
		throw error
	}
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
	const MAX_SIZE = 10 * 1024 * 1024 // 10MB
	const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

	if (file.size > MAX_SIZE) {
		return { valid: false, error: 'Image must be less than 10MB' }
	}

	if (!ALLOWED_TYPES.includes(file.type)) {
		return { valid: false, error: 'Only JPEG, PNG, WebP, and AVIF images are allowed' }
	}

	return { valid: true }
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const img = new Image()
		const url = URL.createObjectURL(file)

		img.onload = () => {
			URL.revokeObjectURL(url)
			resolve({ width: img.width, height: img.height })
		}

		img.onerror = () => {
			URL.revokeObjectURL(url)
			reject(new Error('Failed to load image'))
		}

		img.src = url
	})
}