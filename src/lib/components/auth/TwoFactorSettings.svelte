<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { toast } from 'svelte-sonner';
  import { Loader2, Shield, ShieldOff, RefreshCw, Download } from 'lucide-svelte';
  import TwoFactorSetup from './TwoFactorSetup.svelte';
  
  export let enabled = false;
  export let backupCodesCount = 0;
  export let isRequired = false;
  
  let showSetup = false;
  let showDisable = false;
  let showRegenerateBackup = false;
  let loading = false;
  let verificationCode = '';
  let password = '';
  let backupCodes: string[] = [];

  async function handleSetupComplete() {
    showSetup = false;
    enabled = true;
    backupCodesCount = 8;
    toast.success('Two-factor authentication has been enabled');
    window.location.reload(); // Reload to update auth state
  }

  async function disableTwoFactor() {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit verification code');
      return;
    }
    
    if (!password) {
      toast.error('Please enter your password');
      return;
    }
    
    loading = true;
    
    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to disable 2FA');
      }
      
      enabled = false;
      showDisable = false;
      verificationCode = '';
      password = '';
      toast.success('Two-factor authentication has been disabled');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to disable 2FA');
    } finally {
      loading = false;
    }
  }

  async function regenerateBackupCodes() {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit verification code');
      return;
    }
    
    loading = true;
    
    try {
      const response = await fetch('/api/auth/2fa/backup-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate backup codes');
      }
      
      backupCodes = data.backupCodes;
      backupCodesCount = backupCodes.length;
      showRegenerateBackup = false;
      verificationCode = '';
      toast.success('New backup codes generated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to regenerate backup codes');
    } finally {
      loading = false;
    }
  }

  function downloadBackupCodes() {
    const content = `Driplo Marketplace - 2FA Backup Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Keep these codes in a safe place!
Each code can only be used once.

${backupCodes.join('\n')}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'driplo-2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Backup codes downloaded');
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div class="space-y-0.5">
      <h3 class="text-base font-medium">Two-Factor Authentication</h3>
      <p class="text-sm text-muted-foreground">
        Add an extra layer of security to your account
      </p>
    </div>
    <div class="flex items-center gap-2">
      {#if enabled}
        <Shield class="w-5 h-5 text-green-600" />
        <span class="text-sm font-medium text-green-600">Enabled</span>
      {:else}
        <ShieldOff class="w-5 h-5 text-muted-foreground" />
        <span class="text-sm font-medium text-muted-foreground">Disabled</span>
      {/if}
    </div>
  </div>

  {#if !enabled}
    {#if isRequired}
      <div class="bg-yellow-50 border border-yellow-200 rounded-sm p-3">
        <p class="text-sm text-yellow-800">
          <strong>Required:</strong> Two-factor authentication is mandatory for your account type.
        </p>
      </div>
    {/if}
    
    <Button 
      onclick={() => showSetup = true}
      variant={isRequired ? 'default' : 'outline'}
    >
      <Shield class="w-4 h-4 mr-2" />
      Enable Two-Factor Authentication
    </Button>
  {:else}
    <div class="space-y-4">
      <div class="flex items-center justify-between p-4 bg-muted/50 rounded-sm">
        <div>
          <p class="text-sm font-medium">Backup Codes</p>
          <p class="text-sm text-muted-foreground">
            {backupCodesCount} backup {backupCodesCount === 1 ? 'code' : 'codes'} remaining
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onclick={() => showRegenerateBackup = true}
        >
          <RefreshCw class="w-4 h-4 mr-2" />
          Regenerate
        </Button>
      </div>
      
      {#if !isRequired}
        <Button
          variant="outline"
          onclick={() => showDisable = true}
          class="text-destructive hover:text-destructive"
        >
          <ShieldOff class="w-4 h-4 mr-2" />
          Disable Two-Factor Authentication
        </Button>
      {/if}
    </div>
  {/if}
</div>

{#if showSetup}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div class="bg-background rounded-sm shadow-lg max-w-md w-full p-6">
      <TwoFactorSetup on:complete={handleSetupComplete} />
      <Button
        variant="ghost"
        onclick={() => showSetup = false}
        class="w-full mt-4"
      >
        Cancel
      </Button>
    </div>
  </div>
{/if}

{#if showDisable}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div class="bg-background rounded-sm shadow-lg max-w-md w-full p-6 space-y-4">
      <h3 class="text-lg font-semibold">Disable Two-Factor Authentication</h3>
      <p class="text-sm text-muted-foreground">
        To disable 2FA, please enter your current 2FA code and password.
      </p>
      
      <div class="space-y-3">
        <div>
          <Label for="disable-2fa-code">2FA Code</Label>
          <Input
            id="disable-2fa-code"
            type="text"
            inputmode="numeric"
            pattern="[0-9]{6}"
            maxlength="6"
            placeholder="000000"
            bind:value={verificationCode}
            disabled={loading}
          />
        </div>
        
        <div>
          <Label for="disable-2fa-password">Password</Label>
          <Input
            id="disable-2fa-password"
            type="password"
            placeholder="Enter your password"
            bind:value={password}
            disabled={loading}
          />
        </div>
      </div>
      
      <div class="flex gap-3">
        <Button
          variant="outline"
          onclick={() => {
            showDisable = false;
            verificationCode = '';
            password = '';
          }}
          disabled={loading}
          class="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onclick={disableTwoFactor}
          disabled={loading || !verificationCode || !password}
          class="flex-1"
        >
          {#if loading}
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
          {/if}
          Disable 2FA
        </Button>
      </div>
    </div>
  </div>
{/if}

{#if showRegenerateBackup}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div class="bg-background rounded-sm shadow-lg max-w-md w-full p-6 space-y-4">
      <h3 class="text-lg font-semibold">Regenerate Backup Codes</h3>
      <p class="text-sm text-muted-foreground">
        This will invalidate all your existing backup codes. Enter your 2FA code to continue.
      </p>
      
      <div>
        <Label for="regenerate-2fa-code">2FA Code</Label>
        <Input
          id="regenerate-2fa-code"
          type="text"
          inputmode="numeric"
          pattern="[0-9]{6}"
          maxlength="6"
          placeholder="000000"
          bind:value={verificationCode}
          disabled={loading}
        />
      </div>
      
      {#if backupCodes.length > 0}
        <div class="bg-muted/50 rounded-sm p-4 space-y-2">
          {#each backupCodes as code}
            <code class="block font-mono text-sm">{code}</code>
          {/each}
        </div>
        
        <Button
          onclick={downloadBackupCodes}
          variant="outline"
          class="w-full"
        >
          <Download class="w-4 h-4 mr-2" />
          Download Backup Codes
        </Button>
      {/if}
      
      <div class="flex gap-3">
        <Button
          variant="outline"
          onclick={() => {
            showRegenerateBackup = false;
            verificationCode = '';
            backupCodes = [];
          }}
          disabled={loading}
          class="flex-1"
        >
          {backupCodes.length > 0 ? 'Done' : 'Cancel'}
        </Button>
        {#if backupCodes.length === 0}
          <Button
            onclick={regenerateBackupCodes}
            disabled={loading || !verificationCode}
            class="flex-1"
          >
            {#if loading}
              <Loader2 class="w-4 h-4 mr-2 animate-spin" />
            {/if}
            Generate New Codes
          </Button>
        {/if}
      </div>
    </div>
  </div>
{/if}