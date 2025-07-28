<script lang="ts">
	import { ChevronLeft, ChevronRight, Check } from 'lucide-svelte';

	interface Props {
		currentStep: number;
		totalSteps: number;
		canProceed: boolean;
		isLoading?: boolean;
		isFirstStep?: boolean;
		isLastStep?: boolean;
		previousButtonText?: string;
		nextButtonText?: string;
		finishButtonText?: string;
		onPrevious: () => void;
		onNext: () => void;
		onFinish?: () => void;
	}

	let { 
		currentStep,
		totalSteps,
		canProceed,
		isLoading = false,
		isFirstStep = false,
		isLastStep = false,
		previousButtonText = 'Previous',
		nextButtonText = 'Next',
		finishButtonText = 'Complete Setup',
		onPrevious,
		onNext,
		onFinish
	}: Props = $props();

	function handlePrevious() {
		if (!isLoading && !isFirstStep) {
			onPrevious();
		}
	}

	function handleNext() {
		if (!isLoading && canProceed) {
			if (isLastStep && onFinish) {
				onFinish();
			} else {
				onNext();
			}
		}
	}

	function getNextButtonText(): string {
		if (isLoading) {
			return isLastStep ? 'Completing...' : 'Loading...';
		}
		return isLastStep ? finishButtonText : nextButtonText;
	}
</script>

<!-- Wizard Navigation -->
<div class="bg-white border-t border-gray-200 px-6 py-4">
	<div class="flex items-center justify-between">
		<!-- Previous Button -->
		<button
			onclick={handlePrevious}
			disabled={isFirstStep || isLoading}
			class={`
				inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-all duration-200
				${isFirstStep || isLoading
					? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
					: 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
				}
			`}
		>
			<ChevronLeft class="w-4 h-4 mr-1" />
			{previousButtonText}
		</button>

		<!-- Step Counter (visible on mobile) -->
		<div class="flex sm:hidden items-center space-x-2">
			<span class="text-sm text-gray-500">
				{currentStep} of {totalSteps}
			</span>
		</div>

		<!-- Next/Finish Button -->
		<button
			onclick={handleNext}
			disabled={!canProceed || isLoading}
			class={`
				inline-flex items-center px-6 py-2 border border-transparent rounded-lg text-sm font-medium transition-all duration-200
				${!canProceed || isLoading
					? 'bg-gray-300 text-gray-500 cursor-not-allowed'
					: isLastStep
						? 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
						: 'bg-brand-500 text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
				}
			`}
		>
			{#if isLoading}
				<!-- Loading Spinner -->
				<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
			{:else if isLastStep}
				<!-- Finish Icon -->
				<Check class="w-4 h-4 mr-2" />
			{:else}
				<!-- Next Arrow -->
				<ChevronRight class="w-4 h-4 ml-1 order-2" />
			{/if}
			{getNextButtonText()}
		</button>
	</div>

	<!-- Step Validation Message -->
	{#if !canProceed && !isLoading}
		<div class="mt-3 text-center">
			<p class="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
				{#if currentStep === 1}
					Please fill in your brand name, category, and description to continue.
				{:else if currentStep === 2}
					Please upload a logo for your brand.
				{:else if currentStep === 3}
					Please share your brand story (minimum 50 characters).
				{:else if currentStep === 4}
					Please upload a cover image for your brand.
				{:else if currentStep === 5}
					Please add at least one social media link or website URL.
				{:else}
					Please complete the required fields to continue.
				{/if}
			</p>
		</div>
	{/if}

	<!-- Progress Hint -->
	{#if canProceed && !isLastStep}
		<div class="mt-3 text-center">
			<p class="text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
				✓ Ready to continue to the next step
			</p>
		</div>
	{:else if isLastStep && canProceed}
		<div class="mt-3 text-center">
			<p class="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
				🎉 Your brand profile is ready! Click "Complete Setup" to finish.
			</p>
		</div>
	{/if}
</div>

<style>
	/* Loading spinner animation */
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.animate-spin {
		animation: spin 1s linear infinite;
	}

	/* Button hover effects */
	button:not(:disabled):hover {
		transform: translateY(-1px);
	}

	button:disabled {
		transform: none;
	}

	/* Enhanced focus styles for accessibility */
	button:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	/* Mobile optimizations */
	@media (max-width: 640px) {
		button {
			min-width: 80px;
		}
		
		.step-counter {
			font-size: 0.75rem;
		}
	}
</style>