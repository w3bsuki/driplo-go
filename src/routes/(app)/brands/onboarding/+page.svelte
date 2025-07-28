<script lang="ts">
	import type { PageData } from './$types';
	import BrandOnboardingWizard from '$lib/components/brands/BrandOnboardingWizard.svelte';
	
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Create Your Brand | Driplo</title>
	<meta name="description" content="Turn your Driplo account into a professional brand account with enhanced features and visibility." />
</svelte:head>

<BrandOnboardingWizard 
	supabase={data.supabase} 
	profile={data.profile}
	existingBrandProfile={data.existingBrandProfile}
/>