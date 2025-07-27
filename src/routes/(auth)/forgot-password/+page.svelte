<script lang="ts">
	import { goto } from '$app/navigation';
	import { getAuthContext } from '$lib/stores/auth-context.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import { Mail, ArrowLeft } from 'lucide-svelte';
	import { z } from 'zod';
	import type { ActionData } from './$types';

	interface Props {
		form?: ActionData;
	}

	let { form }: Props = $props();

	const auth = getAuthContext();

	let email = $state('');
	let loading = $state(false);
	let success = $state(false);
	let error = $state('');

	const emailSchema = z.string().email('Please enter a valid email address');

	async function handleSubmit() {
		error = '';
		
		try {
			emailSchema.parse(email);
		} catch (e) {
			if (e instanceof z.ZodError) {
				error = e.errors[0].message;
				return;
			}
		}

		loading = true;

		try {
			const { error: resetError } = await auth.supabase.auth.resetPasswordForEmail(email, {
				redirectTo: `${window.location.origin}/reset-password`
			});

			if (resetError) {
				error = resetError.message;
			} else {
				success = true;
			}
		} catch (err) {
			error = 'An error occurred. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Forgot Password - Threadly</title>
	<meta name="description" content="Reset your Threadly password" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 px-4">
	<div class="w-full max-w-md">
		<div class="bg-card rounded-lg shadow-lg border p-6 sm:p-8">
			<div class="mb-6">
				<button
					onclick={() => goto('/login')}
					class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft class="w-4 h-4" />
					Back to login
				</button>
			</div>

			{#if !success}
				<div class="text-center mb-6">
					<div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
						<Mail class="w-6 h-6 text-primary" />
					</div>
					<h1 class="text-2xl font-bold">Forgot your password?</h1>
					<p class="text-muted-foreground mt-2">
						No worries! Enter your email and we'll send you reset instructions.
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
						<label for="email" class="block text-sm font-medium mb-2">
							Email address
						</label>
						<Input
							id="email"
							type="email"
							bind:value={email}
							placeholder="you@example.com"
							required
							disabled={loading}
						/>
					</div>

					<Button type="submit" class="w-full" disabled={loading || !email}>
						{loading ? 'Sending...' : 'Send reset instructions'}
					</Button>
				</form>
			{:else}
				<div class="text-center">
					<div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h2 class="text-2xl font-bold mb-2">Check your email</h2>
					<p class="text-muted-foreground mb-6">
						We've sent password reset instructions to <strong>{email}</strong>
					</p>
					<p class="text-sm text-muted-foreground mb-6">
						Didn't receive the email? Check your spam folder or try again.
					</p>
					<Button
						variant="outline"
						onclick={() => { success = false; email = ''; }}
						class="w-full"
					>
						Try another email
					</Button>
				</div>
			{/if}
		</div>

		<p class="text-center text-sm text-muted-foreground mt-6">
			Remember your password?
			<a href="/login" class="text-primary hover:underline">Sign in</a>
		</p>
	</div>
</div>