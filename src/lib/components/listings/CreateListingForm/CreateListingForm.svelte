<script lang="ts">
	import { superForm } from 'sveltekit-superforms'
	import { zodClient } from 'sveltekit-superforms/adapters'
	import { createListingSchema } from '$lib/schemas/listing'
	import { toast } from 'svelte-sonner'
	import { cn } from '$lib/utils'
	import { fade, slide } from 'svelte/transition'
	import { onMount } from 'svelte'
	import { 
		ChevronLeft, 
		ChevronRight, 
		Check, 
		Loader2,
		Save,
		AlertTriangle
	} from 'lucide-svelte'
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte'
	
	// Import context and components
	import { createFormStore, setFormContext } from './FormContext.svelte.ts'
	import { draftManager } from './utils/draft-manager'
	import ProductDetailsStep from './steps/ProductDetailsStep.svelte'
	import MediaUploadStep from './steps/MediaUploadStep.svelte'
	import PricingStep from './steps/PricingStep.svelte'
	import ShippingStep from './steps/ShippingStep.svelte'
	
	// Types
	import type { Database } from '$lib/types/database'
	type Category = Database['public']['Tables']['categories']['Row']
	
	interface Props {
		data: any
		categories: Category[]
		hasPaymentAccount?: boolean
	}
	
	let { data, categories = [], hasPaymentAccount = false }: Props = $props()
	
	// Create form store and set context
	const formStore = createFormStore()
	setFormContext(formStore)
	
	// Set categories
	formStore.setCategories(categories)
	
	// Initialize superForm for server integration with form data binding
	const { form: formData, enhance, errors } = superForm(data, {
		validators: zodClient(createListingSchema),
		dataType: 'json',
		resetForm: false,
		onResult: ({ result }) => {
			if (result.type === 'redirect') {
				// Clear draft on successful submission
				draftManager.delete()
				formStore.reset()
				toast.success('🎉 Your listing is live!')
				// Let SvelteKit handle the redirect naturally
			} else if (result.type === 'failure') {
				// Handle specific error types
				const error = result.data?.error
				if (typeof error === 'string') {
					if (error.includes('auth')) {
						toast.error('Session expired. Please log in again.')
						setTimeout(() => {
							window.location.href = '/login?redirect=/sell'
						}, 1000)
					} else if (error.includes('payment')) {
						toast.error('Payment account issue. Please check your settings.')
					} else if (error.includes('images')) {
						toast.error('Problem with images. Please re-upload.')
						formStore.goToStep(2)
					} else {
						toast.error(error || 'Failed to create listing. Please try again.')
					}
				} else {
					toast.error('Failed to create listing. Please try again.')
				}
				formStore.isSubmitting = false
			} else if (result.type === 'error') {
				toast.error('Server error. Please try again later.')
				formStore.isSubmitting = false
			}
		},
		onError: (error) => {
			console.error('Form submission error:', error)
			toast.error('An error occurred. Please try again.')
			formStore.isSubmitting = false
		}
	})
	
	// Sync form store data with superform data
	$effect(() => {
		// Update superform data when our form store changes
		$formData = {
			title: formStore.formData.title,
			description: formStore.formData.description,
			category_id: formStore.formData.category_id,
			subcategory_id: formStore.formData.subcategory_id,
			images: formStore.formData.images,
			price: formStore.formData.price,
			condition: formStore.formData.condition,
			color: formStore.formData.color,
			brand: formStore.formData.brand,
			size: formStore.formData.size,
			materials: formStore.formData.materials,
			location_city: formStore.formData.location_city,
			shipping_type: formStore.formData.shipping_type,
			shipping_cost: formStore.formData.shipping_cost,
			ships_worldwide: formStore.formData.ships_worldwide,
			tags: formStore.formData.tags
		}
	})
	
	// Check for draft on mount
	onMount(async () => {
		// Check for recoverable session
		const hasDraft = await draftManager.hasRecoverableSession()
		if (hasDraft) {
			const shouldRecover = confirm(
				'We found an unsaved listing draft. Would you like to continue where you left off?'
			)
			
			if (shouldRecover) {
				const draft = await draftManager.load()
				if (draft) {
					// Merge draft data
					formStore.formData = draftManager.mergeDraft(
						formStore.formData, 
						draft.formData
					)
					formStore.currentStep = draft.currentStep || 1
					toast.success('Draft restored successfully')
				}
			} else {
				// Clear the draft
				await draftManager.delete()
			}
		}
		
		// Start autosave
		draftManager.startAutoSave(
			() => formStore.formData,
			() => formStore.currentStep,
			30000 // 30 seconds
		)
	})
	
	// Clean up on unmount
	$effect(() => {
		return () => {
			draftManager.stopAutoSave()
		}
	})
	
	// Handle form submission with comprehensive error handling
	async function handleSubmit(e: SubmitEvent) {
		// Don't prevent default - let enhance handle it
		
		// Step 1: Validate all required fields
		if (!formStore.canSubmit) {
			e.preventDefault()
			// Show specific error for each step
			if (!formStore.isStep1Valid) {
				toast.error('Please complete product details: title, category, and description')
				formStore.goToStep(1)
				return
			}
			if (!formStore.isStep2Valid) {
				toast.error('Please add at least one photo')
				formStore.goToStep(2)
				return
			}
			if (!formStore.isStep3Valid) {
				toast.error('Please set price, condition, and color')
				formStore.goToStep(3)
				return
			}
			if (!formStore.isStep4Valid) {
				toast.error('Please enter your location and shipping details')
				formStore.goToStep(4)
				return
			}
			return
		}
		
		// Step 2: Check payment account
		if (!hasPaymentAccount) {
			e.preventDefault()
			toast.error('Please set up your payment account before listing items')
			return
		}
		
		// Step 3: Check for active uploads
		if (Object.keys(formStore.uploadProgress).length > 0) {
			e.preventDefault()
			toast.error('Please wait for all images to finish uploading')
			return
		}
		
		// Step 4: Final validation
		try {
			// Validate required fields have actual content
			if (formStore.formData.title.trim().length < 3) {
				throw new Error('Title must be at least 3 characters')
			}
			if (formStore.formData.description.trim().length < 10) {
				throw new Error('Description must be at least 10 characters')
			}
			if (formStore.formData.price <= 0) {
				throw new Error('Price must be greater than 0')
			}
			if (!formStore.formData.location_city.trim()) {
				throw new Error('Location is required')
			}
			if (formStore.formData.images.length === 0) {
				throw new Error('At least one image is required')
			}
		} catch (error: any) {
			e.preventDefault()
			toast.error(error.message)
			return
		}
		
		// If we get here, all validations passed
		formStore.isSubmitting = true
		// Let the form submit naturally with enhance
	}
	
	// Navigation helpers
	function goToNextStep() {
		if (formStore.nextStep()) {
			window.scrollTo({ top: 0, behavior: 'smooth' })
		} else {
			toast.error('Please complete all required fields')
		}
	}
	
	function goToPreviousStep() {
		formStore.previousStep()
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}
	
	function goToStep(step: number) {
		if (formStore.goToStep(step)) {
			window.scrollTo({ top: 0, behavior: 'smooth' })
		} else {
			toast.error('Please complete the current step first')
		}
	}
	
	// Get step completion status
	function getStepStatus(stepNumber: number) {
		if (stepNumber < formStore.currentStep) {
			return 'completed'
		} else if (stepNumber === formStore.currentStep) {
			return 'current'
		} else {
			return 'upcoming'
		}
	}
</script>

<form 
	method="POST" 
	action="/sell?/create" 
	use:enhance
	onsubmit={handleSubmit}
	class="min-h-screen bg-gray-50"
	aria-label="Create listing form"
	novalidate
>
	<!-- Header with progress -->
	<header class="bg-white border-b sticky top-0 z-20 shadow-sm">
		<div class="max-w-4xl mx-auto px-3 sm:px-4">
			<div class="flex items-center justify-between h-14 sm:h-16">
				<!-- Back button -->
				<a 
					href="/sell" 
					class="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
					title="Cancel and go back"
				>
					<ChevronLeft class="w-5 h-5" />
				</a>
				
				<!-- Progress indicator -->
				<div class="flex-1 mx-3 sm:mx-4 md:mx-8">
					<!-- Desktop step labels -->
					<div class="hidden sm:flex items-center justify-between mb-2">
						{#each formStore.steps as step}
							{@const status = getStepStatus(step.id)}
							<button
								type="button"
								onclick={() => goToStep(step.id)}
								disabled={status === 'upcoming'}
								class={cn(
									"text-xs font-medium transition-all duration-200 flex items-center gap-1",
									status === 'current' && "text-[#4F9FC5] scale-110 font-semibold",
									status === 'completed' && "text-green-600",
									status === 'upcoming' && "text-gray-400 cursor-not-allowed"
								)}
								title={step.description}
							>
								<span class="text-base">{step.icon}</span>
								<span>{step.name}</span>
							</button>
						{/each}
					</div>
					<!-- Mobile: Current step name -->
					<div class="sm:hidden text-center mb-1">
						<span class="text-sm font-medium text-gray-900 flex items-center justify-center gap-1">
							<span class="text-base">{formStore.steps[formStore.currentStep - 1]?.icon}</span>
							{formStore.steps[formStore.currentStep - 1]?.name}
						</span>
					</div>
					<ProgressBar 
						value={formStore.currentStep}
						max={formStore.totalSteps}
						size="sm"
						class="bg-gradient-to-r from-primary to-[#6BB6D8]"
					/>
				</div>
				
				<!-- Step counter -->
				<div class="text-sm font-medium text-gray-600 ml-3">
					{formStore.currentStep}/{formStore.totalSteps}
				</div>
			</div>
		</div>
	</header>
	
	<!-- Main content -->
	<main class="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-24">
		<div class="bg-white rounded-lg sm:rounded-xl shadow-sm">
			<div class="p-4 sm:p-6 md:p-8">
				<!-- Dynamic step content -->
				{#if formStore.currentStep === 1}
					<div transition:fade={{ duration: 200 }}>
						<ProductDetailsStep />
					</div>
				{:else if formStore.currentStep === 2}
					<div transition:fade={{ duration: 200 }}>
						<MediaUploadStep />
					</div>
				{:else if formStore.currentStep === 3}
					<div transition:fade={{ duration: 200 }}>
						<PricingStep />
					</div>
				{:else if formStore.currentStep === 4}
					<div transition:fade={{ duration: 200 }}>
						<ShippingStep />
					</div>
				{/if}
			</div>
			
			<!-- Navigation buttons -->
			<div class="border-t px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6 sticky bottom-0 bg-white sm:relative">
				<div class="flex items-center justify-between gap-2">
					<!-- Previous button -->
					{#if formStore.currentStep > 1}
						<button
							type="button"
							onclick={goToPreviousStep}
							class="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
						>
							<ChevronLeft class="w-4 h-4" />
							<span class="hidden sm:inline">Previous</span>
							<span class="sm:hidden">Back</span>
						</button>
					{:else}
						<div></div>
					{/if}
					
					<!-- Draft status - hidden on mobile for space -->
					<div class="hidden sm:flex items-center gap-4">
						{#if formStore.isAutoSaving}
							<span class="text-sm text-gray-500 flex items-center gap-2" transition:fade>
								<Loader2 class="w-3 h-3 animate-spin" />
								Saving draft...
							</span>
						{:else if formStore.lastSaved}
							<span class="text-sm text-gray-500 flex items-center gap-2" transition:fade>
								<Save class="w-3 h-3" />
								Draft saved
							</span>
						{/if}
					</div>
					
					<!-- Next/Submit button -->
					{#if formStore.currentStep < formStore.totalSteps}
						<button
							type="button"
							onclick={goToNextStep}
							disabled={!formStore.canProceedToNextStep()}
							class={cn(
								"inline-flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 text-sm sm:text-base font-medium rounded-lg transition-all duration-200",
								formStore.canProceedToNextStep()
									? "bg-gradient-to-r from-primary to-[#6BB6D8] text-white hover:from-[#6BB6D8] hover:to-[#4F9FC5] hover:shadow-md"
									: "bg-gray-100 text-gray-400 cursor-not-allowed"
							)}
						>
							Continue
							<ChevronRight class="w-4 h-4" />
						</button>
					{:else}
						<button
							type="submit"
							disabled={!formStore.canSubmit}
							class={cn(
								"inline-flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 text-sm sm:text-base font-medium rounded-lg transition-all duration-200",
								formStore.canSubmit
									? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:shadow-md"
									: "bg-gray-100 text-gray-400 cursor-not-allowed"
							)}
						>
							{#if formStore.isSubmitting}
								<Loader2 class="w-4 h-4 animate-spin" />
								<span class="hidden sm:inline">Publishing...</span>
								<span class="sm:hidden">Publishing</span>
							{:else}
								<Check class="w-4 h-4" />
								<span class="hidden sm:inline">Publish Listing</span>
								<span class="sm:hidden">Publish</span>
							{/if}
						</button>
					{/if}
				</div>
				
				<!-- Payment account warning -->
				{#if !hasPaymentAccount && formStore.currentStep === formStore.totalSteps}
					<div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg" transition:slide>
						<p class="text-sm text-amber-800 flex items-center gap-2">
							<AlertTriangle class="w-4 h-4 flex-shrink-0" />
							You need to set up your payment account before you can list items.
							<a href="/profile/settings" class="font-medium underline">
								Set up now
							</a>
						</p>
					</div>
				{/if}
			</div>
		</div>
		
		<!-- Mobile step indicator -->
		<div class="mt-6 flex justify-center gap-2 sm:hidden">
			{#each formStore.steps as step}
				{@const status = getStepStatus(step.id)}
				<button
					type="button"
					onclick={() => goToStep(step.id)}
					disabled={status === 'upcoming'}
					class={cn(
						"w-2 h-2 rounded-full transition-all duration-200",
						status === 'current' && "w-8 bg-gradient-to-r from-primary to-[#6BB6D8]",
						status === 'completed' && "bg-green-500",
						status === 'upcoming' && "bg-gray-300"
					)}
					aria-label={`Go to ${step.name}`}
				/>
			{/each}
		</div>
	</main>
	
</form>