<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getAuthContext } from '$lib/stores/auth-context.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import PasswordStrength from '$lib/components/ui/PasswordStrength.svelte';
	import { Lock, Eye, EyeOff } from 'lucide-svelte';
	import { z } from 'zod';
	import type { ActionData } from './$types';

	interface Props {
		form?: ActionData;
		data: any;
	}

	let { form, data }: Props = $props();

	const auth = getAuthContext();

	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let loading = $state(false);
	let success = $state(false);
	let error = $state('');

	const passwordSchema = z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
		.regex(/[a-z]/, 'Password must contain at least one lowercase letter')
		.regex(/[0-9]/, 'Password must contain at least one number');

	$effect(() => {
		// Check if we have the necessary tokens/codes in the URL
		const hashParams = new URLSearchParams(window.location.hash.slice(1));
		const queryParams = $page.url.searchParams;
		
		if (!hashParams.get('access_token') && !queryParams.get('code')) {
			error = 'Invalid or expired reset link. Please request a new password reset.';
		}
	});

	async function handleSubmit() {
		error = '';

		// Validate passwords
		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		try {
			passwordSchema.parse(password);
		} catch (e) {
			if (e instanceof z.ZodError) {
				error = e.errors[0].message;
				return;
			}
		}

		loading = true;

		try {
			const { error: updateError } = await auth.supabase.auth.updateUser({
				password: password
			});

			if (updateError) {
				error = updateError.message;
			} else {
				success = true;
				// Redirect to login after 3 seconds
				setTimeout(() => {
					goto('/login?reset=success');
				}, 3000);
			}
		} catch (err) {
			error = 'An error occurred. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Reset Password - Threadly</title>
	<meta name="description" content="Reset your Threadly password" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 px-4">
	<div class="w-full max-w-md">
		<div class="bg-card rounded-lg shadow-lg border p-6 sm:p-8">
			{#if !success}
				<div class="text-center mb-6">
					<div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
						<Lock class="w-6 h-6 text-primary" />
					</div>
					<h1 class="text-2xl font-bold">Create new password</h1>
					<p class="text-muted-foreground mt-2">
						Your new password must be different from previous passwords.
					</p>
				</div>

				{#if error}
					<Alert variant="destructive" class="mb-4">
						{error}
					</Alert>
				{/if}

				{#if form?.error}
					<Alert variant="destructive" class="mb-4">
						{form.error}
					</Alert>
				{/if}

				<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
					<div>
						<label for="password" class="block text-sm font-medium mb-2">
							New password
						</label>
						<div class="relative">
							<Input
								id="password"
								type={showPassword ? 'text' : 'password'}
								bind:value={password}
								placeholder="Enter new password"
								required
								disabled={loading}
								class="pr-10"
							/>
							<button
								type="button"
								onclick={() => showPassword = !showPassword}
								class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								{#if showPassword}
									<EyeOff class="w-5 h-5" />
								{:else}
									<Eye class="w-5 h-5" />
								{/if}
							</button>
						</div>
						{#if password}
							<PasswordStrength {password} class="mt-2" />
						{/if}
					</div>

					<div>
						<label for="confirmPassword" class="block text-sm font-medium mb-2">
							Confirm password
						</label>
						<div class="relative">
							<Input
								id="confirmPassword"
								type={showConfirmPassword ? 'text' : 'password'}
								bind:value={confirmPassword}
								placeholder="Confirm new password"
								required
								disabled={loading}
								class="pr-10"
							/>
							<button
								type="button"
								onclick={() => showConfirmPassword = !showConfirmPassword}
								class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								{#if showConfirmPassword}
									<EyeOff class="w-5 h-5" />
								{:else}
									<Eye class="w-5 h-5" />
								{/if}
							</button>
						</div>
					</div>

					<div class="text-sm text-muted-foreground space-y-1">
						<p>Password must:</p>
						<ul class="list-disc list-inside space-y-1 ml-2">
							<li>Be at least 8 characters long</li>
							<li>Include uppercase and lowercase letters</li>
							<li>Include at least one number</li>
						</ul>
					</div>

					<Button type="submit" class="w-full" disabled={loading || !password || !confirmPassword}>
						{loading ? 'Resetting...' : 'Reset password'}
					</Button>
				</form>
			{:else}
				<div class="text-center">
					<div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h2 class="text-2xl font-bold mb-2">Password reset successful!</h2>
					<p class="text-muted-foreground mb-6">
						Your password has been reset successfully. Redirecting you to login...
					</p>
					<Button onclick={() => goto('/login')} class="w-full">
						Go to login
					</Button>
				</div>
			{/if}
		</div>

		{#if !success}
			<p class="text-center text-sm text-muted-foreground mt-6">
				Remember your password?
				<a href="/login" class="text-primary hover:underline">Sign in</a>
			</p>
		{/if}
	</div>
</div>