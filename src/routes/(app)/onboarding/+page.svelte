<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getAuthContext } from '$lib/stores/auth-context.svelte';
	import type { PageData } from './$types';
	import ProfileSetupWizard from '$lib/components/onboarding/ProfileSetupWizard.svelte';
	
	let { data }: { data: PageData } = $props();
	let showSetup = $state(false);
	let loading = $state(true);
	
	const auth = getAuthContext();
	
	onMount(async () => {
		// Only show onboarding for authenticated users
		if (!auth.user) {
			goto('/login');
			return;
		}
		
		// Check if profile setup is already completed
		if (auth.profile?.onboarding_completed) {
			// Profile already set up, redirect to home
			goto('/');
			return;
		}
		
		// Check if coming from email verification
		const isNewSignup = $page.url.searchParams.get('new') === 'true';
		
		// Show profile setup wizard
		loading = false;
		showSetup = true;
	});

	async function handleComplete() {
		// Mark onboarding as complete
		await auth.supabase
			.from('profiles')
			.update({ 
				onboarding_completed: true,
				onboarding_step: 5 // Final step
			})
			.eq('id', auth.user!.id);

		// Refresh profile
		await auth.loadProfile();

		// Check if user created a brand account
		if (auth.profile?.account_type === 'brand') {
			// Get the brand profile to find the slug
			const { data: brandProfile } = await auth.supabase
				.from('brand_profiles')
				.select('brand_slug')
				.eq('user_id', auth.user!.id)
				.single();

			if (brandProfile?.brand_slug) {
				// Redirect to brand profile
				goto(`/brands/${brandProfile.brand_slug}`);
				return;
			}
		}

		// Redirect to home or wherever they came from
		const redirectTo = $page.url.searchParams.get('redirectTo') || '/';
		goto(redirectTo);
	}
</script>

<svelte:head>
	<title>Set Up Your Profile | Driplo</title>
</svelte:head>

{#if loading}
	<!-- Loading state -->
	<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
		<div class="text-center">
			<div class="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
			<h1 class="text-2xl font-bold text-gray-900 mb-2">Welcome to Driplo!</h1>
			<p class="text-gray-600">Preparing your profile setup...</p>
		</div>
	</div>
{:else if showSetup && auth.user}
	<div class="min-h-[100dvh] bg-gradient-to-br from-blue-50 to-purple-50">
		<ProfileSetupWizard 
			user={auth.user} 
			profile={auth.profile}
			onComplete={handleComplete}
		/>
	</div>
{/if}