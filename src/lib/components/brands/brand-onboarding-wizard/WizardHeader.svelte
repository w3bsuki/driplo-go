<script lang="ts">
	import { WIZARD_STEPS } from './hooks/useBrandWizardState.svelte';

	interface Props {
		currentStep: number;
		totalSteps: number;
		stepTitle: string;
		stepDescription: string;
		completionPercentage: number;
		isStepCompleted?: (stepNumber: number) => boolean;
	}

	let { 
		currentStep, 
		totalSteps, 
		stepTitle, 
		stepDescription, 
		completionPercentage,
		isStepCompleted = () => false 
	}: Props = $props();
</script>

<!-- Wizard Header -->
<div class="bg-white border-b border-gray-200 px-6 py-4 space-y-4">
	<!-- Progress Bar -->
	<div class="w-full">
		<div class="flex justify-between items-center mb-2">
			<span class="text-sm font-medium text-gray-700">
				Step {currentStep} of {totalSteps}
			</span>
			<span class="text-sm text-gray-500">
				{completionPercentage}% Complete
			</span>
		</div>
		
		<!-- Progress Bar Background -->
		<div class="w-full bg-gray-200 rounded-full h-2">
			<div 
				class="bg-gradient-to-r from-brand-500 to-brand-600 h-2 rounded-full transition-all duration-500 ease-out"
				style="width: {completionPercentage}%"
			></div>
		</div>
	</div>

	<!-- Step Indicators -->
	<div class="flex items-center justify-between">
		{#each WIZARD_STEPS as step, index}
			<div class="flex flex-col items-center flex-1">
				<!-- Step Circle -->
				<div class={`
					w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200
					${step.id === currentStep 
						? 'bg-brand-500 text-white shadow-lg transform scale-110' 
						: step.id < currentStep || isStepCompleted(step.id)
							? 'bg-brand-100 text-brand-600 border-2 border-brand-500'
							: 'bg-gray-200 text-gray-500'
					}
				`}>
					{#if step.id < currentStep || isStepCompleted(step.id)}
						<!-- Completed step - show checkmark -->
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
						</svg>
					{:else}
						<!-- Current or future step - show number -->
						{step.id}
					{/if}
				</div>
				
				<!-- Step Title (visible on larger screens) -->
				<span class={`
					hidden sm:block text-xs mt-2 text-center max-w-20 leading-tight
					${step.id === currentStep 
						? 'text-brand-600 font-medium' 
						: step.id < currentStep || isStepCompleted(step.id)
							? 'text-brand-500'
							: 'text-gray-400'
					}
				`}>
					{step.title}
				</span>
			</div>
			
			<!-- Connector Line (except for last step) -->
			{#if index < WIZARD_STEPS.length - 1}
				<div class={`
					flex-1 h-0.5 mx-2 transition-all duration-200
					${step.id < currentStep 
						? 'bg-brand-500' 
						: 'bg-gray-200'
					}
				`}></div>
			{/if}
		{/each}
	</div>

	<!-- Current Step Info -->
	<div class="text-center space-y-1">
		<h2 class="text-xl font-bold text-gray-900">
			{stepTitle}
		</h2>
		<p class="text-sm text-gray-600">
			{stepDescription}
		</p>
	</div>
</div>

<style>
	/* Smooth step indicator animations */
	.step-indicator {
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Progress bar gradient animation */
	.progress-bar {
		background: linear-gradient(90deg, var(--color-brand-500), var(--color-brand-600));
		background-size: 200% 100%;
		animation: shimmer 2s linear infinite;
	}

	@keyframes shimmer {
		0% { background-position: -200% 0; }
		100% { background-position: 200% 0; }
	}

	/* Mobile responsive adjustments */
	@media (max-width: 640px) {
		.step-indicator {
			transform: scale(0.9);
		}
	}
</style>