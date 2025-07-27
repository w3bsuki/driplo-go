import type { CreateListingFormData } from '$lib/schemas/listing'

export interface DraftData {
	formData: Partial<CreateListingFormData>
	currentStep: number
	lastModified: string
	version: number
}

export class DraftManager {
	private static readonly STORAGE_KEY = 'listing_draft'
	private static readonly VERSION = 1
	private autoSaveTimer: NodeJS.Timeout | null = null
	
	// Save draft to localStorage and server
	async save(
		formData: Partial<CreateListingFormData>, 
		currentStep: number
	): Promise<boolean> {
		try {
			const draft: DraftData = {
				formData,
				currentStep,
				lastModified: new Date().toISOString(),
				version: DraftManager.VERSION
			}
			
			// Save to localStorage for immediate recovery
			this.saveToLocalStorage(draft)
			
			// Save to server
			const response = await fetch('/api/drafts/listing', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			})
			
			return response.ok
		} catch (error) {
			console.error('Failed to save draft:', error)
			// Even if server save fails, we have localStorage backup
			return false
		}
	}
	
	// Load draft from server or localStorage
	async load(): Promise<DraftData | null> {
		try {
			// Try server first
			const response = await fetch('/api/drafts/listing')
			if (response.ok) {
				const { draft, updated_at } = await response.json()
				if (draft) {
					return {
						formData: draft,
						currentStep: 1, // Server doesn't store step
						lastModified: updated_at,
						version: DraftManager.VERSION
					}
				}
			}
		} catch (error) {
			console.error('Failed to load draft from server:', error)
		}
		
		// Fallback to localStorage
		return this.loadFromLocalStorage()
	}
	
	// Delete draft from server and localStorage
	async delete(): Promise<boolean> {
		try {
			// Clear localStorage
			this.clearLocalStorage()
			
			// Delete from server
			const response = await fetch('/api/drafts/listing', {
				method: 'DELETE'
			})
			
			return response.ok
		} catch (error) {
			console.error('Failed to delete draft:', error)
			return false
		}
	}
	
	// Local storage operations
	private saveToLocalStorage(draft: DraftData): void {
		try {
			localStorage.setItem(DraftManager.STORAGE_KEY, JSON.stringify(draft))
		} catch (error) {
			console.error('Failed to save to localStorage:', error)
		}
	}
	
	private loadFromLocalStorage(): DraftData | null {
		try {
			const stored = localStorage.getItem(DraftManager.STORAGE_KEY)
			if (!stored) return null
			
			const draft = JSON.parse(stored) as DraftData
			
			// Check version compatibility
			if (draft.version !== DraftManager.VERSION) {
				this.clearLocalStorage()
				return null
			}
			
			// Check if draft is too old (24 hours)
			const age = Date.now() - new Date(draft.lastModified).getTime()
			if (age > 24 * 60 * 60 * 1000) {
				this.clearLocalStorage()
				return null
			}
			
			return draft
		} catch (error) {
			console.error('Failed to load from localStorage:', error)
			this.clearLocalStorage()
			return null
		}
	}
	
	private clearLocalStorage(): void {
		try {
			localStorage.removeItem(DraftManager.STORAGE_KEY)
		} catch (error) {
			console.error('Failed to clear localStorage:', error)
		}
	}
	
	// Auto-save functionality
	startAutoSave(
		getFormData: () => Partial<CreateListingFormData>,
		getCurrentStep: () => number,
		interval: number = 30000 // 30 seconds
	): void {
		this.stopAutoSave()
		
		this.autoSaveTimer = setInterval(async () => {
			const formData = getFormData()
			const currentStep = getCurrentStep()
			
			// Only save if there's actual content
			if (formData.title || formData.description || (formData.images?.length ?? 0) > 0) {
				await this.save(formData, currentStep)
			}
		}, interval)
	}
	
	stopAutoSave(): void {
		if (this.autoSaveTimer) {
			clearInterval(this.autoSaveTimer)
			this.autoSaveTimer = null
		}
	}
	
	// Check if there's a recoverable session
	async hasRecoverableSession(): Promise<boolean> {
		const draft = await this.load()
		return draft !== null && !!(
			draft.formData.title || 
			draft.formData.description || 
			(draft.formData.images?.length ?? 0) > 0
		)
	}
	
	// Merge draft with existing data
	mergeDraft(
		existing: Partial<CreateListingFormData>, 
		draft: Partial<CreateListingFormData>
	): Partial<CreateListingFormData> {
		// If existing has data, don't override with draft
		const hasExistingData = existing.title || 
			existing.description || 
			(existing.images?.length ?? 0) > 0
		
		if (hasExistingData) {
			return existing
		}
		
		// Otherwise use draft data
		return {
			...existing,
			...draft,
			// Ensure arrays are properly merged
			images: draft.images || existing.images || [],
			tags: draft.tags || existing.tags || [],
			materials: draft.materials || existing.materials || []
		}
	}
	
	// Export draft for debugging
	exportDraft(): string {
		const draft = this.loadFromLocalStorage()
		return JSON.stringify(draft, null, 2)
	}
	
	// Import draft (for testing)
	importDraft(draftJson: string): boolean {
		try {
			const draft = JSON.parse(draftJson) as DraftData
			this.saveToLocalStorage(draft)
			return true
		} catch (error) {
			console.error('Failed to import draft:', error)
			return false
		}
	}
}

// Singleton instance
export const draftManager = new DraftManager()