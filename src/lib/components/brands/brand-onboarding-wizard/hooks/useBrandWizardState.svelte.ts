/**
 * Brand Wizard State Management Hook
 * Centralizes wizard navigation, form data, validation, and step management
 */

interface BrandWizardState {
	// Navigation
	currentStep: number;
	totalSteps: number;
	canProceed: boolean;
	
	// Brand Basics (Step 1)
	brandName: string;
	brandCategory: string;
	brandDescription: string;
	
	// Brand Story (Step 3)
	brandStory: string;
	brandValues: string;
	brandMission: string;
	
	// Images (Steps 2 & 4)
	logoFile: File | null;
	logoPreview: string;
	logoUrl: string;
	coverFile: File | null;
	coverPreview: string;
	coverUrl: string;
	
	// Social Media (Step 5)
	websiteUrl: string;
	socialUrls: Record<string, string>;
	
	// State flags
	loading: boolean;
	uploadingLogo: boolean;
	uploadingCover: boolean;
	submitting: boolean;
}

interface BrandProfile {
	id?: string;
	name?: string;
	category?: string;
	description?: string;
	story?: string;
	values?: string;
	mission?: string;
	logo_url?: string;
	cover_image_url?: string;
	website_url?: string;
	social_urls?: Record<string, string>;
}

const WIZARD_STEPS = [
	{ id: 1, title: 'Brand Basics', description: 'Tell us about your brand' },
	{ id: 2, title: 'Brand Logo', description: 'Upload your brand logo' },
	{ id: 3, title: 'Brand Story', description: 'Share your brand story' },
	{ id: 4, title: 'Cover Image', description: 'Add a stunning cover image' },
	{ id: 5, title: 'Social Media', description: 'Connect your social presence' },
	{ id: 6, title: 'Review', description: 'Review and confirm details' }
];

export function useBrandWizardState(existingBrandProfile?: BrandProfile) {
	// Initialize state with existing data or defaults
	let state = $state<BrandWizardState>({
		// Navigation
		currentStep: 1,
		totalSteps: WIZARD_STEPS.length,
		canProceed: false,
		
		// Brand Basics
		brandName: existingBrandProfile?.name || '',
		brandCategory: existingBrandProfile?.category || '',
		brandDescription: existingBrandProfile?.description || '',
		
		// Brand Story
		brandStory: existingBrandProfile?.story || '',
		brandValues: existingBrandProfile?.values || '',
		brandMission: existingBrandProfile?.mission || '',
		
		// Images
		logoFile: null,
		logoPreview: '',
		logoUrl: existingBrandProfile?.logo_url || '',
		coverFile: null,
		coverPreview: '',
		coverUrl: existingBrandProfile?.cover_image_url || '',
		
		// Social Media
		websiteUrl: existingBrandProfile?.website_url || '',
		socialUrls: existingBrandProfile?.social_urls || {
			instagram: '',
			facebook: '',
			twitter: '',
			linkedin: '',
			tiktok: '',
			youtube: ''
		},
		
		// State flags
		loading: false,
		uploadingLogo: false,
		uploadingCover: false,
		submitting: false
	});

	// Step validation logic
	function validateCurrentStep(): boolean {
		switch (state.currentStep) {
			case 1: // Brand Basics
				return state.brandName.trim().length >= 2 && 
				       state.brandCategory.trim().length > 0 && 
				       state.brandDescription.trim().length >= 10;
			
			case 2: // Brand Logo
				return state.logoUrl.length > 0 || state.logoFile !== null;
			
			case 3: // Brand Story
				return state.brandStory.trim().length >= 50;
			
			case 4: // Cover Image
				return state.coverUrl.length > 0 || state.coverFile !== null;
			
			case 5: // Social Media
				// At least one social URL or website URL
				return state.websiteUrl.trim().length > 0 || 
				       Object.values(state.socialUrls).some(url => url.trim().length > 0);
			
			case 6: // Review
				return true; // Review step is always valid
			
			default:
				return false;
		}
	}

	// Update canProceed whenever relevant state changes
	$effect(() => {
		state.canProceed = validateCurrentStep();
	});

	// Navigation methods
	function nextStep() {
		if (state.canProceed && state.currentStep < state.totalSteps) {
			state.currentStep += 1;
		}
	}

	function previousStep() {
		if (state.currentStep > 1) {
			state.currentStep -= 1;
		}
	}

	function goToStep(step: number) {
		if (step >= 1 && step <= state.totalSteps) {
			state.currentStep = step;
		}
	}

	// State update methods
	function updateBrandBasics(updates: Partial<Pick<BrandWizardState, 'brandName' | 'brandCategory' | 'brandDescription'>>) {
		Object.assign(state, updates);
	}

	function updateBrandStory(updates: Partial<Pick<BrandWizardState, 'brandStory' | 'brandValues' | 'brandMission'>>) {
		Object.assign(state, updates);
	}

	function updateLogo(logoFile: File | null, logoPreview: string, logoUrl: string = '') {
		state.logoFile = logoFile;
		state.logoPreview = logoPreview;
		if (logoUrl) state.logoUrl = logoUrl;
	}

	function updateCover(coverFile: File | null, coverPreview: string, coverUrl: string = '') {
		state.coverFile = coverFile;
		state.coverPreview = coverPreview;
		if (coverUrl) state.coverUrl = coverUrl;
	}

	function updateSocialMedia(updates: Partial<Pick<BrandWizardState, 'websiteUrl' | 'socialUrls'>>) {
		Object.assign(state, updates);
	}

	function updateSocialUrl(platform: string, url: string) {
		state.socialUrls[platform] = url;
	}

	// Loading state methods
	function setLoading(loading: boolean) {
		state.loading = loading;
	}

	function setUploadingLogo(uploading: boolean) {
		state.uploadingLogo = uploading;
	}

	function setUploadingCover(uploading: boolean) {
		state.uploadingCover = uploading;
	}

	function setSubmitting(submitting: boolean) {
		state.submitting = submitting;
	}

	// Get current step info
	function getCurrentStepInfo() {
		return WIZARD_STEPS.find(step => step.id === state.currentStep) || WIZARD_STEPS[0];
	}

	// Get completion percentage
	function getCompletionPercentage(): number {
		const completedSteps = state.currentStep - 1;
		return Math.round((completedSteps / state.totalSteps) * 100);
	}

	// Check if step is completed
	function isStepCompleted(stepNumber: number): boolean {
		const currentStep = state.currentStep;
		state.currentStep = stepNumber;
		const isValid = validateCurrentStep();
		state.currentStep = currentStep;
		return isValid && stepNumber < state.currentStep;
	}

	// Get wizard data for submission
	function getWizardData(): BrandProfile {
		return {
			name: state.brandName,
			category: state.brandCategory,
			description: state.brandDescription,
			story: state.brandStory,
			values: state.brandValues,
			mission: state.brandMission,
			logo_url: state.logoUrl,
			cover_image_url: state.coverUrl,
			website_url: state.websiteUrl,
			social_urls: state.socialUrls
		};
	}

	// Reset wizard state
	function resetWizard() {
		state.currentStep = 1;
		state.brandName = '';
		state.brandCategory = '';
		state.brandDescription = '';
		state.brandStory = '';
		state.brandValues = '';
		state.brandMission = '';
		state.logoFile = null;
		state.logoPreview = '';
		state.logoUrl = '';
		state.coverFile = null;
		state.coverPreview = '';
		state.coverUrl = '';
		state.websiteUrl = '';
		state.socialUrls = {
			instagram: '',
			facebook: '',
			twitter: '',
			linkedin: '',
			tiktok: '',
			youtube: ''
		};
		state.loading = false;
		state.uploadingLogo = false;
		state.uploadingCover = false;
		state.submitting = false;
	}

	return {
		// State (read-only access)
		get state() { return state; },
		get steps() { return WIZARD_STEPS; },

		// Navigation
		nextStep,
		previousStep,
		goToStep,
		getCurrentStepInfo,
		getCompletionPercentage,
		isStepCompleted,

		// State updates
		updateBrandBasics,
		updateBrandStory,
		updateLogo,
		updateCover,
		updateSocialMedia,
		updateSocialUrl,

		// Loading states
		setLoading,
		setUploadingLogo,
		setUploadingCover,
		setSubmitting,

		// Utilities
		validateCurrentStep,
		getWizardData,
		resetWizard
	};
}

export type { BrandWizardState, BrandProfile };
export { WIZARD_STEPS };