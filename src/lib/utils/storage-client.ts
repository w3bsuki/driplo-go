import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '$lib/types/database.types'
import { compressImages } from './image-compression'

export type UploadResult = {
	url: string
	path?: string
	urls?: Record<string, string>
	srcSet?: string
	error?: string
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024 // 5MB for actual upload
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']

/**
 * Validates an image file
 */
export function validateImageFile(file: File): string | null {
	// iOS might report HEIC files with empty type
	const fileType = file.type || (file.name.toLowerCase().endsWith('.heic') ? 'image/heic' : '')
	
	if (fileType && !ACCEPTED_IMAGE_TYPES.includes(fileType)) {
		return 'Please upload a valid image file (JPEG, PNG, WebP, GIF, or HEIC)'
	}
	
	if (file.size > MAX_FILE_SIZE) {
		return 'Image size must be less than 10MB'
	}
	
	return null
}

/**
 * Uploads a single image through the optimized API with retry logic
 */
export async function uploadImage(
	file: File,
	bucket: 'avatars' | 'covers' | 'listings',
	_supabase: SupabaseClient<Database>,
	_userId?: string,
	maxRetries: number = 3
): Promise<UploadResult> {
	// Validate file first
	const validationError = validateImageFile(file)
	if (validationError) {
		return { url: '', error: validationError }
	}

	// Attempt upload with retries
	let lastError: Error | null = null
	
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			// Compress image if needed (important for mobile devices)
			let processedFile = file
			const needsCompression = file.size > MAX_UPLOAD_SIZE || 
				file.type === 'image/jpeg' || 
				file.type === 'image/jpg' ||
				file.type === 'image/heic' ||
				file.type === 'image/heif' ||
				!file.type // iOS sometimes doesn't set type for HEIC
				
			if (needsCompression) {
				try {
					const compressed = await compressImages([file], {
						maxWidth: 1920,
						maxHeight: 1920,
						quality: 0.85,
						maxSizeMB: 4.5, // Leave some buffer under 5MB limit
						handleHEIC: true
					})
					processedFile = compressed[0]
					console.log(`Processed image: ${file.name} (${file.type || 'unknown'}) from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`)
				} catch (compressionError) {
					console.warn('Image compression failed, using original:', compressionError)
				}
			}

			// Use the simple upload API with timeout
			const formData = new FormData();
			formData.append('file', processedFile);
			formData.append('bucket', bucket);

			// Create AbortController for timeout (increase timeout for retries)
			const controller = new AbortController();
			const timeout = 30000 + (attempt - 1) * 10000; // 30s, 40s, 50s
			const timeoutId = setTimeout(() => controller.abort(), timeout);

			try {
				const response = await fetch('/api/upload/simple', {
					method: 'POST',
					body: formData,
					signal: controller.signal
				});

				clearTimeout(timeoutId);

				if (!response.ok) {
					const error = await response.json();
					throw new Error(error.message || 'Upload failed');
				}

				const data = await response.json();
				return {
					url: data.url,
					path: data.path
				};
			} catch (fetchError: any) {
				clearTimeout(timeoutId);
				if (fetchError.name === 'AbortError') {
					lastError = new Error(`Upload timed out after ${timeout/1000}s. Please try again with a smaller image.`);
				} else {
					lastError = fetchError;
				}
				
				// If not the last attempt, wait before retrying
				if (attempt < maxRetries) {
					console.warn(`Upload attempt ${attempt} failed, retrying in ${attempt}s...`, lastError.message);
					await new Promise(resolve => setTimeout(resolve, attempt * 1000));
				}
			}
		} catch (error) {
			lastError = error instanceof Error ? error : new Error('Unknown error');
			
			// If not the last attempt, wait before retrying
			if (attempt < maxRetries) {
				console.warn(`Upload attempt ${attempt} failed, retrying in ${attempt}s...`, lastError.message);
				await new Promise(resolve => setTimeout(resolve, attempt * 1000));
			}
		}
	}

	// All attempts failed
	console.error('All upload attempts failed:', lastError)
	return { 
		url: '', 
		error: lastError?.message || 'Failed to upload image after multiple attempts' 
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
	onProgress?: (progress: number) => void
): Promise<UploadResult[]> {
	const results: UploadResult[] = []
	
	for (let i = 0; i < files.length; i++) {
		const result = await uploadImage(files[i], bucket, supabase, userId)
		results.push(result)
		
		if (onProgress) {
			onProgress(((i + 1) / files.length) * 100)
		}
	}
	
	return results
}

/**
 * Gets a public URL for a storage path
 */
export function getPublicUrl(
	supabase: SupabaseClient<Database>,
	bucket: string,
	path: string
): string {
	const { data: { publicUrl } } = supabase.storage
		.from(bucket)
		.getPublicUrl(path)
	
	return publicUrl
}

/**
 * Deletes an image from storage
 */
export async function deleteImage(
	supabase: SupabaseClient<Database>,
	bucket: string,
	path: string
): Promise<{ error?: string }> {
	const { error } = await supabase.storage
		.from(bucket)
		.remove([path])
	
	if (error) {
		console.error('Delete error:', error)
		return { error: error.message }
	}
	
	return {}
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