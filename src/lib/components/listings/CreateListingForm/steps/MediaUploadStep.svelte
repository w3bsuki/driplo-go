<script lang="ts">
	import { getFormContext } from '../FormContext.svelte.ts'
	import ImageUploader from '../components/ImageUploader.svelte'
	import { Camera, AlertCircle } from 'lucide-svelte'
	import { fade } from 'svelte/transition'
	
	const form = getFormContext()
	
	// Handle image changes
	function handleImagesChange(images: string[]) {
		form.formData.images = images
		form.hasUnsavedChanges = true
		
		// Clear any image-related errors
		if (images.length > 0) {
			form.clearFieldError('images')
		}
	}
	
	// Handle upload progress
	function handleUploadProgress(id: string, loaded: number, total: number) {
		form.updateUploadProgress(id, loaded, total)
	}
	
	// Check if we have any uploads in progress
	const hasActiveUploads = $derived(Object.keys(form.uploadProgress).length > 0)
	
	// Auto-save when images change
	$effect(() => {
		if (form.formData.images.length > 0 && !hasActiveUploads) {
			const timeout = setTimeout(() => {
				form.saveDraft()
			}, 3000)
			
			return () => clearTimeout(timeout)
		}
	})
</script>

<div class="space-y-8">
	<!-- Step Header -->
	<div>
		<h2 class="text-xl sm:text-2xl font-bold mb-2">Add Photos</h2>
		<p class="text-sm sm:text-base text-gray-600">Upload up to 10 photos of your item</p>
	</div>
	
	<!-- Main upload area -->
	<div>
		<ImageUploader
			images={form.formData.images}
			maxImages={10}
			onImagesChange={handleImagesChange}
			onUploadProgress={handleUploadProgress}
		/>
		
		{#if form.validationErrors.images}
			<p class="mt-2 text-sm text-red-500 flex items-center gap-1" transition:fade>
				<AlertCircle class="w-4 h-4" />
				{form.validationErrors.images}
			</p>
		{/if}
	</div>
	
	<!-- Photo requirements -->
	<div class="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
		<h3 class="font-medium text-gray-900">
			Photo Guidelines
		</h3>
		
		<div class="grid md:grid-cols-2 gap-4 text-sm">
			<div class="bg-white rounded-lg p-3">
				<h4 class="font-medium text-green-700 mb-2">Do's</h4>
				<ul class="text-gray-600 space-y-1.5 list-disc list-inside">
					<li>Use good lighting (natural is best)</li>
					<li>Show the actual item clearly</li>
					<li>Include different angles</li>
					<li>Show any flaws or wear</li>
					<li>Include brand tags/labels</li>
				</ul>
			</div>
			
			<div class="bg-white rounded-lg p-3">
				<h4 class="font-medium text-red-700 mb-2">Don'ts</h4>
				<ul class="text-gray-600 space-y-1.5 list-disc list-inside">
					<li>No filters or heavy editing</li>
					<li>No stock photos</li>
					<li>No watermarks or text</li>
					<li>No unrelated items in frame</li>
					<li>No inappropriate content</li>
				</ul>
			</div>
		</div>
	</div>
	
	<!-- Quick tips -->
	{#if form.formData.images.length === 0}
		<div class="text-center py-8">
			<div class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
				<Camera class="w-8 h-8 text-gray-600" />
			</div>
			<h3 class="text-lg font-medium mb-2 text-gray-900">
				Great photos = Faster sales
			</h3>
			<p class="text-gray-600 max-w-md mx-auto">
				Listings with high-quality photos sell <span class="font-semibold text-[#4F9FC5]">3x faster</span>. 
				Make sure your first photo clearly shows what you're selling!
			</p>
		</div>
	{:else}
		<div class="flex items-center justify-between text-sm">
			<div class="text-gray-600">
				{form.formData.images.length} photo{form.formData.images.length === 1 ? '' : 's'} uploaded
			</div>
			{#if form.isAutoSaving}
				<div class="text-gray-500 flex items-center gap-2">
					<div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
					Saving photos...
				</div>
			{:else if form.lastSaved && form.formData.images.length > 0}
				<div class="text-gray-500">
					Photos saved
				</div>
			{/if}
		</div>
	{/if}
	
	<!-- Upload progress indicator - responsive positioning -->
	{#if hasActiveUploads}
		<div class="fixed bottom-20 sm:bottom-4 right-2 sm:right-4 left-2 sm:left-auto bg-white rounded-lg shadow-lg p-3 sm:p-4 sm:min-w-[300px] max-w-sm z-50" transition:fade>
			<h4 class="font-medium text-sm sm:text-base mb-2">Uploading photos...</h4>
			{#each Object.entries(form.uploadProgress) as [id, progress]}
				<div class="mb-2">
					<div class="flex justify-between text-xs sm:text-sm mb-1">
						<span class="text-gray-600">Photo {id.substring(0, 8)}</span>
						<span class="text-gray-900">{progress.percentage}%</span>
					</div>
					<div class="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
						<div 
							class="bg-gradient-to-r from-primary to-[#6BB6D8] h-full rounded-full transition-all duration-300"
							style="width: {progress.percentage}%"
						/>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>