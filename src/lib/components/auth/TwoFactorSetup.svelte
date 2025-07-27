<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Label from '$lib/components/ui/label.svelte';
  import { toast } from 'svelte-sonner';
  import { Loader2, Copy, Download, Shield } from 'lucide-svelte';

  const dispatch = createEventDispatcher();

  let step: 'intro' | 'qr' | 'verify' | 'backup' = 'intro';
  let loading = false;
  let qrCode = '';
  let manualEntryKey = '';
  let verificationCode = '';
  let backupCodes: string[] = [];
  let isRequired = false;

  async function startSetup() {
    loading = true;
    
    try {
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start 2FA setup');
      }
      
      qrCode = data.qrCode;
      manualEntryKey = data.secret;
      isRequired = data.required;
      step = 'qr';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start 2FA setup');
    } finally {
      loading = false;
    }
  }

  async function verifyCode() {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit verification code');
      return;
    }
    
    loading = true;
    
    try {
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', code: verificationCode })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify code');
      }
      
      backupCodes = data.backupCodes;
      step = 'backup';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to verify code');
    } finally {
      loading = false;
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
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

  function complete() {
    dispatch('complete');
  }
</script>

<div class="space-y-6">
  {#if step === 'intro'}
    <div class="text-center space-y-4">
      <div class="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
        <Shield class="w-8 h-8 text-primary" />
      </div>
      
      <div>
        <h3 class="text-lg font-semibold">Enable Two-Factor Authentication</h3>
        <p class="text-sm text-muted-foreground mt-2">
          Add an extra layer of security to your account by requiring a verification code in addition to your password.
        </p>
      </div>
      
      {#if isRequired}
        <div class="bg-yellow-50 border border-yellow-200 rounded-sm p-3">
          <p class="text-sm text-yellow-800">
            <strong>Note:</strong> Two-factor authentication is required for your account type.
          </p>
        </div>
      {/if}
      
      <div class="text-left space-y-3">
        <h4 class="text-sm font-medium">You'll need:</h4>
        <ul class="text-sm text-muted-foreground space-y-1">
          <li class="flex items-start gap-2">
            <span class="text-primary mt-0.5">•</span>
            <span>An authenticator app like Google Authenticator, Authy, or 1Password</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary mt-0.5">•</span>
            <span>Your mobile device to scan a QR code</span>
          </li>
        </ul>
      </div>
      
      <Button 
        onclick={startSetup} 
        disabled={loading}
        class="w-full"
      >
        {#if loading}
          <Loader2 class="w-4 h-4 mr-2 animate-spin" />
        {/if}
        Get Started
      </Button>
    </div>
  {/if}
  
  {#if step === 'qr'}
    <div class="space-y-6">
      <div>
        <h3 class="text-lg font-semibold">Scan QR Code</h3>
        <p class="text-sm text-muted-foreground mt-1">
          Scan this QR code with your authenticator app
        </p>
      </div>
      
      <div class="bg-white p-4 rounded-sm border flex justify-center">
        <img src={qrCode} alt="2FA QR Code" class="w-48 h-48" />
      </div>
      
      <details class="border rounded-sm">
        <summary class="p-3 cursor-pointer text-sm font-medium hover:bg-muted/50">
          Can't scan? Enter code manually
        </summary>
        <div class="p-3 pt-0 space-y-3">
          <p class="text-sm text-muted-foreground">
            Enter this code in your authenticator app:
          </p>
          <div class="flex items-center gap-2">
            <code class="flex-1 bg-muted px-3 py-2 rounded-sm text-xs font-mono">
              {manualEntryKey}
            </code>
            <Button
              size="sm"
              variant="outline"
              onclick={() => copyToClipboard(manualEntryKey)}
            >
              <Copy class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </details>
      
      <div class="space-y-3">
        <Label for="verification-code">
          Enter the 6-digit code from your authenticator app
        </Label>
        <Input
          id="verification-code"
          type="text"
          inputmode="numeric"
          pattern="[0-9]{6}"
          maxlength="6"
          placeholder="000000"
          bind:value={verificationCode}
          disabled={loading}
        />
        <Button 
          onclick={verifyCode} 
          disabled={loading || verificationCode.length !== 6}
          class="w-full"
        >
          {#if loading}
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
          {/if}
          Verify Code
        </Button>
      </div>
    </div>
  {/if}
  
  {#if step === 'backup'}
    <div class="space-y-6">
      <div>
        <h3 class="text-lg font-semibold">Save Your Backup Codes</h3>
        <p class="text-sm text-muted-foreground mt-1">
          Save these codes in a safe place. You can use them to access your account if you lose your authenticator device.
        </p>
      </div>
      
      <div class="bg-yellow-50 border border-yellow-200 rounded-sm p-3">
        <p class="text-sm text-yellow-800">
          <strong>Important:</strong> Each backup code can only be used once. Store them securely!
        </p>
      </div>
      
      <div class="bg-muted/50 rounded-sm p-4 space-y-2">
        {#each backupCodes as code}
          <div class="flex items-center justify-between">
            <code class="font-mono text-sm">{code}</code>
            <Button
              size="sm"
              variant="ghost"
              onclick={() => copyToClipboard(code)}
            >
              <Copy class="w-3 h-3" />
            </Button>
          </div>
        {/each}
      </div>
      
      <div class="flex gap-3">
        <Button
          variant="outline"
          onclick={downloadBackupCodes}
          class="flex-1"
        >
          <Download class="w-4 h-4 mr-2" />
          Download Codes
        </Button>
        <Button
          onclick={complete}
          class="flex-1"
        >
          I've Saved My Codes
        </Button>
      </div>
    </div>
  {/if}
</div>