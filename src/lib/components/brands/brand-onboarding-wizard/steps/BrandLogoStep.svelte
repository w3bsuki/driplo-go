<script lang="ts">
	import { Upload, Image as ImageIcon, X, Check, AlertCircle } from 'lucide-svelte';
	import { useImageUpload } from '../hooks/useImageUpload.svelte';

	interface Props {
		logoFile: File | null;
		logoPreview: string;
		logoUrl: string;
		supabase: any;
		onUpdate: (logoFile: File | null, logoPreview: string, logoUrl?: string) => void;
		onUploadStateChange?: (uploading: boolean) => void;
		disabled?: boolean;
	}

	let { 
		logoFile, 
		logoPreview, 
		logoUrl,
		supabase,
		onUpdate, 
		onUploadStateChange,
		disabled = false 
	}: Props = $props();

	// Initialize image upload hook
	const imageUpload = useImageUpload(supabase, {
		bucket: 'brand-assets',
		folder: 'logos',
		maxSizeBytes: 5 * 1024 * 1024, // 5MB
		allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
		maxDimensionPx: 1024,
		minDimensionPx: 100
	});

	let fileInput: HTMLInputElement;
	let dragActive = $state(false);

	// Watch upload state and notify parent
	$effect(() => {
		if (onUploadStateChange) {
			onUploadStateChange(imageUpload.isUploading);
		}
	});

	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (!file) return;

		const result = await imageUpload.uploadImage(file, 'brand-logo');
		
		if (result.success && result.url && result.preview) {
			onUpdate(result.file || file, result.preview, result.url);
		}
		
		// Reset file input
		input.value = '';
	}

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragActive = false;

		const files = event.dataTransfer?.files;
		const file = files?.[0];
		
		if (!file) return;

		const result = await imageUpload.uploadImage(file, 'brand-logo');
		
		if (result.success && result.url && result.preview) {
			onUpdate(result.file || file, result.preview, result.url);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		dragActive = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		dragActive = false;
	}

	function triggerFileSelect() {
		if (!disabled && !imageUpload.isUploading) {
			fileInput.click();
		}
	}

	async function removeLogo() {
		if (logoUrl) {
			await imageUpload.removeImage(logoUrl);
		}
		
		if (logoPreview && logoPreview.startsWith('blob:')) {
			imageUpload.cleanupPreview(logoPreview);
		}
		
		onUpdate(null, '', '');
	}

	function getDisplayImage(): string {
		return logoPreview || logoUrl;
	}

	function hasLogo(): boolean {
		return !!(logoFile || logoUrl || logoPreview);
	}
</script>

<!-- Brand Logo Step -->
<div class="space-y-6">
	<!-- Step Introduction -->
	<div class="text-center">
		<div class="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 mb-4">
			<ImageIcon class="w-6 h-6 text-brand-600" />
		</div>
		<h3 class="text-lg font-medium text-gray-900">Upload your brand logo</h3>
		<p class="mt-2 text-sm text-gray-600">
			Your logo is the face of your brand. Choose a high-quality image that represents your brand well.
		</p>
	</div>

	<!-- Upload Area -->
	{#if !hasLogo()}
		<div 
			class={`
				relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
				${dragActive 
					? 'border-brand-500 bg-brand-50' 
					: 'border-gray-300 hover:border-gray-400'
				}
				${disabled || imageUpload.isUploading 
					? 'opacity-50 cursor-not-allowed' 
					: 'cursor-pointer hover:bg-gray-50'
				}
			`}
			onclick={triggerFileSelect}
			ondrop={handleDrop}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			role="button"
			tabindex="0"
			aria-label="Upload brand logo"
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					triggerFileSelect();
				}
			}}
		>
			{#if imageUpload.isUploading}
				<!-- Uploading State -->
				<div class="space-y-4">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
					<div>
						<p class="text-sm font-medium text-gray-900">Uploading your logo...</p>
						<div class="mt-2 w-full bg-gray-200 rounded-full h-2">
							<div 
								class="bg-brand-500 h-2 rounded-full transition-all duration-300"
								style="width: {imageUpload.uploadProgress}%"
							></div>
						</div>
						<p class="text-xs text-gray-500 mt-1">{imageUpload.uploadProgress}%</p>
					</div>
				</div>
			{:else}
				<!-- Upload Prompt -->
				<div class="space-y-4">
					<div class="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
						<Upload class="w-8 h-8 text-gray-400" />
					</div>
					<div>
						<p class="text-lg font-medium text-gray-900">Upload your logo</p>
						<p class="text-sm text-gray-600 mt-1">
							Drag and drop your logo here, or click to browse
						</p>
					</div>
					<div class="text-xs text-gray-500 space-y-1">
						<p>Supported formats: JPG, PNG, WebP</p>
						<p>Max file size: 5MB</p>
						<p>Recommended size: 512×512px</p>
					</div>
				</div>
			{/if}

			<!-- Hidden File Input -->
			<input
				bind:this={fileInput}
				type="file"
				accept="image/jpeg,image/jpg,image/png,image/webp"
				onchange={handleFileSelect}
				class="hidden"
				{disabled}
			/>
		</div>
	{:else}
		<!-- Logo Preview -->
		<div class="space-y-4">
			<div class="relative max-w-xs mx-auto">
				<!-- Logo Image -->
				<div class="aspect-square bg-white border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
					<img
						src={getDisplayImage()}
						alt="Brand logo preview"
						class="w-full h-full object-contain"
					/>
				</div>

				<!-- Remove Button -->
				{#if !disabled && !imageUpload.isUploading}
					<button
						onclick={removeLogo}
						class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
						aria-label="Remove logo"
					>
						<X class="w-4 h-4" />
					</button>
				{/if}

				<!-- Upload Success Indicator -->
				{#if logoUrl}
					<div class="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center">
						<Check class="w-4 h-4" />
					</div>
				{/if}
			</div>

			<!-- Upload Status -->
			<div class="text-center">
				{#if logoUrl}
					<p class="text-sm text-green-600 font-medium">✓ Logo uploaded successfully</p>
				{:else if logoPreview}
					<p class="text-sm text-blue-600 font-medium">Preview ready - will upload when you proceed</p>
				{/if}
				
				<button
					onclick={triggerFileSelect}
					disabled={disabled || imageUpload.isUploading}
					class="mt-2 text-sm text-brand-600 hover:text-brand-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Change logo
				</button>
			</div>
		</div>
	{/if}

	<!-- Error Display -->
	{#if imageUpload.error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4">
			<div class="flex items-start space-x-2">
				<AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
				<div>
					<h4 class="text-sm font-medium text-red-900">Upload Error</h4>
					<p class="text-xs text-red-700 mt-1">{imageUpload.error}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Logo Guidelines -->
	<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
		<h4 class="text-sm font-medium text-blue-900 mb-2">📏 Logo Guidelines</h4>
		<ul class="text-xs text-blue-800 space-y-1">
			<li>• Use a square format (1:1 ratio) for best results</li>
			<li>• Ensure your logo is clear and readable at small sizes</li>
			<li>• Use high contrast colors for better visibility</li>
			<li>• Avoid text-heavy logos - simple designs work best</li>
			<li>• Make sure you have rights to use the logo</li>
		</ul>
	</div>

	<!-- Skip Option -->
	{#if !hasLogo()}
		<div class="text-center">
			<p class="text-xs text-gray-500">
				Don't have a logo yet? You can add one later in your brand settings.
			</p>
		</div>
	{/if}
</div>

<style>
	/* Loading spinner animation */
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.animate-spin {
		animation: spin 1s linear infinite;
	}

	/* Drag and drop visual feedback */
	.drag-active {
		border-color: var(--color-brand-500);
		background-color: var(--color-brand-50);
	}

	/* Focus styles for accessibility */
	[role="button"]:focus {
		outline: 2px solid var(--color-brand-500);
		outline-offset: 2px;
	}

	/* Image loading states */
	img {
		transition: opacity 0.3s ease;
	}

	img:not([src]) {
		opacity: 0;
	}

	/* Upload progress bar animation */
	.progress-bar {
		transition: width 0.3s ease;
	}
</style>