<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getAuthContext } from '$lib/stores/auth-context.svelte';
	import { toast } from 'svelte-sonner';
	import { ChevronLeft, ChevronRight, Check, User as UserIcon, Palette, Building2, Sparkles, AtSign } from 'lucide-svelte';
	import AccountTypeSelector from './AccountTypeSelector.svelte';
	import UsernameSetup from './UsernameSetup.svelte';
	import AvatarPicker from './AvatarPicker.svelte';
	import PersonalInfoForm from './PersonalInfoForm.svelte';
	import BrandInfoForm from './BrandInfoForm.svelte';
	import SetupComplete from './SetupComplete.svelte';
	import type { User, SupabaseClient } from '@supabase/supabase-js';
	import type { Tables } from '$lib/types/database.types';
	import type { ExtendedProfile } from '$lib/types/database.extended';

	interface Props {
		user: User;
		profile: ExtendedProfile;
		onComplete: () => void;
		initialStep?: number;
		supabase?: SupabaseClient; // Optional supabase client
	}

	let { user, profile, onComplete, initialStep = 1, supabase }: Props = $props();
	
	const auth = getAuthContext();

	// Check if user needs username setup
	const needsUsernameSetup = profile?.needs_username_setup || profile?.username?.match(/[0-9]+$/);
	
	const STEPS = [
		{ id: 1, name: 'Username', icon: AtSign, component: UsernameSetup, conditional: needsUsernameSetup },
		{ id: 2, name: 'Account Type', icon: UserIcon, component: AccountTypeSelector },
		{ id: 3, name: 'Choose Avatar', icon: Palette, component: AvatarPicker },
		{ id: 4, name: 'Profile Info', icon: UserIcon, component: PersonalInfoForm },
		{ id: 5, name: 'Brand Info', icon: Building2, component: BrandInfoForm, conditional: true },
		{ id: 6, name: 'Complete', icon: Sparkles, component: SetupComplete }
	];

	let currentStep = $state(initialStep);
	let loading = $state(false);
	let setupData = $state({
		username: profile?.username || '',
		usernameAvailable: false,
		usernameChecking: false,
		usernameError: '',
		accountType: 'personal' as 'personal' | 'brand',
		avatarStyle: 'avataaars',
		avatarSeed: user.id,
		customAvatarUrl: null as string | null,
		fullName: '',
		bio: '',
		location: '',
		brandName: '',
		brandCategory: '',
		brandDescription: '',
		socialMediaAccounts: [] as Array<{ platform: string; username: string; url?: string }>
	});

	// Filter steps based on conditions
	const activeSteps = $derived(
		STEPS.filter(step => {
			if (!step.conditional) return true;
			if (step.id === 1) return needsUsernameSetup; // Username step
			if (step.id === 5) return setupData.accountType === 'brand'; // Brand info step
			return false;
		})
	);

	const currentStepIndex = $derived(
		activeSteps.findIndex(step => step.id === currentStep)
	);

	const isLastStep = $derived(
		currentStepIndex === activeSteps.length - 1
	);

	const canProceed = $derived.by(() => {
		switch (currentStep) {
			case 1:
				// Username step
				return setupData.username && setupData.username.length >= 3 && setupData.usernameAvailable && !setupData.usernameChecking;
			case 2:
				return true; // Account type always has a default
			case 3:
				return setupData.customAvatarUrl || (setupData.avatarStyle && setupData.avatarSeed);
			case 4:
				return setupData.fullName && setupData.fullName.length >= 2;
			case 5:
				return setupData.brandName && setupData.brandDescription;
			default:
				return true;
		}
	});

	async function generateBrandSlug(brandName: string): Promise<string> {
		const baseSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
		let slug = baseSlug;
		let counter = 0;
		
		while (true) {
			const client = supabase || auth.supabase;
			const { data } = await client
				.from('brand_profiles')
				.select('id')
				.eq('brand_slug', slug)
				.single();
			
			if (!data) break;
			
			counter++;
			slug = `${baseSlug}-${counter}`;
		}
		
		return slug;
	}

	async function handleNext() {
		if (!canProceed) return;

		loading = true;
		try {
			// Save progress for current step
			const client = supabase || auth.supabase;
			switch (currentStep) {
				case 1:
					if (needsUsernameSetup) {
						// Username setup
						await client
							.from('profiles')
							.update({ 
								username: setupData.username.toLowerCase(),
								needs_username_setup: false,
								onboarding_step: 1
							})
							.eq('id', user.id);
					} else {
						// Account type selection
						await client
							.from('profiles')
							.update({ 
								account_type: setupData.accountType,
								onboarding_step: 1
							})
							.eq('id', user.id);
					}
					break;
					
				case 2:
					// Account type selection (if not username step)
					await client
						.from('profiles')
						.update({ 
							account_type: setupData.accountType,
							onboarding_step: 2 
						})
						.eq('id', user.id);
					break;
					
				case 3:
					// Avatar saved via upload endpoint
					await client
						.from('profiles')
						.update({ onboarding_step: 3 })
						.eq('id', user.id);
					break;
					
				case 4:
					// Update profile with basic info
					await client
						.from('profiles')
						.update({
							full_name: setupData.fullName,
							bio: setupData.bio,
							location: setupData.location,
							onboarding_step: 4
						})
						.eq('id', user.id);
					break;
					
				case 5:
					// Create brand profile
					const brandSlug = await generateBrandSlug(setupData.brandName);
					const { error: brandError } = await client
						.from('brand_profiles')
						.insert({
							user_id: user.id,
							brand_name: setupData.brandName,
							brand_slug: brandSlug,
							brand_description: setupData.brandDescription,
							instagram_url: setupData.socialMediaAccounts.find(a => a.platform === 'instagram')?.url,
							facebook_url: setupData.socialMediaAccounts.find(a => a.platform === 'facebook')?.url,
							twitter_url: setupData.socialMediaAccounts.find(a => a.platform === 'twitter')?.url,
							tiktok_url: setupData.socialMediaAccounts.find(a => a.platform === 'tiktok')?.url
						});

					if (brandError) throw brandError;
					
					// Update onboarding step
					await client
						.from('profiles')
						.update({ onboarding_step: 4 })
						.eq('id', user.id);
					break;
			}

			// Move to next step
			const nextStepIndex = currentStepIndex + 1;
			if (nextStepIndex < activeSteps.length) {
				currentStep = activeSteps[nextStepIndex].id;
			}
		} catch (error) {
			toast.error(error.message || 'Failed to save progress');
		} finally {
			loading = false;
		}
	}

	function handleBack() {
		if (currentStepIndex > 0) {
			currentStep = activeSteps[currentStepIndex - 1].id;
		}
	}

	async function handleComplete() {
		loading = true;
		try {
			if (onComplete) {
				await onComplete();
			}
			toast.success('Profile setup complete! 🎉');
		} catch (error) {
			toast.error(error.message || 'Failed to complete setup');
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		// Load existing profile data
		if (profile) {
			if (profile.full_name) setupData.fullName = profile.full_name;
			if (profile.bio) setupData.bio = profile.bio;
			if (profile.location) setupData.location = profile.location;
			if (profile.account_type) setupData.accountType = profile.account_type;
			if (profile.avatar_url) setupData.customAvatarUrl = profile.avatar_url;
			
			// Resume from last step
			if (profile.onboarding_step && profile.onboarding_step > 0) {
				currentStep = Math.min(profile.onboarding_step + 1, 5);
			}
		}
		
		// Load brand profile if exists
		if (setupData.accountType === 'brand') {
			const client = supabase || auth.supabase;
			const { data: brandProfile } = await client
				.from('brand_profiles')
				.select('*')
				.eq('user_id', user.id)
				.single();
			
			if (brandProfile) {
				setupData.brandName = brandProfile.brand_name || '';
				setupData.brandDescription = brandProfile.brand_description || '';
				
				// Load social media URLs
				const socials = [];
				if (brandProfile.instagram_url) {
					socials.push({ platform: 'instagram', username: '', url: brandProfile.instagram_url });
				}
				if (brandProfile.facebook_url) {
					socials.push({ platform: 'facebook', username: '', url: brandProfile.facebook_url });
				}
				if (brandProfile.twitter_url) {
					socials.push({ platform: 'twitter', username: '', url: brandProfile.twitter_url });
				}
				if (brandProfile.tiktok_url) {
					socials.push({ platform: 'tiktok', username: '', url: brandProfile.tiktok_url });
				}
				setupData.socialMediaAccounts = socials;
			}
		}
	});
</script>

<div class="min-h-screen bg-gray-50 py-8 px-4">
	<div class="max-w-4xl mx-auto">
		<!-- Progress Bar -->
		<div class="mb-8">
			<div class="flex items-center justify-between mb-4">
				{#each activeSteps as step, index}
					{@const isActive = currentStepIndex === index}
					{@const isCompleted = currentStepIndex > index}
					<div class="flex items-center {index < activeSteps.length - 1 ? 'flex-1' : ''}">
						<div class="relative">
							<div 
								class="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
									{isActive ? 'bg-blue-600 text-white shadow-lg scale-110' : 
									 isCompleted ? 'bg-green-500 text-white' : 
									 'bg-gray-200 text-gray-500'}"
							>
								{#if isCompleted}
									<Check class="w-6 h-6" />
								{:else}
									<svelte:component this={step.icon} class="w-6 h-6" />
								{/if}
							</div>
							<span class="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap
								{isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}">
								{step.name}
							</span>
						</div>
						{#if index < activeSteps.length - 1}
							<div class="flex-1 h-1 mx-4 rounded-full overflow-hidden bg-gray-200">
								<div 
									class="h-full bg-gradient-to-r from-green-500 to-blue-600 transition-all duration-500"
									style="width: {isCompleted ? '100%' : '0%'}"
								></div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Step Content -->
		<div class="mt-12 bg-white rounded-xl shadow-lg p-8">
			{#key currentStep}
				<div class="animate-fade-in">
					{#if currentStep === 1 && needsUsernameSetup}
						<UsernameSetup 
							bind:username={setupData.username}
							bind:isAvailable={setupData.usernameAvailable}
							bind:isChecking={setupData.usernameChecking}
							bind:error={setupData.usernameError}
						/>
					{:else if currentStep === 2 || (currentStep === 1 && !needsUsernameSetup)}
						<AccountTypeSelector bind:accountType={setupData.accountType} />
					{:else if currentStep === 3}
						<AvatarPicker 
							bind:customAvatarUrl={setupData.customAvatarUrl}
							userId={user.id}
						/>
					{:else if currentStep === 4}
						<PersonalInfoForm 
							bind:fullName={setupData.fullName}
							bind:bio={setupData.bio}
							bind:location={setupData.location}
						/>
					{:else if currentStep === 5}
						<BrandInfoForm 
							bind:brandName={setupData.brandName}
							bind:brandCategory={setupData.brandCategory}
							bind:brandDescription={setupData.brandDescription}
							bind:socialMediaAccounts={setupData.socialMediaAccounts}
						/>
					{:else if currentStep === 6}
						<SetupComplete 
							accountType={setupData.accountType}
							fullName={setupData.fullName}
							avatarUrl={setupData.customAvatarUrl}
						/>
					{/if}
				</div>
			{/key}

			<!-- Navigation Buttons -->
			<div class="flex justify-between items-center mt-8 pt-6 border-t">
				<button
					onclick={handleBack}
					disabled={currentStepIndex === 0}
					class="flex items-center gap-2 px-6 py-3 text-gray-700 font-medium rounded-lg
						hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed
						transition-all duration-200"
				>
					<ChevronLeft class="w-5 h-5" />
					Back
				</button>

				{#if isLastStep}
					<button
						onclick={handleComplete}
						disabled={loading}
						class="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600
							text-white font-medium rounded-lg hover:shadow-lg transform hover:scale-105
							disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
					>
						{#if loading}
							<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						{:else}
							<Sparkles class="w-5 h-5" />
						{/if}
						Complete Setup
					</button>
				{:else}
					<button
						onclick={handleNext}
						disabled={!canProceed || loading}
						class="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg
							hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
							transition-all duration-200"
					>
						{#if loading}
							<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						{:else}
							Next
							<ChevronRight class="w-5 h-5" />
						{/if}
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}
</style>