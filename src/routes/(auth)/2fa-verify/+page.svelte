<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import TwoFactorVerification from '$lib/components/auth/TwoFactorVerification.svelte';
  import { getAuthContext } from '$lib/stores/auth-context.svelte';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  
  const auth = getAuthContext();
  
  onMount(() => {
    // Check if user is authenticated
    if (!auth?.user) {
      toast.error('Please log in first');
      goto('/login');
    }
  });
  
  async function handleVerified() {
    // Get the redirect URL from cookie (set by middleware)
    const redirectUrl = $page.url.searchParams.get('redirect') || '/';
    
    // Navigate to the original destination
    await goto(redirectUrl);
  }
</script>

<svelte:head>
  <title>Two-Factor Authentication | Driplo</title>
  <meta name="description" content="Verify your two-factor authentication code" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
  <div class="w-full max-w-md">
    <div class="bg-white rounded-sm border border-gray-200 p-6">
      <TwoFactorVerification 
        email={auth?.user?.email}
        onverified={handleVerified}
      />
    </div>
  </div>
</div>