import { v4 as uuidv4 } from 'uuid'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '$lib/types/database.types'
import { ImageOptimizer } from '$lib/server/image-optimizer'

export type UploadResult = {
	url: string
	path?: string
	urls?: Record<string, string>
	srcSet?: string
	error?: string
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

/**
 * Validates an image file
 */
export function validateImageFile(file: File): string | null {
	if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
		return 'Please upload a valid image file (JPEG, PNG, WebP, or GIF)'
	}
	
	if (file.size > MAX_FILE_SIZE) {
		return 'Image size must be less than 10MB'
	}
	
	return null
}

/**
 * Uploads a single image to Supabase storage with optimization
 * Note: This function should only be used on the server side when ImageOptimizer is available
 */
export async function uploadImage(
	file: File,
	bucket: 'avatars' | 'covers' | 'listings',
	supabase: SupabaseClient<Database>,
	userId?: string,
	optimize: boolean = false
): Promise<UploadResult> {
	try {
		// Validate file
		const validationError = validateImageFile(file)
		if (validationError) {
			return { url: '', error: validationError }
		}

		// For client-side uploads or when optimization is disabled
		if (!optimize || typeof window !== 'undefined') {
			// Generate unique filename
			const fileExt = file.name.split('.').pop()
			const fileName = `${uuidv4()}.${fileExt}`
			
			// Create folder structure based on bucket type
			let filePath = fileName
			if (bucket === 'listings' && userId) {
				filePath = `${userId}/${fileName}`
			} else if ((bucket === 'avatars' || bucket === 'covers') && userId) {
				filePath = `${userId}/${fileName}`
			}

			// Upload to Supabase storage
			const { data, error } = await supabase.storage
				.from(bucket)
				.upload(filePath, file, {
					cacheControl: 'public, max-age=2592000', // 30 days cache
					upsert: false
				})

			if (error) {
				console.error('Upload error:', error)
				return { url: '', error: error.message }
			}

			// Get public URL
			const { data: { publicUrl } } = supabase.storage
				.from(bucket)
				.getPublicUrl(data.path)

			return {
				url: publicUrl,
				path: data.path
			}
		}

		// Server-side optimized upload
		const optimizer = new ImageOptimizer(supabase)
		const type = bucket === 'avatars' ? 'avatar' : bucket === 'covers' ? 'cover' : 'listing'
		
		// Optimize images
		const optimizedImages = await optimizer.optimizeImage(file, type)
		
		if (optimizedImages.length === 0) {
			return { url: '', error: 'Failed to optimize image' }
		}
		
		// Determine storage path
		const basePath = userId ? `${bucket}/${userId}` : bucket
		
		// Upload optimized images
		const { urls, mainUrl } = await optimizer.uploadOptimizedImages(
			optimizedImages,
			'images', // Using single bucket
			basePath
		)
		
		if (!mainUrl) {
			return { url: '', error: 'Failed to upload images' }
		}
		
		const srcSet = optimizer.generateSrcSet(urls)
		
		return {
			url: mainUrl,
			urls,
			srcSet
		}
	} catch (error) {
		console.error('Upload error:', error)
		return { 
			url: '', 
			error: error instanceof Error ? error.message : 'Failed to upload image' 
		}
	}
}

/**
 * Uploads multiple images (for listings)
 */
export async function uploadMultipleImages(
	files: File[],
	bucket: 'listings',
	supabase: SupabaseClient<Database>,
	userId: string,
	onProgress?: (progress: number) => void,
	optimize: boolean = false
): Promise<UploadResult[]> {
	const results: UploadResult[] = []
	
	for (let i = 0; i < files.length; i++) {
		const result = await uploadImage(files[i], bucket, supabase, userId, optimize)
		results.push(result)
		
		if (onProgress) {
			onProgress(((i + 1) / files.length) * 100)
		}
	}
	
	return results
}

/**
 * Deletes an image from Supabase storage
 */
export async function deleteImage(
	path: string,
	bucket: 'avatars' | 'covers' | 'listings',
	supabase: SupabaseClient<Database>
): Promise<boolean> {
	try {
		const { error } = await supabase.storage
			.from(bucket)
			.remove([path])

		if (error) {
			console.error('Delete error:', error)
			return false
		}

		return true
	} catch (error) {
		console.error('Delete error:', error)
		return false
	}
}

/**
 * Converts a File to base64 for preview
 */
export function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.readAsDataURL(file)
		reader.onload = () => resolve(reader.result as string)
		reader.onerror = error => reject(error)
	})
}