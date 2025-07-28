import { browser } from '$app/environment';
import type { User } from '@supabase/supabase-js';

interface OnboardingState {
	hasSeenWelcome: boolean;
	hasCompletedProfile: boolean;
	hasCreatedFirstListing: boolean;
	hasMadeFirstPurchase: boolean;
	currentStep: number;
	showWelcomeModal: boolean;
}

const defaultState: OnboardingState = {
	hasSeenWelcome: false,
	hasCompletedProfile: false,
	hasCreatedFirstListing: false,
	hasMadeFirstPurchase: false,
	currentStep: 0,
	showWelcomeModal: false
};

class OnboardingStore {
	private state = $state<OnboardingState>(defaultState);
	private userId: string | null = null;
	
	constructor() {
		// Initialize from localStorage if available
		if (browser) {
			const savedUserId = localStorage.getItem('onboarding_user_id');
			if (savedUserId) {
				this.initialize(savedUserId);
			}
		}
	}
	
	get hasSeenWelcome() {
		return this.state.hasSeenWelcome;
	}
	
	get hasCompletedProfile() {
		return this.state.hasCompletedProfile;
	}
	
	get hasCreatedFirstListing() {
		return this.state.hasCreatedFirstListing;
	}
	
	get hasMadeFirstPurchase() {
		return this.state.hasMadeFirstPurchase;
	}
	
	get currentStep() {
		return this.state.currentStep;
	}
	
	get showWelcomeModal() {
		return this.state.showWelcomeModal;
	}
	
	set showWelcomeModal(value: boolean) {
		this.state.showWelcomeModal = value;
	}
	
	get progress() {
		const steps = [
			this.state.hasSeenWelcome,
			this.state.hasCompletedProfile,
			this.state.hasCreatedFirstListing,
			this.state.hasMadeFirstPurchase
		];
		const completed = steps.filter(Boolean).length;
		return {
			completed,
			total: steps.length,
			percentage: (completed / steps.length) * 100
		};
	}
	
	get isComplete() {
		return this.progress.completed === this.progress.total;
	}
	
	initialize(userId: string) {
		if (!browser) return;
		
		this.userId = userId;
		localStorage.setItem('onboarding_user_id', userId);
		
		const saved = localStorage.getItem(`onboarding_${userId}`);
		if (saved) {
			try {
				const savedState = JSON.parse(saved);
				this.state = { ...defaultState, ...savedState };
			} catch (e) {
				console.error('Failed to parse onboarding state:', e);
			}
		} else {
			// New user - don't show modal immediately
			// It will be triggered after signup
			this.state.showWelcomeModal = false;
		}
	}
	
	async completeStep(step: keyof Omit<OnboardingState, 'currentStep' | 'showWelcomeModal'>) {
		this.state[step] = true;
		
		// Update current step
		if (step === 'hasSeenWelcome') this.state.currentStep = 1;
		else if (step === 'hasCompletedProfile') this.state.currentStep = 2;
		else if (step === 'hasCreatedFirstListing') this.state.currentStep = 3;
		else if (step === 'hasMadeFirstPurchase') this.state.currentStep = 4;
		
		// Save to localStorage
		if (browser && this.userId) {
			localStorage.setItem(`onboarding_${this.userId}`, JSON.stringify(this.state));
		}
		
		// Update in database via Supabase function
		// TODO: Implement this using the proper Supabase client from page data
		// For now, just save to localStorage
	}
	
	reset() {
		this.state = { ...defaultState };
		if (browser && this.userId) {
			localStorage.removeItem(`onboarding_${this.userId}`);
		}
	}
	
	checkForNewUser(user: User | null) {
		if (!user) {
			this.reset();
			return;
		}
		
		if (this.userId !== user.id) {
			this.initialize(user.id);
		}
	}
	
	triggerWelcomeForNewSignup() {
		// Only show welcome modal if user hasn't seen it before
		if (!this.state.hasSeenWelcome) {
			this.state.showWelcomeModal = true;
		}
	}
}

export const onboarding = new OnboardingStore();