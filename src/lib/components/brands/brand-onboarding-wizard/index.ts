/**
 * Brand Onboarding Wizard Components - Re-exports
 * 
 * This file provides clean re-exports for all wizard components
 * and hooks, enabling easy imports throughout the application.
 */

// Main container component
export { default as BrandOnboardingWizard } from '../BrandOnboardingWizard.svelte';

// Wizard UI Components
export { default as WizardHeader } from './WizardHeader.svelte';
export { default as WizardNavigation } from './WizardNavigation.svelte';

// Step Components
export { default as BrandBasicsStep } from './steps/BrandBasicsStep.svelte';
export { default as BrandLogoStep } from './steps/BrandLogoStep.svelte';
// TODO: Add remaining step components as they are created
// export { default as BrandStoryStep } from './steps/BrandStoryStep.svelte';
// export { default as BrandCoverStep } from './steps/BrandCoverStep.svelte';
// export { default as SocialMediaStep } from './steps/SocialMediaStep.svelte';
// export { default as ReviewStep } from './steps/ReviewStep.svelte';

// State Management Hooks
export { useBrandWizardState, WIZARD_STEPS } from './hooks/useBrandWizardState.svelte';
export { useImageUpload } from './hooks/useImageUpload.svelte';

// Type exports
export type { BrandWizardState, BrandProfile } from './hooks/useBrandWizardState.svelte';
export type { ImageUploadConfig, ImageUploadResult } from './hooks/useImageUpload.svelte';