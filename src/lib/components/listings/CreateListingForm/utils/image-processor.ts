// Image compression and processing utilities
export interface ImageProcessingOptions {
	maxWidth?: number
	maxHeight?: number
	quality?: number
	format?: 'jpeg' | 'webp' | 'png'
	removeExif?: boolean
}

const DEFAULT_OPTIONS: ImageProcessingOptions = {
	maxWidth: 2000,
	maxHeight: 2000,
	quality: 0.85,
	format: 'jpeg',
	removeExif: true
}

// Convert HEIC/HEIF to JPEG (for iOS compatibility)
export async function convertHeicToJpeg(file: File): Promise<File> {
	// Check if file is HEIC/HEIF
	const isHeic = file.type === 'image/heic' || 
		file.type === 'image/heif' ||
		file.name.toLowerCase().endsWith('.heic') ||
		file.name.toLowerCase().endsWith('.heif')
	
	if (!isHeic) return file
	
	// For now, return the file as-is since browser HEIC support is limited
	// In production, you'd use a service or library like heic2any
	return file
}

// Compress image using canvas
export async function compressImage(
	file: File, 
	options: ImageProcessingOptions = {}
): Promise<File> {
	const opts = { ...DEFAULT_OPTIONS, ...options }
	
	return new Promise((resolve, reject) => {
		const img = new Image()
		const canvas = document.createElement('canvas')
		const ctx = canvas.getContext('2d')
		
		if (!ctx) {
			reject(new Error('Canvas context not available'))
			return
		}
		
		img.onload = () => {
			// Calculate new dimensions
			let { width, height } = img
			
			if (width > opts.maxWidth! || height > opts.maxHeight!) {
				const ratio = Math.min(
					opts.maxWidth! / width,
					opts.maxHeight! / height
				)
				width = Math.round(width * ratio)
				height = Math.round(height * ratio)
			}
			
			// Set canvas dimensions
			canvas.width = width
			canvas.height = height
			
			// Draw image
			ctx.imageSmoothingEnabled = true
			ctx.imageSmoothingQuality = 'high'
			ctx.drawImage(img, 0, 0, width, height)
			
			// Convert to blob
			canvas.toBlob(
				(blob) => {
					if (!blob) {
						reject(new Error('Failed to compress image'))
						return
					}
					
					// Create new file from blob
					const compressedFile = new File(
						[blob],
						file.name.replace(/\.[^/.]+$/, `.${opts.format}`),
						{ type: `image/${opts.format}` }
					)
					
					resolve(compressedFile)
				},
				`image/${opts.format}`,
				opts.quality
			)
		}
		
		img.onerror = () => reject(new Error('Failed to load image'))
		
		// Read file
		const reader = new FileReader()
		reader.onload = (e) => {
			img.src = e.target?.result as string
		}
		reader.onerror = () => reject(new Error('Failed to read file'))
		reader.readAsDataURL(file)
	})
}

// Calculate file size reduction
export function calculateSizeReduction(originalSize: number, compressedSize: number): number {
	return Math.round(((originalSize - compressedSize) / originalSize) * 100)
}

// Format file size for display
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes'
	
	const k = 1024
	const sizes = ['Bytes', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Validate image file
export function validateImageFile(file: File): { valid: boolean; error?: string } {
	// Check file type
	const validTypes = [
		'image/jpeg',
		'image/jpg',
		'image/png',
		'image/webp',
		'image/gif',
		'image/heic',
		'image/heif'
	]
	
	const fileExt = file.name.split('.').pop()?.toLowerCase()
	const isValidType = validTypes.includes(file.type) || 
		['heic', 'heif'].includes(fileExt || '')
	
	if (!isValidType) {
		return { 
			valid: false, 
			error: 'Please upload a valid image file (JPEG, PNG, WebP, GIF)' 
		}
	}
	
	// Check file size (max 10MB before compression)
	const maxSize = 10 * 1024 * 1024
	if (file.size > maxSize) {
		return { 
			valid: false, 
			error: `File too large (max 10MB). Your file: ${formatFileSize(file.size)}` 
		}
	}
	
	return { valid: true }
}

// Generate image preview URL
export function createImagePreview(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = (e) => resolve(e.target?.result as string)
		reader.onerror = () => reject(new Error('Failed to create preview'))
		reader.readAsDataURL(file)
	})
}

// Extract image metadata
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = () => resolve({ width: img.width, height: img.height })
		img.onerror = () => reject(new Error('Failed to load image'))
		
		const reader = new FileReader()
		reader.onload = (e) => {
			img.src = e.target?.result as string
		}
		reader.onerror = () => reject(new Error('Failed to read file'))
		reader.readAsDataURL(file)
	})
}

// Detect duplicate images using basic hash
export async function generateImageHash(file: File): Promise<string> {
	// Simple hash based on file size, name, and first/last bytes
	const buffer = await file.arrayBuffer()
	const view = new Uint8Array(buffer)
	
	const sample = [
		...view.slice(0, 100), // First 100 bytes
		...view.slice(-100)   // Last 100 bytes
	]
	
	let hash = file.size.toString()
	for (let i = 0; i < sample.length; i++) {
		hash += sample[i]?.toString(16) ?? ''
	}
	
	return hash
}

// Check if image is duplicate
export async function isDuplicateImage(
	file: File, 
	existingHashes: Set<string>
): Promise<boolean> {
	const hash = await generateImageHash(file)
	return existingHashes.has(hash)
}

// Process multiple images in parallel
export async function processImages(
	files: File[],
	options: ImageProcessingOptions = {},
	onProgress?: (processed: number, total: number) => void
): Promise<File[]> {
	const processed: File[] = []
	let completedCount = 0
	
	const promises = files.map(async (file) => {
		try {
			// Convert HEIC if needed
			let processedFile = await convertHeicToJpeg(file)
			
			// Compress image
			processedFile = await compressImage(processedFile, options)
			
			completedCount++
			onProgress?.(completedCount, files.length)
			
			return processedFile
		} catch (error) {
			console.error(`Failed to process ${file.name}:`, error)
			throw error
		}
	})
	
	const results = await Promise.allSettled(promises)
	
	results.forEach((result, index) => {
		if (result.status === 'fulfilled') {
			processed.push(result.value)
		} else {
			console.error(`Failed to process file ${files[index]?.name ?? 'unknown'}`)
		}
	})
	
	return processed
}

// Smart crop suggestions based on image content
export function getSuggestedCrop(
	width: number, 
	height: number
): { x: number; y: number; width: number; height: number } {
	const targetRatio = 1 // Square for marketplace
	const currentRatio = width / height
	
	if (Math.abs(currentRatio - targetRatio) < 0.1) {
		// Already roughly square
		return { x: 0, y: 0, width, height }
	}
	
	if (currentRatio > targetRatio) {
		// Wider than tall - crop sides
		const newWidth = height
		const x = (width - newWidth) / 2
		return { x, y: 0, width: newWidth, height }
	} else {
		// Taller than wide - crop top/bottom
		const newHeight = width
		const y = (height - newHeight) / 2
		return { x: 0, y, width, height: newHeight }
	}
}