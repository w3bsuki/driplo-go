interface CompressionOptions {
	maxWidth?: number
	maxHeight?: number
	quality?: number
	maxSizeMB?: number
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): string | null {
	// Check file type
	const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
	if (!validTypes.includes(file.type)) {
		return 'Please upload a valid image file (JPG, PNG, GIF, or WebP)'
	}
	
	// Check file size (10MB max)
	const maxSize = 10 * 1024 * 1024
	if (file.size > maxSize) {
		return 'Image size must be less than 10MB'
	}
	
	return null
}

/**
 * Compress images efficiently for mobile devices
 * Uses Canvas API with Web Workers when available
 */
export async function compressImages(
	files: File[],
	options: CompressionOptions = {}
): Promise<File[]> {
	const {
		maxWidth = 1920,
		maxHeight = 1920,
		quality = 0.85,
		maxSizeMB = 4.5
	} = options

	const compressedFiles: File[] = []

	for (const file of files) {
		try {
			const compressed = await compressImage(file, { maxWidth, maxHeight, quality, maxSizeMB })
			compressedFiles.push(compressed)
		} catch (error) {
			console.error('Failed to compress image:', error)
			// Fall back to original if compression fails
			compressedFiles.push(file)
		}
	}

	return compressedFiles
}

async function compressImage(
	file: File,
	options: CompressionOptions
): Promise<File> {
	const { maxWidth = 1920, maxHeight = 1920, quality = 0.85, maxSizeMB = 4.5 } = options

	// Skip if already small enough
	if (file.size <= maxSizeMB * 1024 * 1024) {
		const dimensions = await getImageDimensions(file)
		if (dimensions.width <= maxWidth && dimensions.height <= maxHeight) {
			return file
		}
	}

	return new Promise((resolve, reject) => {
		const reader = new FileReader()

		reader.onload = (e) => {
			const img = new Image()
			
			img.onload = () => {
				// Use requestIdleCallback for better mobile performance
				const processImage = () => {
					try {
						// Calculate new dimensions
						let { width, height } = img
						
						if (width > maxWidth || height > maxHeight) {
							const ratio = Math.min(maxWidth / width, maxHeight / height)
							width = Math.round(width * ratio)
							height = Math.round(height * ratio)
						}

						// Create canvas
						const canvas = document.createElement('canvas')
						canvas.width = width
						canvas.height = height

						const ctx = canvas.getContext('2d', {
							// Optimize for mobile
							alpha: true,
							desynchronized: true,
							willReadFrequently: false
						})

						if (!ctx) {
							throw new Error('Failed to get canvas context')
						}

						// Enable image smoothing for better quality
						ctx.imageSmoothingEnabled = true
						ctx.imageSmoothingQuality = 'high'

						// Draw resized image
						ctx.drawImage(img, 0, 0, width, height)

						// Convert to blob with quality settings
						canvas.toBlob(
							(blob) => {
								if (!blob) {
									reject(new Error('Failed to compress image'))
									return
								}

								// Check if we achieved the target size
								if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.5) {
									// Recursively compress with lower quality
									const newFile = new File([blob], file.name, {
										type: file.type,
										lastModified: Date.now()
									})
									
									compressImage(newFile, {
										...options,
										quality: quality - 0.1
									}).then(resolve).catch(reject)
								} else {
									// Create new file with compressed data
									const compressedFile = new File([blob], file.name, {
										type: file.type,
										lastModified: Date.now()
									})
									resolve(compressedFile)
								}
							},
							file.type,
							quality
						)
					} catch (error) {
						reject(error)
					}
				}

				// Use requestIdleCallback if available (better for mobile)
				if ('requestIdleCallback' in window) {
					requestIdleCallback(processImage, { timeout: 3000 })
				} else {
					// Fallback for browsers without requestIdleCallback
					setTimeout(processImage, 0)
				}
			}

			img.onerror = () => {
				reject(new Error('Failed to load image'))
			}

			img.src = e.target?.result as string
		}

		reader.onerror = () => {
			reject(new Error('Failed to read file'))
		}

		reader.readAsDataURL(file)
	})
}

/**
 * Get image dimensions without fully loading it
 */
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
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

/**
 * Convert base64 to File object
 */
export function base64ToFile(base64: string, filename: string): File {
	const arr = base64.split(',')
	const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
	const bstr = atob(arr[1])
	let n = bstr.length
	const u8arr = new Uint8Array(n)

	while (n--) {
		u8arr[n] = bstr.charCodeAt(n)
	}

	return new File([u8arr], filename, { type: mime })
}