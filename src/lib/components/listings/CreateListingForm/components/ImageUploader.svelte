<script lang="ts">
	import { cn } from '$lib/utils'
	import { fade, scale } from 'svelte/transition'
	import { flip } from 'svelte/animate'
	import { Upload, X, Image as ImageIcon, Loader2, AlertCircle, Move } from 'lucide-svelte'
	import { 
		validateImageFile, 
		compressImage, 
		formatFileSize,
		createImagePreview,
		processImages,
		isDuplicateImage,
		generateImageHash
	} from '../utils/image-processor'
	import { toast } from 'svelte-sonner'
	
	interface Props {
		images: string[]
		maxImages?: number
		onImagesChange: (images: string[]) => void
		onUploadProgress?: (id: string, loaded: number, total: number) => void
	}
	
	let { 
		images = [], 
		maxImages = 10,
		onImagesChange,
		onUploadProgress
	}: Props = $props()
	
	// Local state
	let isDragging = $state(false)
	let dragCounter = $state(0)
	let uploadingFiles = $state<Map<string, { name: string; progress: number }>>(new Map())
	let imageHashes = $state<Set<string>>(new Set())
	let fileInput: HTMLInputElement
	let dropZone: HTMLDivElement
	
	// Drag state for reordering
	let draggedIndex = $state<number | null>(null)
	let dropTargetIndex = $state<number | null>(null)
	
	// Can upload more images
	const canUploadMore = $derived(images.length + uploadingFiles.size < maxImages)
	const remainingSlots = $derived(maxImages - images.length)
	
	// Handle file selection
	async function handleFiles(files: FileList | File[]) {
		const fileArray = Array.from(files)
		
		// Check if we can upload more
		if (!canUploadMore) {
			toast.error(`Maximum ${maxImages} images allowed`)
			return
		}
		
		// Filter and validate files
		const validFiles: File[] = []
		for (const file of fileArray) {
			// Stop if we hit the limit
			if (images.length + validFiles.length >= maxImages) {
				toast.warning(`Only ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'} allowed`)
				break
			}
			
			// Validate file
			const validation = validateImageFile(file)
			if (!validation.valid) {
				toast.error(`${file.name}: ${validation.error}`)
				continue
			}
			
			// Check for duplicates
			const isDuplicate = await isDuplicateImage(file, imageHashes)
			if (isDuplicate) {
				toast.warning(`${file.name} appears to be a duplicate`)
				continue
			}
			
			validFiles.push(file)
		}
		
		if (validFiles.length === 0) return
		
		// Process and upload files
		uploadFiles(validFiles)
	}
	
	async function uploadFiles(files: File[]) {
		// Process images with compression
		const processedFiles = await processImages(files, {
			maxWidth: 2000,
			maxHeight: 2000,
			quality: 0.85
		}, (processed, total) => {
			// Update UI during processing
		})
		
		// Upload each file
		for (const file of processedFiles) {
			const tempId = Math.random().toString(36)
			uploadingFiles.set(tempId, { name: file.name, progress: 0 })
			
			try {
				// Generate hash for duplicate detection
				const hash = await generateImageHash(file)
				imageHashes.add(hash)
				
				// Create form data
				const formData = new FormData()
				formData.append('file', file)
				
				// Upload with progress tracking
				const xhr = new XMLHttpRequest()
				
				xhr.upload.addEventListener('progress', (e) => {
					if (e.lengthComputable) {
						const progress = Math.round((e.loaded / e.total) * 100)
						uploadingFiles.set(tempId, { name: file.name, progress })
						onUploadProgress?.(tempId, e.loaded, e.total)
					}
				})
				
				xhr.addEventListener('load', () => {
					if (xhr.status === 200) {
						try {
							const response = JSON.parse(xhr.responseText)
							const newImages = [...images, response.url]
							onImagesChange(newImages)
							
							// Success feedback without complex calculation
							toast.success(`${file.name} uploaded successfully`)
						} catch (error) {
							toast.error(`Failed to process ${file.name}`)
						}
					} else {
						toast.error(`Failed to upload ${file.name}`)
					}
					uploadingFiles.delete(tempId)
				})
				
				xhr.addEventListener('error', () => {
					toast.error(`Failed to upload ${file.name}`)
					uploadingFiles.delete(tempId)
					imageHashes.delete(hash)
				})
				
				xhr.open('POST', '/api/upload/simple')
				xhr.send(formData)
				
			} catch (error) {
				console.error('Upload error:', error)
				toast.error(`Failed to upload ${file.name}`)
				uploadingFiles.delete(tempId)
			}
		}
	}
	
	// Drag and drop handlers
	function handleDragEnter(e: DragEvent) {
		e.preventDefault()
		e.stopPropagation()
		dragCounter++
		if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
			isDragging = true
		}
	}
	
	function handleDragLeave(e: DragEvent) {
		e.preventDefault()
		e.stopPropagation()
		dragCounter--
		if (dragCounter === 0) {
			isDragging = false
		}
	}
	
	function handleDragOver(e: DragEvent) {
		e.preventDefault()
		e.stopPropagation()
	}
	
	function handleDrop(e: DragEvent) {
		e.preventDefault()
		e.stopPropagation()
		isDragging = false
		dragCounter = 0
		
		if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
			handleFiles(e.dataTransfer.files)
		}
	}
	
	// Image reordering
	function handleImageDragStart(e: DragEvent, index: number) {
		draggedIndex = index
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move'
			e.dataTransfer.setData('text/html', '')
		}
	}
	
	function handleImageDragOver(e: DragEvent, index: number) {
		e.preventDefault()
		if (draggedIndex !== null && draggedIndex !== index) {
			dropTargetIndex = index
		}
	}
	
	function handleImageDrop(e: DragEvent, index: number) {
		e.preventDefault()
		if (draggedIndex !== null && draggedIndex !== index) {
			const newImages = [...images]
			const [removed] = newImages.splice(draggedIndex, 1)
			newImages.splice(index, 0, removed)
			onImagesChange(newImages)
		}
		draggedIndex = null
		dropTargetIndex = null
	}
	
	// Remove image
	function removeImage(index: number) {
		const newImages = images.filter((_, i) => i !== index)
		onImagesChange(newImages)
		
	}
	
	// Paste from clipboard
	function handlePaste(e: ClipboardEvent) {
		const items = e.clipboardData?.items
		if (!items) return
		
		const imageFiles: File[] = []
		for (const item of items) {
			if (item.type.startsWith('image/')) {
				const file = item.getAsFile()
				if (file) imageFiles.push(file)
			}
		}
		
		if (imageFiles.length > 0) {
			handleFiles(imageFiles)
			toast.success('Image pasted from clipboard')
		}
	}
	
	// Global paste listener
	$effect(() => {
		document.addEventListener('paste', handlePaste)
		return () => document.removeEventListener('paste', handlePaste)
	})
</script>

<div class="space-y-4">
	<!-- Upload area -->
	<div
		bind:this={dropZone}
		class={cn(
			"relative border-2 border-dashed rounded-lg transition-all duration-200",
			isDragging 
				? "border-blue-500 bg-blue-50" 
				: "border-gray-300 hover:border-gray-400",
			!canUploadMore && "opacity-50 cursor-not-allowed"
		)}
		ondragenter={handleDragEnter}
		ondragleave={handleDragLeave}
		ondragover={handleDragOver}
		ondrop={handleDrop}
	>
		<input
			bind:this={fileInput}
			type="file"
			accept="image/*"
			multiple
			onchange={(e) => e.currentTarget.files && handleFiles(e.currentTarget.files)}
			class="hidden"
			disabled={!canUploadMore}
		/>
		
		<button
			type="button"
			onclick={() => canUploadMore && fileInput.click()}
			disabled={!canUploadMore}
			class={cn(
				"w-full p-6 sm:p-8 flex flex-col items-center justify-center gap-3",
				"transition-colors rounded-lg",
				canUploadMore && "hover:bg-gray-50 active:bg-gray-100"
			)}
		>
			<div class={cn(
				"w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center",
				isDragging ? "bg-blue-100" : "bg-gray-100"
			)}>
				<Upload class={cn("w-6 h-6 sm:w-8 sm:h-8", isDragging ? "text-blue-600" : "text-gray-400")} />
			</div>
			
			<div class="text-center">
				<p class="font-medium text-gray-900 text-sm sm:text-base">
					{#if isDragging}
						Drop images here
					{:else if canUploadMore}
						<span class="sm:hidden">Tap to upload photos</span>
						<span class="hidden sm:inline">Click to upload or drag and drop</span>
					{:else}
						Maximum {maxImages} images reached
					{/if}
				</p>
				<p class="text-xs sm:text-sm text-gray-500 mt-1">
					{#if canUploadMore}
						PNG, JPG, WebP up to 10MB • {remainingSlots} slot{remainingSlots === 1 ? '' : 's'} left
					{:else}
						Remove images to upload more
					{/if}
				</p>
			</div>
			
			{#if canUploadMore}
				<p class="text-xs text-purple-600 hidden sm:block bg-purple-50 rounded-lg px-3 py-1.5 inline-block mt-2">
					💡 Pro tip: You can also paste images from clipboard (Ctrl+V)
				</p>
			{/if}
		</button>
	</div>
	
	<!-- Image grid -->
	{#if images.length > 0 || uploadingFiles.size > 0}
		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
			<!-- Uploaded images -->
			{#each images as image, index (image)}
				<div
					class={cn(
						"relative aspect-square group rounded-lg overflow-hidden",
						"border-2 transition-all duration-200",
						dropTargetIndex === index ? "border-blue-500 scale-105" : "border-transparent",
						draggedIndex === index && "opacity-50"
					)}
					draggable="true"
					ondragstart={(e) => handleImageDragStart(e, index)}
					ondragover={(e) => handleImageDragOver(e, index)}
					ondrop={(e) => handleImageDrop(e, index)}
					animate:flip={{ duration: 200 }}
				>
					<img 
						src={image} 
						alt={`Product image ${index + 1}`}
						class="w-full h-full object-cover"
						loading="lazy"
					/>
					
					<!-- Overlay - always visible on mobile for easier interaction -->
					<div class="absolute inset-0 bg-black bg-opacity-0 sm:group-hover:bg-opacity-40 transition-all duration-200">
						<!-- Remove button - always visible on mobile -->
						<button
							type="button"
							onclick={() => removeImage(index)}
							class={cn(
								"absolute top-1 right-1 sm:top-2 sm:right-2",
								"w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full shadow-lg",
								"flex items-center justify-center",
								"opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
							)}
							aria-label="Remove image"
						>
							<X class="w-4 h-4" />
						</button>
						
						<!-- Drag handle - hidden on mobile -->
						<div class="absolute bottom-2 left-2 text-white opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
							<Move class="w-4 h-4" />
						</div>
						
						<!-- Image number -->
						{#if index === 0}
							<div class="absolute top-1 left-1 sm:top-2 sm:left-2 bg-blue-600 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
								Main photo
							</div>
						{/if}
					</div>
				</div>
			{/each}
			
			<!-- Uploading files -->
			{#each [...uploadingFiles.entries()] as [id, file]}
				<div 
					class="relative aspect-square bg-gray-100 rounded-lg flex flex-col items-center justify-center p-4"
					transition:scale
				>
					<Loader2 class="w-8 h-8 animate-spin text-gray-400 mb-2" />
					<p class="text-xs text-gray-600 text-center truncate w-full">{file.name}</p>
					<div class="w-full bg-gray-200 rounded-full h-1 mt-2">
						<div 
							class="bg-blue-600 h-1 rounded-full transition-all duration-300"
							style="width: {file.progress}%"
						/>
					</div>
					<p class="text-xs text-gray-500 mt-1">{file.progress}%</p>
				</div>
			{/each}
		</div>
	{/if}
	
	<!-- Instructions -->
	{#if images.length === 0}
		<div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
			<h4 class="font-medium text-amber-900 mb-2 flex items-center gap-2">
				<ImageIcon class="w-4 h-4" />
				Photo tips for better sales
			</h4>
			<ul class="text-sm text-amber-800 space-y-1">
				<li>• Use natural lighting for accurate colors</li>
				<li>• Show item from multiple angles</li>
				<li>• Include close-ups of labels and any flaws</li>
				<li>• First photo will be your main listing image</li>
			</ul>
		</div>
	{/if}
</div>