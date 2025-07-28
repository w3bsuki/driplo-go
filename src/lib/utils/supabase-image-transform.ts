import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export interface ImageTransformOptions {
	width?: number;
	height?: number;
	quality?: number; // 20-100, defaults to 80
	resize?: 'contain' | 'cover' | 'fill';
	format?: 'webp' | 'avif' | 'jpg' | 'png';
}

interface ImageUrlOptions extends ImageTransformOptions {
	bucket: string;
	path: string;
}

/**
 * Generate a transformed image URL using Supabase's image transformation service
 * This provides on-the-fly image optimization without pre-processing
 */
export function getTransformedImageUrl({
	bucket,
	path,
	width,
	height,
	quality = 80,
	resize = 'cover',
	format
}: ImageUrlOptions): string {
	// Base URL for Supabase storage
	const baseUrl = `${PUBLIC_SUPABASE_URL}/storage/v1/render/image/public/${bucket}/${path}`;
	
	// Build query parameters
	const params = new URLSearchParams();
	
	if (width) params.append('width', width.toString());
	if (height) params.append('height', height.toString());
	if (quality !== 80) params.append('quality', quality.toString());
	if (resize !== 'cover') params.append('resize', resize);
	if (format) params.append('format', format);
	
	const queryString = params.toString();
	return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Generate a srcset string for responsive images with transformations
 */
export function generateTransformedSrcSet(
	bucket: string,
	path: string,
	options: {
		widths?: number[];
		quality?: number;
		format?: 'webp' | 'avif' | 'jpg' | 'png';
	} = {}
): string {
	const { widths = [400, 800, 1200, 1600], quality = 80, format } = options;
	
	return widths
		.map(width => {
			const url = getTransformedImageUrl({
				bucket,
				path,
				width,
				quality,
				format
			});
			return `${url} ${width}w`;
		})
		.join(', ');
}

/**
 * Generate modern format picture sources
 */
export function generatePictureSources(
	bucket: string,
	path: string,
	options: {
		widths?: number[];
		formats?: Array<'avif' | 'webp' | 'jpg'>;
		quality?: number;
	} = {}
) {
	const { 
		widths = [400, 800, 1200, 1600], 
		formats = ['avif', 'webp', 'jpg'],
		quality = 80 
	} = options;
	
	return formats.map(format => ({
		type: `image/${format}`,
		srcset: generateTransformedSrcSet(bucket, path, { widths, quality, format })
	}));
}

/**
 * Helper to extract bucket and path from a Supabase storage URL
 */
export function parseStorageUrl(url: string): { bucket: string; path: string } | null {
	const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
	if (!match) return null;
	
	return {
		bucket: match[1] ?? '',
		path: match[2] ?? ''
	};
}

/**
 * Transform an existing Supabase storage URL with optimization parameters
 */
export function transformStorageUrl(
	url: string,
	options: ImageTransformOptions
): string {
	const parsed = parseStorageUrl(url);
	if (!parsed) return url; // Return original if not a valid storage URL
	
	return getTransformedImageUrl({
		...parsed,
		...options
	});
}

/**
 * Get optimal image format based on browser support
 * This should be used with Accept header detection in production
 */
export function getOptimalFormat(acceptHeader?: string): 'avif' | 'webp' | 'jpg' {
	if (!acceptHeader) return 'jpg';
	
	if (acceptHeader.includes('image/avif')) return 'avif';
	if (acceptHeader.includes('image/webp')) return 'webp';
	return 'jpg';
}

/**
 * Generate responsive image data for the ResponsiveImage component
 * with Supabase transformations
 */
export function generateResponsiveImageData(
	bucket: string,
	path: string,
	options: {
		sizes?: Record<string, number>;
		quality?: number;
		format?: 'webp' | 'avif' | 'jpg' | 'png';
	} = {}
): Record<string, string> {
	const {
		sizes = {
			thumb: 150,
			small: 400,
			medium: 800,
			large: 1200,
			full: 2400
		},
		quality = 80,
		format
	} = options;
	
	const result: Record<string, string> = {};
	
	for (const [size, width] of Object.entries(sizes)) {
		result[size] = getTransformedImageUrl({
			bucket,
			path,
			width,
			quality,
			format
		});
	}
	
	return result;
}