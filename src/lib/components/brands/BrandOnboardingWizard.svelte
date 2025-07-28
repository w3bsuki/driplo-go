<script lang="ts">
	import { X } from 'lucide-svelte';
	import { fade, scale } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	
	// Import decomposed components
	import { useBrandWizardState } from './brand-onboarding-wizard/hooks/useBrandWizardState.svelte';
	import WizardHeader from './brand-onboarding-wizard/WizardHeader.svelte';
	import WizardNavigation from './brand-onboarding-wizard/WizardNavigation.svelte';
	import BrandBasicsStep from './brand-onboarding-wizard/steps/BrandBasicsStep.svelte';
	import BrandLogoStep from './brand-onboarding-wizard/steps/BrandLogoStep.svelte';
	
	interface Props {
		supabase: any;
		profile: any;
		existingBrandProfile?: any;
	}
	
	let { supabase, profile, existingBrandProfile }: Props = $props();

	// Initialize wizard state management
	const wizardState = useBrandWizardState(existingBrandProfile);

	// Handle wizard completion
	async function handleWizardComplete() {
		wizardState.setSubmitting(true);
		
		try {
			const brandData = wizardState.getWizardData();
			
			// Submit to API
			const response = await fetch('/api/brands/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...brandData,
					profile_id: profile.id
				})
			});

			if (!response.ok) {
				throw new Error('Failed to create brand profile');
			}

			const result = await response.json();
			toast.success('Brand profile created successfully!');
			
			// Navigate to brand dashboard
			goto(`/brands/${result.brand_id}/dashboard`);
			
		} catch (error) {
			console.error('Brand creation failed:', error);
			toast.error('Failed to create brand profile. Please try again.');
		} finally {
			wizardState.setSubmitting(false);
		}
	}

	// Handle brand basics updates
	function handleBrandBasicsUpdate(updates: any) {
		wizardState.updateBrandBasics(updates);
	}

	// Handle logo updates
	function handleLogoUpdate(logoFile: File | null, logoPreview: string, logoUrl?: string) {
		wizardState.updateLogo(logoFile, logoPreview, logoUrl || '');
	}

	// Handle logo upload state changes
	function handleLogoUploadStateChange(uploading: boolean) {
		wizardState.setUploadingLogo(uploading);
	}

	// Get current step component
	function getCurrentStepComponent() {
		switch (wizardState.state.currentStep) {
			case 1:
				return BrandBasicsStep;
			case 2:
				return BrandLogoStep;
			default:
				// For now, redirect to step 1 for unimplemented steps
				wizardState.goToStep(1);
				return BrandBasicsStep;
		}
	}

	// Get current step props
	function getCurrentStepProps() {
		const state = wizardState.state;
		
		switch (state.currentStep) {
			case 1:
				return {
					brandName: state.brandName,
					brandCategory: state.brandCategory,
					brandDescription: state.brandDescription,
					onUpdate: handleBrandBasicsUpdate,
					disabled: state.loading || state.submitting
				};
			case 2:
				return {
					logoFile: state.logoFile,
					logoPreview: state.logoPreview,
					logoUrl: state.logoUrl,
					supabase,
					onUpdate: handleLogoUpdate,
					onUploadStateChange: handleLogoUploadStateChange,
					disabled: state.loading || state.submitting
				};
			default:
				return {};
		}
	}
</script>

<!-- Brand Onboarding Wizard -->
<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" transition:fade={{ duration: 200 }}>
	<div 
		class="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" 
		transition:scale={{ duration: 200 }}
	>
		<!-- Wizard Header -->
		<WizardHeader
			currentStep={wizardState.state.currentStep}
			totalSteps={wizardState.state.totalSteps}
			stepTitle={wizardState.getCurrentStepInfo().title}
			stepDescription={wizardState.getCurrentStepInfo().description}
			completionPercentage={wizardState.getCompletionPercentage()}
			isStepCompleted={wizardState.isStepCompleted}
		/>

		<!-- Step Content -->
		<div class="p-6 overflow-y-auto max-h-[60vh]">
			{#if wizardState.state.currentStep <= 2}
				<!-- Render implemented steps -->
				{@const StepComponent = getCurrentStepComponent()}
				<StepComponent 
					{...getCurrentStepProps()} 
				/>
			{:else}
				<!-- Placeholder for unimplemented steps -->
				<div class="text-center py-12">
					<div class="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
						<span class="text-lg font-semibold text-gray-600">{wizardState.state.currentStep}</span>
					</div>
					<h3 class="text-lg font-medium text-gray-900 mb-2">
						{wizardState.getCurrentStepInfo().title}
					</h3>
					<p class="text-sm text-gray-600 mb-4">
						This step component is being implemented...
					</p>
					<p class="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 inline-block">
						🚧 Step {wizardState.state.currentStep} will be completed in the next development phase
					</p>
				</div>
			{/if}
		</div>

		<!-- Wizard Navigation -->
		<WizardNavigation
			currentStep={wizardState.state.currentStep}
			totalSteps={wizardState.state.totalSteps}
			canProceed={wizardState.state.canProceed}
			isLoading={wizardState.state.loading || wizardState.state.submitting || wizardState.state.uploadingLogo}
			isFirstStep={wizardState.state.currentStep === 1}
			isLastStep={wizardState.state.currentStep === wizardState.state.totalSteps}
			onPrevious={wizardState.previousStep}
			onNext={wizardState.nextStep}
			onFinish={handleWizardComplete}
		/>

		<!-- Development Notice -->
		<div class="bg-blue-50 border-t border-blue-200 px-6 py-3">
			<p class="text-xs text-blue-700 text-center">
				🎉 <strong>Decomposition Demo:</strong> This wizard now uses modular components! 
				Steps 1-2 fully implemented, Steps 3-6 coming next.
			</p>
		</div>
	</div>
</div>

<style>
	/* Scrollbar styling for step content */
	.overflow-y-auto::-webkit-scrollbar {
		width: 6px;
	}

	.overflow-y-auto::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 3px;
	}

	.overflow-y-auto::-webkit-scrollbar-thumb {
		background: #c1c1c1;
		border-radius: 3px;
	}

	.overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background: #a8a8a8;
	}
</style>