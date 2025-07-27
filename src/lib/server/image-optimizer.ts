import sharp from 'sharp';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';

export interface ImageSize {
	width: number;
	height: number;
	suffix: string;
}

export interface OptimizedImage {
	url: string;
	path: string;
	width: number;
	height: number;
}

export interface OptimizationResult {
	original: OptimizedImage;
	responsive: {
		thumb: OptimizedImage;
		small: OptimizedImage;
		medium: OptimizedImage;
		large: OptimizedImage;
	};
	srcSet: string;
}

// Define responsive image sizes
const IMAGE_SIZES: Record<string, ImageSize> = {
	thumb: { width: 150, height: 150, suffix: 'thumb' },
	small: { width: 400, height: 400, suffix: 'small' },
	medium: { width: 800, height: 800, suffix: 'medium' },
	large: { width: 1200, height: 1200, suffix: 'large' }
};

export class ImageOptimizer {
	private supabase: SupabaseClient<Database>;

	constructor(supabase: SupabaseClient<Database>) {
		this.supabase = supabase;
	}

	/**
	 * Optimize and upload an image with multiple sizes
	 */
	async optimizeAndUpload(
		file: Buffer,
		fileName: string,
		bucket: 'avatars' | 'covers' | 'listings' | 'brand-logos',
		userId?: string
	): Promise<OptimizationResult> {
		const baseFileName = fileName.split('.')[0];
		const results: Partial<OptimizationResult> = {
			responsive: {} as any
		};

		// Process original image (convert to WebP)
		const originalWebP = await sharp(file)
			.webp({ quality: 85 })
			.toBuffer();

		const originalMetadata = await sharp(file).metadata();
		const originalPath = this.getFilePath(`${baseFileName}.webp`, bucket, userId);

		// Upload original
		const { data: originalData, error: originalError } = await this.supabase.storage
			.from(bucket)
			.upload(originalPath, originalWebP, {
				contentType: 'image/webp',
				cacheControl: '31536000', // 1 year cache
				upsert: false
			});

		if (originalError) throw originalError;

		const { data: { publicUrl: originalUrl } } = this.supabase.storage
			.from(bucket)
			.getPublicUrl(originalData.path);

		results.original = {
			url: originalUrl,
			path: originalData.path,
			width: originalMetadata.width || 0,
			height: originalMetadata.height || 0
		};

		// Generate responsive sizes
		const srcSetParts: string[] = [];

		for (const [sizeName, size] of Object.entries(IMAGE_SIZES)) {
			const resizedBuffer = await sharp(file)
				.resize(size.width, size.height, {
					fit: 'inside',
					withoutEnlargement: true
				})
				.webp({ quality: 80 })
				.toBuffer();

			const resizedPath = this.getFilePath(
				`${baseFileName}_${size.suffix}.webp`,
				bucket,
				userId
			);

			const { data: resizedData, error: resizedError } = await this.supabase.storage
				.from(bucket)
				.upload(resizedPath, resizedBuffer, {
					contentType: 'image/webp',
					cacheControl: '31536000', // 1 year cache
					upsert: false
				});

			if (resizedError) throw resizedError;

			const { data: { publicUrl } } = this.supabase.storage
				.from(bucket)
				.getPublicUrl(resizedData.path);

			const resizedMetadata = await sharp(resizedBuffer).metadata();

			results.responsive![sizeName as keyof typeof results.responsive] = {
				url: publicUrl,
				path: resizedData.path,
				width: resizedMetadata.width || size.width,
				height: resizedMetadata.height || size.height
			};

			srcSetParts.push(`${publicUrl} ${resizedMetadata.width}w`);
		}

		results.srcSet = srcSetParts.join(', ');

		return results as OptimizationResult;
	}

	/**
	 * Delete all versions of an image
	 */
	async deleteAllVersions(
		basePath: string,
		bucket: 'avatars' | 'covers' | 'listings' | 'brand-logos'
	): Promise<void> {
		const baseFileName = basePath.split('/').pop()?.split('.')[0];
		if (!baseFileName) return;

		const filesToDelete = [
			basePath, // Original
			...Object.values(IMAGE_SIZES).map(size =>
				basePath.replace(/\.[^.]+$/, `_${size.suffix}.webp`)
			)
		];

		await this.supabase.storage
			.from(bucket)
			.remove(filesToDelete);
	}

	/**
	 * Get file path with proper folder structure
	 */
	private getFilePath(
		fileName: string,
		_bucket: 'avatars' | 'covers' | 'listings' | 'brand-logos',
		userId?: string
	): string {
		if (userId) {
			return `${userId}/${fileName}`;
		}
		return fileName;
	}

	/**
	 * Get responsive image URLs from a base URL
	 */
	static getResponsiveUrls(baseUrl: string): Record<string, string> {
		const urls: Record<string, string> = {
			original: baseUrl
		};

		// If it's already a WebP, generate responsive URLs
		if (baseUrl.includes('.webp')) {
			const baseWithoutExt = baseUrl.replace('.webp', '');
			urls['thumb'] = `${baseWithoutExt}_thumb.webp`;
			urls['small'] = `${baseWithoutExt}_small.webp`;
			urls['medium'] = `${baseWithoutExt}_medium.webp`;
			urls['large'] = `${baseWithoutExt}_large.webp`;
		}

		return urls;
	}
}