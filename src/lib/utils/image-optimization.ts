// Image optimization utilities

export interface ImageConfig {
	width?: number
	height?: number
	quality?: number
	format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png'
	blur?: number
	fit?: 'contain' | 'cover' | 'fill' | 'inside' | 'outside'
}

export interface ResponsiveImageConfig {
	breakpoints: number[]
	sizes: string
	quality: number
	formats: string[]
}

// Default responsive configuration
export const defaultResponsiveConfig: ResponsiveImageConfig = {
	breakpoints: [320, 480, 640, 768, 1024, 1280, 1536],
	sizes: '100vw',
	quality: 80,
	formats: ['avif', 'webp', 'jpeg']
}

// Common image configurations
export const imageConfigs = {
	// Listing cards
	listingCard: {
		width: 400,
		height: 600,
		quality: 80,
		fit: 'cover' as const,
		sizes: '(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 12.5vw'
	},
	
	// Listing detail hero
	listingHero: {
		width: 800,
		height: 1200,
		quality: 90,
		fit: 'cover' as const,
		sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 800px'
	},
	
	// Profile avatars
	avatar: {
		width: 100,
		height: 100,
		quality: 85,
		fit: 'cover' as const,
		sizes: '100px'
	},
	
	// Thumbnails
	thumbnail: {
		width: 150,
		height: 150,
		quality: 75,
		fit: 'cover' as const,
		sizes: '150px'
	},
	
	// Message attachments
	messageAttachment: {
		width: 400,
		height: 300,
		quality: 80,
		fit: 'cover' as const,
		sizes: '(max-width: 640px) 90vw, 400px'
	}
}

// Generate srcset for responsive images
export function generateSrcSet(
	baseUrl: string,
	config: { width?: number; breakpoints?: number[]; quality?: number } = {}
): string {
	const { width = 800, breakpoints = defaultResponsiveConfig.breakpoints, quality = 80 } = config
	
	// Filter breakpoints to only include ones smaller than or equal to the max width
	const validBreakpoints = breakpoints.filter(bp => bp <= width)
	
	if (validBreakpoints.length === 0) {
		return baseUrl
	}
	
	// Generate URLs for each breakpoint
	const sources: string[] = []
	
	validBreakpoints.forEach(bp => {
		const url = optimizeImageUrl(baseUrl, { width: bp, quality })
		sources.push(`${url} ${bp}w`)
	})
	
	return sources.join(', ')
}

// Optimize image URL based on the service
export function optimizeImageUrl(url: string, config: ImageConfig): string {
	if (!url) return url
	
	try {
		const urlObj = new URL(url)
		
		// Supabase Storage optimization
		if (urlObj.hostname.includes('supabase')) {
			const params = new URLSearchParams()
			if (config.width) params.set('width', config.width.toString())
			if (config.height) params.set('height', config.height.toString())
			if (config.quality) params.set('quality', config.quality.toString())
			if (config.format && config.format !== 'auto') params.set('format', config.format)
			
			const paramString = params.toString()
			return paramString ? `${url}?${paramString}` : url
		}
		
		// Cloudflare Images optimization
		if (urlObj.hostname.includes('cloudflare')) {
			const params = new URLSearchParams()
			if (config.width) params.set('width', config.width.toString())
			if (config.height) params.set('height', config.height.toString())
			if (config.quality) params.set('quality', config.quality.toString())
			if (config.format && config.format !== 'auto') params.set('format', config.format)
			
			const paramString = params.toString()
			return paramString ? `${url}?${paramString}` : url
		}
		
		// Placeholder images (picsum, etc.)
		if (urlObj.hostname.includes('picsum.photos')) {
			const pathParts = urlObj.pathname.split('/')
			if (config.width && config.height) {
				pathParts[1] = config.width.toString()
				pathParts[2] = config.height.toString()
			}
			
			const params = new URLSearchParams(urlObj.search)
			if (config.blur) params.set('blur', config.blur.toString())
			
			const newPath = pathParts.join('/')
			const paramString = params.toString()
			return `${urlObj.origin}${newPath}${paramString ? `?${paramString}` : ''}`
		}
		
		// Return original URL if no optimization is available
		return url
	} catch (error) {
		// Return original URL if parsing fails
		return url
	}
}

// Generate placeholder image URL
export function generatePlaceholderUrl(
	originalUrl: string,
	config: { width?: number; height?: number; blur?: number } = {}
): string {
	const { width = 100, height = 150, blur = 5 } = config
	
	// Use a low-quality version of the original image if possible
	const optimizedUrl = optimizeImageUrl(originalUrl, {
		width: Math.min(width, 100),
		height: Math.min(height, 150),
		quality: 10,
		blur
	})
	
	// Fallback to picsum if optimization fails
	if (optimizedUrl === originalUrl) {
		return `https://picsum.photos/${width}/${height}?blur=${blur}&random=1`
	}
	
	return optimizedUrl
}

// Check if image format is supported
export function isImageFormatSupported(format: string): boolean {
	if (typeof window === 'undefined') return false
	
	const canvas = document.createElement('canvas')
	canvas.width = 1
	canvas.height = 1
	
	try {
		const dataUrl = canvas.toDataURL(`image/${format}`)
		return dataUrl.startsWith(`data:image/${format}`)
	} catch {
		return false
	}
}

// Get best supported image format
export function getBestSupportedFormat(): 'avif' | 'webp' | 'jpeg' {
	if (typeof window === 'undefined') return 'jpeg'
	
	// Check for AVIF support
	if (isImageFormatSupported('avif')) {
		return 'avif'
	}
	
	// Check for WebP support
	if (isImageFormatSupported('webp')) {
		return 'webp'
	}
	
	// Fallback to JPEG
	return 'jpeg'
}

// Preload critical images
export function preloadImage(url: string, config: ImageConfig = {}): Promise<void> {
	return new Promise((resolve, reject) => {
		const img = new Image()
		
		img.onload = () => resolve()
		img.onerror = reject
		
		// Set up srcset for responsive images
		if (config.width) {
			const srcSet = generateSrcSet(url, config)
			if (srcSet) {
				img.srcset = srcSet
			}
		}
		
		img.src = optimizeImageUrl(url, config)
	})
}

// Batch preload multiple images
export function preloadImages(urls: string[], config: ImageConfig = {}): Promise<void[]> {
	const promises = urls.map(url => preloadImage(url, config))
	return Promise.all(promises)
}

// Image loading priority hints
export const imagePriorities = {
	// Critical images that should load immediately
	critical: ['hero', 'above-fold', 'first-card'],
	
	// Important images that should load soon
	high: ['visible-cards', 'profile-avatar'],
	
	// Normal priority images
	normal: ['below-fold', 'lazy-load'],
	
	// Low priority images
	low: ['far-below-fold', 'hover-preview']
} as const

export type ImagePriority = keyof typeof imagePriorities