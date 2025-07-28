/**
 * Image Upload Management Hook
 * Handles file selection, validation, preview generation, and Supabase storage upload
 */

import { logger } from '$lib/services/logger';
import { toast } from 'svelte-sonner';

interface ImageUploadConfig {
	maxSizeBytes?: number;
	allowedTypes?: string[];
	maxDimensionPx?: number;
	minDimensionPx?: number;
	bucket: string;
	folder: string;
}

interface ImageUploadResult {
	success: boolean;
	url?: string;
	error?: string;
	file?: File;
	preview?: string;
}

const DEFAULT_CONFIG: Partial<ImageUploadConfig> = {
	maxSizeBytes: 5 * 1024 * 1024, // 5MB
	allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
	maxDimensionPx: 2048,
	minDimensionPx: 100
};

export function useImageUpload(supabase: any, config: ImageUploadConfig) {
	const uploadConfig = { ...DEFAULT_CONFIG, ...config };
	
	let isUploading = $state(false);
	let uploadProgress = $state(0);
	let error = $state<string | null>(null);

	// Validate file size and type
	function validateFile(file: File): { valid: boolean; error?: string } {
		// Check file type
		if (!uploadConfig.allowedTypes?.includes(file.type)) {
			return {
				valid: false,
				error: `File type not supported. Please use: ${uploadConfig.allowedTypes?.join(', ')}`
			};
		}

		// Check file size
		if (uploadConfig.maxSizeBytes && file.size > uploadConfig.maxSizeBytes) {
			const maxSizeMB = uploadConfig.maxSizeBytes / (1024 * 1024);
			return {
				valid: false,
				error: `File too large. Maximum size: ${maxSizeMB}MB`
			};
		}

		return { valid: true };
	}

	// Validate image dimensions
	async function validateImageDimensions(file: File): Promise<{ valid: boolean; error?: string }> {
		return new Promise((resolve) => {
			const img = new Image();
			const url = URL.createObjectURL(file);

			img.onload = () => {
				URL.revokeObjectURL(url);

				const { width, height } = img;

				// Check minimum dimensions
				if (uploadConfig.minDimensionPx && (width < uploadConfig.minDimensionPx || height < uploadConfig.minDimensionPx)) {
					resolve({
						valid: false,
						error: `Image too small. Minimum dimensions: ${uploadConfig.minDimensionPx}x${uploadConfig.minDimensionPx}px`
					});
					return;
				}

				// Check maximum dimensions
				if (uploadConfig.maxDimensionPx && (width > uploadConfig.maxDimensionPx || height > uploadConfig.maxDimensionPx)) {
					resolve({
						valid: false,
						error: `Image too large. Maximum dimensions: ${uploadConfig.maxDimensionPx}x${uploadConfig.maxDimensionPx}px`
					});
					return;
				}

				resolve({ valid: true });
			};

			img.onerror = () => {
				URL.revokeObjectURL(url);
				resolve({
					valid: false,
					error: 'Invalid image file'
				});
			};

			img.src = url;
		});
	}

	// Generate preview URL for image
	function generatePreview(file: File): string {
		return URL.createObjectURL(file);
	}

	// Clean up preview URL
	function cleanupPreview(previewUrl: string) {
		if (previewUrl.startsWith('blob:')) {
			URL.revokeObjectURL(previewUrl);
		}
	}

	// Compress image if needed (basic implementation)
	async function compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> {
		return new Promise((resolve) => {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d')!;
			const img = new Image();

			img.onload = () => {
				// Calculate new dimensions
				let { width, height } = img;
				if (width > maxWidth) {
					height = (height * maxWidth) / width;
					width = maxWidth;
				}

				// Set canvas dimensions
				canvas.width = width;
				canvas.height = height;

				// Draw and compress
				ctx.drawImage(img, 0, 0, width, height);
				
				canvas.toBlob(
					(blob) => {
						if (blob) {
							const compressedFile = new File([blob], file.name, {
								type: file.type,
								lastModified: Date.now()
							});
							resolve(compressedFile);
						} else {
							resolve(file); // Fallback to original
						}
					},
					file.type,
					quality
				);
			};

			img.src = URL.createObjectURL(file);
		});
	}

	// Upload file to Supabase storage
	async function uploadToStorage(file: File, fileName: string): Promise<{ success: boolean; url?: string; error?: string }> {
		try {
			isUploading = true;
			uploadProgress = 0;
			error = null;

			logger.debug('🔄 Starting file upload:', { fileName, size: file.size, type: file.type });

			// Generate unique filename
			const timestamp = Date.now();
			const randomSuffix = Math.random().toString(36).substring(2, 8);
			const fileExtension = file.name.split('.').pop() || 'jpg';
			const uniqueFileName = `${fileName}_${timestamp}_${randomSuffix}.${fileExtension}`;
			const filePath = `${config.folder}/${uniqueFileName}`;

			// Upload to Supabase storage
			const { data, error: uploadError } = await supabase.storage
				.from(config.bucket)
				.upload(filePath, file, {
					cacheControl: '3600',
					upsert: false
				});

			if (uploadError) {
				throw new Error(`Upload failed: ${uploadError.message}`);
			}

			// Get public URL
			const { data: { publicUrl } } = supabase.storage
				.from(config.bucket)
				.getPublicUrl(filePath);

			uploadProgress = 100;
			logger.debug('✅ File uploaded successfully:', { filePath, publicUrl });

			return {
				success: true,
				url: publicUrl
			};

		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Upload failed';
			error = errorMessage;
			logger.error('❌ File upload failed:', err);
			
			return {
				success: false,
				error: errorMessage
			};
		} finally {
			isUploading = false;
		}
	}

	// Main upload function with full validation pipeline
	async function uploadImage(file: File, fileName: string): Promise<ImageUploadResult> {
		try {
			// Step 1: Basic file validation
			const fileValidation = validateFile(file);
			if (!fileValidation.valid) {
				toast.error(fileValidation.error);
				return {
					success: false,
					error: fileValidation.error
				};
			}

			// Step 2: Image dimension validation
			const dimensionValidation = await validateImageDimensions(file);
			if (!dimensionValidation.valid) {
				toast.error(dimensionValidation.error);
				return {
					success: false,
					error: dimensionValidation.error
				};
			}

			// Step 3: Compress if needed
			let processedFile = file;
			if (file.size > 1024 * 1024) { // Compress files larger than 1MB
				logger.debug('🔄 Compressing image...', { originalSize: file.size });
				processedFile = await compressImage(file);
				logger.debug('✅ Image compressed:', { newSize: processedFile.size });
			}

			// Step 4: Generate preview
			const preview = generatePreview(processedFile);

			// Step 5: Upload to storage
			const uploadResult = await uploadToStorage(processedFile, fileName);

			if (uploadResult.success) {
				toast.success('Image uploaded successfully!');
				return {
					success: true,
					url: uploadResult.url,
					file: processedFile,
					preview
				};
			} else {
				toast.error(uploadResult.error || 'Upload failed');
				cleanupPreview(preview);
				return {
					success: false,
					error: uploadResult.error
				};
			}

		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Upload failed';
			logger.error('❌ Image upload failed:', err);
			toast.error(errorMessage);
			
			return {
				success: false,
				error: errorMessage
			};
		}
	}

	// Remove uploaded image from storage
	async function removeImage(url: string): Promise<{ success: boolean; error?: string }> {
		try {
			// Extract file path from URL
			const urlParts = url.split('/');
			const fileName = urlParts[urlParts.length - 1];
			const filePath = `${config.folder}/${fileName}`;

			const { error: deleteError } = await supabase.storage
				.from(config.bucket)
				.remove([filePath]);

			if (deleteError) {
				throw new Error(`Delete failed: ${deleteError.message}`);
			}

			logger.debug('✅ Image removed successfully:', { filePath });
			return { success: true };

		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Delete failed';
			logger.error('❌ Image deletion failed:', err);
			
			return {
				success: false,
				error: errorMessage
			};
		}
	}

	// Handle file input change
	async function handleFileSelect(event: Event, fileName: string): Promise<ImageUploadResult> {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) {
			return {
				success: false,
				error: 'No file selected'
			};
		}

		return await uploadImage(file, fileName);
	}

	// Reset upload state
	function resetUploadState() {
		isUploading = false;
		uploadProgress = 0;
		error = null;
	}

	return {
		// State
		get isUploading() { return isUploading; },
		get uploadProgress() { return uploadProgress; },
		get error() { return error; },

		// Methods
		uploadImage,
		removeImage,
		handleFileSelect,
		generatePreview,
		cleanupPreview,
		validateFile,
		validateImageDimensions,
		resetUploadState
	};
}

export type { ImageUploadConfig, ImageUploadResult };