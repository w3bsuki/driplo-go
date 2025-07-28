<script lang="ts">
	import { Upload, X, Camera, Loader2, AlertCircle } from 'lucide-svelte'
	import { Button } from '$lib/components/ui'
	import { cn } from '$lib/utils'
	import * as m from '$lib/paraglide/messages.js'
	import { toast } from 'svelte-sonner'

	interface Props {
		currentImage?: string
		placeholder?: string
		aspectRatio?: 'square' | 'cover' | 'free'
		maxSizeBytes?: number
		allowedTypes?: string[]
		class?: string
		disabled?: boolean
		onupload?: (data: { file: File; preview: string }) => void
		onremove?: () => void
		onerror?: (error: string) => void
		loading?: boolean
	}

	let {
		currentImage = '',
		placeholder = m.upload_placeholder(),
		aspectRatio = 'square',
		maxSizeBytes = 5 * 1024 * 1024, // 5MB default
		allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
		class: className = '',
		disabled = false,
		onupload,
		onremove,
		onerror,
		loading = false
	}: Props = $props()

	let fileInput: HTMLInputElement
	let previewUrl = $state('')
	let dragOver = $state(false)
	let uploading = $state(false)
	let processing = $state(false)
	let error = $state('')

	// Initialize preview with current image
	$effect(() => {
		previewUrl = currentImage
	})

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement
		const file = target.files?.[0]
		if (file) {
			processFile(file)
		}
		// Reset input to allow selecting same file again
		target.value = ''
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault()
		dragOver = false
		
		const file = event.dataTransfer?.files[0]
		if (file) {
			processFile(file)
		}
	}

	function processFile(file: File) {
		error = ''
		processing = true

		// Validate file type
		if (!allowedTypes.includes(file.type)) {
			error = m.upload_error_type({ types: allowedTypes.map(t => t.split('/')[1]).join(', ') })
			toast.error(error)
			onerror?.(error)
			processing = false
			return
		}

		// Validate file size
		if (file.size > maxSizeBytes) {
			error = m.upload_error_size({ size: Math.round(maxSizeBytes / 1024 / 1024) })
			toast.error(error)
			onerror?.(error)
			processing = false
			return
		}

		// Show processing message for large files
		if (file.size > 2 * 1024 * 1024) {
			toast.info('Processing large image...')
		}

		// Create preview
		const reader = new FileReader()
		reader.onload = (e) => {
			previewUrl = e.target?.result as string
			onupload?.({ file, preview: previewUrl })
			processing = false
		}
		reader.onerror = () => {
			error = 'Failed to read file'
			toast.error(error)
			onerror?.(error)
			processing = false
		}
		reader.readAsDataURL(file)
	}

	function handleRemoveImage() {
		previewUrl = ''
		currentImage = ''
		if (fileInput) {
			fileInput.value = ''
		}
		onremove?.()
	}

	function triggerFileInput() {
		if (!disabled) {
			fileInput?.click()
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault()
		dragOver = true
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault()
		dragOver = false
	}

	// Get aspect ratio classes
	const aspectClasses = $derived(() => {
		switch (aspectRatio) {
			case 'square':
				return 'aspect-square'
			case 'cover':
				return 'aspect-[3/1]'
			case 'free':
			default:
				return 'min-h-[200px]'
		}
	})
</script>

<div class={cn("relative", className)}>
	<input
		bind:this={fileInput}
		type="file"
		accept={allowedTypes.join(',')}
		onchange={handleFileSelect}
		class="hidden"
		{disabled}
	/>

	<div
		class={cn(
			"relative border-2 border-dashed rounded-lg transition-all",
			aspectClasses,
			dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
			(disabled || loading || processing) && "opacity-50 cursor-not-allowed",
			previewUrl ? "border-solid border-border" : "",
			!(disabled || loading || processing) && "cursor-pointer"
		)}
		onclick={handleDisabled || loading || processing ? undefined : triggerFileInput}
		ondragover={disabled || loading || processing ? undefined : handleDragOver}
		ondragleave={disabled || loading || processing ? undefined : handleDragLeave}
		ondrop={disabled || loading || processing ? undefined : handleDrop}
	>
		{#if previewUrl}
			<!-- Image Preview -->
			<div class="relative w-full h-full">
				<img
					src={previewUrl}
					alt="Preview"
					class="w-full h-full object-cover rounded-lg"
				/>
				
				<!-- Remove Button -->
				{#if !disabled && !loading && !processing}
					<button
						onclick={(e) => {
							e.stopPropagation()
							handleRemoveImage()
						}}
						class="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
					>
						<X class="h-4 w-4" />
					</button>
				{/if}

				<!-- Loading Overlay -->
				{#if loading || processing}
					<div class="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
						<div class="text-white text-center">
							<Loader2 class="h-8 w-8 animate-spin mx-auto mb-2" />
							<p class="text-sm font-medium">
								{processing ? 'Processing...' : 'Uploading...'}
							</p>
						</div>
					</div>
				{:else if !disabled}
					<!-- Change Image Overlay -->
					<div class="absolute inset-0 bg-black/0 hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
						<div class="flex items-center gap-2 text-white">
							<Camera class="h-5 w-5" />
							<span class="text-sm font-medium">{m.upload_change_image()}</span>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<!-- Upload Placeholder -->
			<div class="flex flex-col items-center justify-center h-full p-6 text-center">
				{#if uploading || processing}
					<Loader2 class="h-8 w-8 animate-spin text-muted-foreground mb-2" />
					<p class="text-sm text-muted-foreground">
						{processing ? 'Processing image...' : m.upload_uploading()}
					</p>
				{:else}
					<Upload class="h-8 w-8 text-muted-foreground mb-2" />
					<p class="text-sm font-medium text-foreground mb-1">{placeholder}</p>
					<p class="text-xs text-muted-foreground">
						{m.upload_drag_drop()}
					</p>
					<p class="text-xs text-muted-foreground mt-1">
						{m.upload_file_types({ types: allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', '), size: Math.round(maxSizeBytes / 1024 / 1024) })}
					</p>
				{/if}
			</div>
		{/if}
	</div>

	{#if error}
		<p class="text-sm text-destructive mt-2">{error}</p>
	{/if}
</div>