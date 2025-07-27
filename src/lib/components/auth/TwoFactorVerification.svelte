<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { toast } from 'svelte-sonner';
  import { Loader2, Smartphone, Key } from 'lucide-svelte';

  const dispatch = createEventDispatcher();

  export let email = '';
  
  let verificationCode = '';
  let loading = false;
  let useBackupCode = false;

  async function verifyCode() {
    if (!verificationCode) {
      toast.error('Please enter a verification code');
      return;
    }
    
    if (!useBackupCode && verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }
    
    loading = true;
    
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: verificationCode,
          type: useBackupCode ? 'backup' : 'totp'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify code');
      }
      
      toast.success('2FA verification successful');
      dispatch('verified');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to verify code');
    } finally {
      loading = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      verifyCode();
    }
  }
</script>

<div class="space-y-6">
  <div class="text-center space-y-2">
    <div class="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
      {#if useBackupCode}
        <Key class="w-8 h-8 text-primary" />
      {:else}
        <Smartphone class="w-8 h-8 text-primary" />
      {/if}
    </div>
    
    <div>
      <h3 class="text-lg font-semibold">Two-Factor Authentication</h3>
      <p class="text-sm text-muted-foreground mt-1">
        {#if email}
          Enter the verification code for {email}
        {:else}
          Enter your verification code to continue
        {/if}
      </p>
    </div>
  </div>
  
  <div class="space-y-3">
    {#if useBackupCode}
      <Label for="backup-code">
        Enter one of your backup codes
      </Label>
      <Input
        id="backup-code"
        type="text"
        placeholder="XXXX-XXXX"
        bind:value={verificationCode}
        disabled={loading}
        onkeydown={handleKeydown}
      />
      <p class="text-xs text-muted-foreground">
        Backup codes are 8 characters long and contain letters and numbers
      </p>
    {:else}
      <Label for="totp-code">
        Enter the 6-digit code from your authenticator app
      </Label>
      <Input
        id="totp-code"
        type="text"
        inputmode="numeric"
        pattern="[0-9]{6}"
        maxlength="6"
        placeholder="000000"
        bind:value={verificationCode}
        disabled={loading}
        onkeydown={handleKeydown}
      />
    {/if}
    
    <Button 
      onclick={verifyCode} 
      disabled={loading || !verificationCode}
      class="w-full"
    >
      {#if loading}
        <Loader2 class="w-4 h-4 mr-2 animate-spin" />
      {/if}
      Verify
    </Button>
  </div>
  
  <div class="text-center">
    <button
      class="text-sm text-muted-foreground hover:text-foreground underline"
      onclick={() => {
        useBackupCode = !useBackupCode;
        verificationCode = '';
      }}
    >
      {#if useBackupCode}
        Use authenticator app instead
      {:else}
        Lost your device? Use a backup code
      {/if}
    </button>
  </div>
</div>