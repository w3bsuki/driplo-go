<script lang="ts">
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import { goto } from '$app/navigation';
	import { UserCircle, Plus, ShoppingBag } from 'lucide-svelte';
	import { ProgressBar } from '$lib/components/ui';
	import * as m from '$lib/paraglide/messages';
	
	let showProgress = $derived(
		onboarding.progress.completed > 0 && 
		onboarding.progress.completed < onboarding.progress.total
	);
	
	// Derive completion states separately
	let hasCompletedProfile = $derived(onboarding.hasCompletedProfile);
	let hasCreatedFirstListing = $derived(onboarding.hasCreatedFirstListing);
	let hasMadeFirstPurchase = $derived(onboarding.hasMadeFirstPurchase);
	
	let steps = $derived([
		{
			key: 'hasCompletedProfile',
			icon: UserCircle,
			label: 'Complete Profile',
			href: '/profile/edit',
			completed: hasCompletedProfile
		},
		{
			key: 'hasCreatedFirstListing',
			icon: Plus,
			label: 'Create Listing',
			href: '/sell',
			completed: hasCreatedFirstListing
		},
		{
			key: 'hasMadeFirstPurchase',
			icon: ShoppingBag,
			label: 'Make Purchase',
			href: '/browse',
			completed: hasMadeFirstPurchase
		}
	]);
</script>

{#if showProgress}
	<div class="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
		<div class="flex justify-between items-center mb-3">
			<span class="text-sm font-medium">Getting Started</span>
			<span class="text-sm text-muted-foreground">
				{onboarding.progress.completed}/{onboarding.progress.total} completed
			</span>
		</div>
		
		<ProgressBar 
			value={onboarding.progress.percentage} 
			max={100}
			size="sm"
			class="mb-4"
		/>
		
		<div class="flex flex-col gap-2">
			{#each steps as step}
				{@const Icon = step.icon}
				<button 
					class="flex items-center gap-2 text-sm p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left disabled:cursor-not-allowed"
					class:text-gray-500={step.completed} class:dark:text-gray-400={step.completed}
					class:opacity-75={step.completed}
					onclick={() => goto(step.href)}
					disabled={step.completed}
				>
					<Icon class="w-4 h-4" />
					<span>{step.label}</span>
					{#if step.completed}
						<span class="ml-auto text-xs text-success-600 dark:text-success-400">✓</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>
{/if}