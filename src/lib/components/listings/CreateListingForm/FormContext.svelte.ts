import { getContext, setContext } from 'svelte'
import type { CreateListingFormData } from '$lib/schemas/listing'

export interface ValidationError {
	field: string
	message: string
}

export interface UploadProgress {
	[key: string]: {
		loaded: number
		total: number
		percentage: number
	}
}

export class ListingFormStore {
	// Core form data with $state
	formData = $state<CreateListingFormData>({
		title: '',
		description: '',
		category_id: '',
		subcategory_id: null,
		images: [],
		price: 0,
		condition: 'new_with_tags',
		color: '',
		brand: null,
		size: null,
		materials: [],
		location_city: '',
		shipping_type: 'standard',
		shipping_cost: 0,
		ships_worldwide: false,
		tags: []
	})
	
	// UI state
	currentStep = $state(1)
	validationErrors = $state<Record<string, string>>({})
	isSubmitting = $state(false)
	uploadProgress = $state<UploadProgress>({})
	totalSteps = 4
	
	// Draft management
	draftId = $state<string | null>(null)
	lastSaved = $state<Date | null>(null)
	hasUnsavedChanges = $state(false)
	isAutoSaving = $state(false)
	
	// Categories state
	categories = $state<any[]>([])
	subcategories = $state<any[]>([])
	
	// Step validation states - using $derived for reactivity
	isStep1Valid = $derived(
		this.formData.title.trim().length >= 3 &&
		!!this.formData.category_id &&
		this.formData.description.trim().length >= 10
	)
	
	isStep2Valid = $derived(
		this.formData.images.length > 0
	)
	
	isStep3Valid = $derived(
		this.formData.price > 0 &&
		!!this.formData.condition &&
		!!this.formData.color.trim()
	)
	
	isStep4Valid = $derived(
		!!this.formData.location_city.trim() &&
		!!this.formData.shipping_type
	)
	
	// Overall form validation
	isFormValid = $derived(
		this.isStep1Valid && 
		this.isStep2Valid && 
		this.isStep3Valid && 
		this.isStep4Valid
	)
	
	// Can proceed to next step
	canProceedToNextStep() {
		switch (this.currentStep) {
			case 1: return this.isStep1Valid
			case 2: return this.isStep2Valid
			case 3: return this.isStep3Valid
			case 4: return this.isStep4Valid
			default: return false
		}
	}
	
	// Can submit form
	canSubmit = $derived(
		this.isFormValid && 
		!this.isSubmitting && 
		Object.keys(this.uploadProgress).length === 0
	)
	
	// Step configuration
	steps = [
		{ 
			id: 1, 
			name: 'Details', 
			description: 'Title, category & description',
			icon: '📝'
		},
		{ 
			id: 2, 
			name: 'Photos', 
			description: 'Add up to 10 photos',
			icon: '📸'
		},
		{ 
			id: 3, 
			name: 'Pricing', 
			description: 'Set price & condition',
			icon: '💰'
		},
		{ 
			id: 4, 
			name: 'Shipping', 
			description: 'Location & delivery',
			icon: '📦'
		}
	]
	
	// Methods
	updateField<K extends keyof CreateListingFormData>(
		field: K, 
		value: CreateListingFormData[K]
	) {
		this.formData[field] = value
		this.hasUnsavedChanges = true
		this.clearFieldError(field as string)
		
		// Auto-trigger validation for critical fields
		if (['title', 'description', 'price', 'location_city'].includes(field as string)) {
			this.validateField(field as string, value)
		}
	}
	
	updateMultipleFields(updates: Partial<CreateListingFormData>) {
		Object.entries(updates).forEach(([field, value]) => {
			this.updateField(field as keyof CreateListingFormData, value)
		})
	}
	
	validateField(field: string, value: any) {
		// Field-specific validation logic
		switch (field) {
			case 'title':
				if (!value || value.trim().length < 3) {
					this.setFieldError(field, 'Title must be at least 3 characters')
				} else if (value.length > 100) {
					this.setFieldError(field, 'Title must be less than 100 characters')
				}
				break
			case 'description':
				if (!value || value.trim().length < 10) {
					this.setFieldError(field, 'Description must be at least 10 characters')
				} else if (value.length > 2000) {
					this.setFieldError(field, 'Description must be less than 2000 characters')
				}
				break
			case 'price':
				if (!value || value <= 0) {
					this.setFieldError(field, 'Price must be greater than 0')
				} else if (value > 100000) {
					this.setFieldError(field, 'Price must be less than 100,000')
				}
				break
			case 'location_city':
				if (!value || value.trim().length < 2) {
					this.setFieldError(field, 'Please enter a valid city')
				}
				break
		}
	}
	
	setFieldError(field: string, message: string) {
		this.validationErrors[field] = message
	}
	
	clearFieldError(field: string) {
		delete this.validationErrors[field]
	}
	
	clearAllErrors() {
		this.validationErrors = {}
	}
	
	goToStep(step: number) {
		if (step < 1 || step > this.totalSteps) return
		
		// Validate current step before moving forward
		if (step > this.currentStep && !this.canProceedToNextStep()) {
			return false
		}
		
		this.currentStep = step
		return true
	}
	
	nextStep() {
		if (this.currentStep < this.totalSteps && this.canProceedToNextStep()) {
			this.currentStep++
			return true
		}
		return false
	}
	
	previousStep() {
		if (this.currentStep > 1) {
			this.currentStep--
			return true
		}
		return false
	}
	
	addImage(url: string) {
		if (this.formData.images.length < 10) {
			this.formData.images = [...this.formData.images, url]
			this.hasUnsavedChanges = true
		}
	}
	
	removeImage(index: number) {
		this.formData.images = this.formData.images.filter((_, i) => i !== index)
		this.hasUnsavedChanges = true
	}
	
	reorderImages(fromIndex: number, toIndex: number) {
		const images = [...this.formData.images]
		const [removed] = images.splice(fromIndex, 1)
		if (removed) {
			images.splice(toIndex, 0, removed)
			this.formData.images = images
			this.hasUnsavedChanges = true
		}
	}
	
	updateUploadProgress(id: string, loaded: number, total: number) {
		if (loaded === total) {
			// Remove from progress when complete
			const { [id]: _, ...rest } = this.uploadProgress
			this.uploadProgress = rest
		} else {
			this.uploadProgress[id] = {
				loaded,
				total,
				percentage: Math.round((loaded / total) * 100)
			}
		}
	}
	
	setCategories(categories: any[]) {
		this.categories = categories
	}
	
	setSubcategories(subcategories: any[]) {
		this.subcategories = subcategories
	}
	
	reset() {
		this.formData = {
			title: '',
			description: '',
			category_id: '',
			subcategory_id: null,
			images: [],
			price: 0,
			condition: 'new_with_tags',
			color: '',
			brand: null,
			size: null,
			materials: [],
			location_city: '',
			shipping_type: 'standard',
			shipping_cost: 0,
			ships_worldwide: false,
			tags: []
		}
		this.currentStep = 1
		this.validationErrors = {}
		this.isSubmitting = false
		this.uploadProgress = {}
		this.hasUnsavedChanges = false
		this.draftId = null
		this.lastSaved = null
	}
	
	// Draft management methods
	async saveDraft() {
		if (!this.hasUnsavedChanges || this.isAutoSaving) return
		
		this.isAutoSaving = true
		try {
			const response = await fetch('/api/drafts/listing', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(this.formData)
			})
			
			if (response.ok) {
				const data = await response.json()
				this.lastSaved = new Date()
				this.hasUnsavedChanges = false
				this.draftId = data.id
			}
		} catch (error) {
			console.error('Failed to save draft:', error)
		} finally {
			this.isAutoSaving = false
		}
	}
	
	async loadDraft() {
		try {
			const response = await fetch('/api/drafts/listing')
			if (response.ok) {
				const { draft } = await response.json()
				if (draft) {
					this.formData = { ...this.formData, ...draft }
					this.hasUnsavedChanges = false
				}
			}
		} catch (error) {
			console.error('Failed to load draft:', error)
		}
	}
	
	async deleteDraft() {
		if (!this.draftId) return
		
		try {
			await fetch('/api/drafts/listing', { method: 'DELETE' })
			this.draftId = null
			this.lastSaved = null
		} catch (error) {
			console.error('Failed to delete draft:', error)
		}
	}
}

// Context key
const FORM_CONTEXT_KEY = Symbol('listing-form-context')

// Helper to set context
export function setFormContext(store: ListingFormStore) {
	setContext(FORM_CONTEXT_KEY, store)
}

// Helper to get context
export function getFormContext(): ListingFormStore {
	const context = getContext<ListingFormStore | undefined>(FORM_CONTEXT_KEY)
	if (!context) {
		throw new Error('Form context not found. Make sure to wrap your component with CreateListingForm.')
	}
	return context
}

// Create a new store instance
export function createFormStore() {
	return new ListingFormStore()
}