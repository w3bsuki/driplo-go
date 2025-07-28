import { PUBLIC_SUPABASE_URL } from '$env/static/public'

export interface ImageTransformOptions {
	/**
	 * Width of the image in pixels
	 */
	width?: number
	/**
	 * Height of the image in pixels
	 */
	height?: number
	/**
	 * Resize mode
	 * - 'cover': Resizes to cover both provided dimensions (default)
	 * - 'contain': Resizes to fit within the dimensions
	 * - 'fill': Stretches to fill dimensions exactly
	 */
	resize?: 'cover' | 'contain' | 'fill'
	/**
	 * Image quality (0-100, default 80)
	 */
	quality?: number
	/**
	 * Output format
	 * Note: Supabase automatically serves WebP to supported browsers
	 */
	format?: 'origin' | 'webp' | 'jpg' | 'png'
}

/**
 * Generate a transformed image URL using Supabase Image Transformation API
 */
export function getTransformedImageUrl(
	bucketName: string,
	path: string,
	options: ImageTransformOptions = {}
): string {
	// Build transformation parameters
	const params = new URLSearchParams()
	
	if (options.width) params.append('width', options.width.toString())
	if (options.height) params.append('height', options.height.toString())
	if (options.resize) params.append('resize', options.resize)
	if (options.quality) params.append('quality', options.quality.toString())
	if (options.format && options.format !== 'origin') {
		params.append('format', options.format)
	}
	
	const queryString = params.toString()
	const transformPath = queryString ? `?${queryString}` : ''
	
	return `${PUBLIC_SUPABASE_URL}/storage/v1/render/image/public/${bucketName}/${path}${transformPath}`
}

/**
 * Generate a srcset for responsive images
 */
export function generateSrcSet(
	bucketName: string,
	path: string,
	widths: number[],
	options: Omit<ImageTransformOptions, 'width'> = {}
): string {
	return widths
		.map(width => {
			const url = getTransformedImageUrl(bucketName, path, { ...options, width })
			return `${url} ${width}w`
		})
		.join(', ')
}

/**
 * Common image size presets for the marketplace
 */
export const imageSizes = {
	thumbnail: { width: 150, height: 150, resize: 'cover' as const },
	card: { width: 300, height: 400, resize: 'cover' as const },
	cardMobile: { width: 200, height: 267, resize: 'cover' as const },
	detail: { width: 600, height: 800, resize: 'contain' as const },
	detailLarge: { width: 1200, height: 1600, resize: 'contain' as const },
	avatar: { width: 100, height: 100, resize: 'cover' as const },
	avatarLarge: { width: 200, height: 200, resize: 'cover' as const },
	banner: { width: 1200, height: 400, resize: 'cover' as const },
	bannerMobile: { width: 600, height: 200, resize: 'cover' as const }
}

/**
 * Get optimized image URL with fallback
 */
export function getOptimizedImageUrl(
	imageUrl: string | null | undefined,
	size: keyof typeof imageSizes = 'card',
	customOptions?: ImageTransformOptions
): string {
	if (!imageUrl) {
		return '/images/placeholder.jpg'
	}
	
	// Check if it's a Supabase storage URL
	if (imageUrl.includes('/storage/v1/object/public/')) {
		// Extract bucket and path from URL
		const match = imageUrl.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/)
		if (match) {
			const [, bucket, path] = match
			return getTransformedImageUrl(bucket ?? '', path ?? '', {
				...imageSizes[size],
				...customOptions
			})
		}
	}
	
	// Return original URL if not a Supabase storage URL
	return imageUrl
}

/**
 * Generate responsive image props for use in img elements
 */
export function getResponsiveImageProps(
	imageUrl: string | null | undefined,
	alt: string,
	sizes: string = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
) {
	if (!imageUrl || !imageUrl.includes('/storage/v1/object/public/')) {
		return {
			src: imageUrl || '/images/placeholder.jpg',
			alt
		}
	}
	
	// Extract bucket and path
	const match = imageUrl.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/)
	if (!match) {
		return { src: imageUrl, alt }
	}
	
	const [, bucket, path] = match
	
	// Generate multiple sizes for srcset
	const widths = [200, 300, 400, 600, 800, 1200]
	const srcset = generateSrcSet(bucket ?? '', path ?? '', widths, { quality: 80 })
	
	// Use medium size as default src
	const src = getTransformedImageUrl(bucket ?? '', path ?? '', { width: 600, quality: 80 })
	
	return {
		src,
		srcset,
		sizes,
		alt,
		loading: 'lazy' as const,
		decoding: 'async' as const
	}
}

/**
 * Check if browser supports modern image formats
 */
export function supportsModernFormats(): boolean {
	if (typeof window === 'undefined') return false
	
	// Check WebP support
	const canvas = document.createElement('canvas')
	canvas.width = canvas.height = 1
	return canvas.toDataURL('image/webp').indexOf('image/webp') === 5
}