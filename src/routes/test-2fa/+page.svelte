<script lang="ts">
  import { onMount } from 'svelte';
  
  let status = 'Loading...';
  let error = '';
  
  onMount(async () => {
    try {
      // Test the backup codes endpoint
      const response = await fetch('/api/auth/2fa/backup-codes');
      
      if (response.ok) {
        const data = await response.json();
        status = `2FA is enabled. Backup codes count: ${data.count}`;
      } else if (response.status === 400) {
        status = '2FA is not enabled';
      } else if (response.status === 401) {
        status = 'Not authenticated';
      } else {
        const errorData = await response.json();
        error = errorData.error || 'Unknown error';
        status = 'Error';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to check 2FA status';
      status = 'Error';
    }
  });
</script>

<div class="p-8">
  <h1 class="text-2xl font-bold mb-4">2FA Test Page</h1>
  
  <div class="space-y-4">
    <div>
      <strong>Status:</strong> {status}
    </div>
    
    {#if error}
      <div class="text-red-600">
        <strong>Error:</strong> {error}
      </div>
    {/if}
    
    <div class="space-y-2">
      <h2 class="text-lg font-semibold">Test Endpoints:</h2>
      <ul class="list-disc pl-5 space-y-1">
        <li><a href="/api/auth/2fa/backup-codes" class="text-blue-600 hover:underline">/api/auth/2fa/backup-codes</a></li>
        <li><a href="/profile/settings" class="text-blue-600 hover:underline">/profile/settings</a></li>
      </ul>
    </div>
  </div>
</div>