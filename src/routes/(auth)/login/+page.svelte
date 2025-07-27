<script lang="ts">
	import { enhance } from '$app/forms'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { getAuthContext } from '$lib/stores/auth-context.svelte'
	import { Eye, EyeOff, Github } from 'lucide-svelte'
	import { toast } from 'svelte-sonner'
	import * as m from '$lib/paraglide/messages.js'
	import Spinner from '$lib/components/ui/Spinner.svelte'
	import { Button, Input } from '$lib/components/ui'
	import Icon from '$lib/components/ui/icon.svelte'
	import { onMount } from 'svelte'
	import CaptchaWrapper from '$lib/components/auth/CaptchaWrapper.svelte'

	const auth = getAuthContext()
	console.log('Auth context in login page:', auth)

	let email = ''
	let password = ''
	let showPassword = false
	let rememberMe = false
	let loading = false
	
	// CAPTCHA state
	let captchaToken: string | null = null
	let showCaptchaError = false
	let captchaRef: CaptchaWrapper

	// Show error messages based on URL parameters
	onMount(() => {
		const error = $page.url.searchParams.get('error')
		const message = $page.url.searchParams.get('message')
		
		if (error) {
			switch (error) {
				case 'verification_expired':
					toast.error('Your verification link has expired. Please sign up again.')
					break
				case 'invalid_token':
					toast.error('Invalid verification link. Please try signing up again.')
					break
				case 'verification_failed':
					toast.error('Email verification failed. Please try again.')
					break
				case 'missing_token':
					toast.error('Invalid verification link.')
					break
				case 'auth_callback_error':
					toast.error('Authentication failed. Please try again.')
					break
				case 'session_expired':
					toast.error('Your session has expired. Please log in again.')
					break
				case 'unauthorized':
					toast.error('Please log in to access that page.')
					break
				default:
					toast.error('An error occurred. Please try again.')
			}
		}
		
		if (message) {
			switch (message) {
				case 'logged_out':
					toast.success('You have been successfully logged out.')
					break
				case 'email_verified':
					toast.success('Your email has been verified. You can now log in.')
					break
			}
		}
		
		// Clear any stale auth data on mount
		if (auth && auth.user && !auth.session) {
			// User exists but no session - likely stale data
			auth.user = null
			auth.profile = null
		}
	})

	async function handleLogin() {
		if (!email || !password) {
			toast.error(m.auth_fill_all_fields())
			return
		}
		
		// Check if auth context exists
		if (!auth) {
			toast.error('Authentication service not available. Please refresh the page.')
			return
		}
		
		// Check CAPTCHA in production
		if (import.meta.env.MODE === 'production' && !captchaToken) {
			showCaptchaError = true
			toast.error('Please complete the CAPTCHA verification')
			return
		}

		loading = true
		try {
			await auth.signIn(email, password, rememberMe)
			toast.success(m.auth_welcome_back_toast())
			
			// Reset CAPTCHA for security
			if (captchaRef) {
				captchaRef.reset()
			}
			captchaToken = null
			
			goto('/')
		} catch (error) {
			if (error instanceof Error) {
				// Handle specific error cases
				if (error.message.includes('Email not confirmed')) {
					toast.error('Please verify your email before logging in. Check your inbox for the confirmation link.')
					showResendForm = true
				} else if (error.message.includes('Invalid login credentials')) {
					toast.error('Invalid email or password. Please try again.')
				} else if (error.message.includes('Too many login attempts')) {
					toast.error(error.message)
				} else if (error.message.includes('rate_limit_exceeded')) {
					toast.error('Too many login attempts. Please try again later.')
				} else {
					toast.error(error.message || m.auth_login_failed())
				}
			} else {
				toast.error(m.auth_login_failed())
			}
		} finally {
			loading = false
		}
	}

	async function handleOAuth(provider: 'google' | 'github') {
		if (!auth) {
			toast.error('Authentication service not available. Please refresh the page.')
			return
		}
		
		loading = true
		try {
			await auth.signInWithProvider(provider)
		} catch (error) {
			if (error instanceof Error) {
				toast.error(error.message || m.auth_oauth_failed())
			} else {
				toast.error(m.auth_oauth_failed())
			}
			loading = false
		}
	}

	let resendEmail = ''
	let resendLoading = false
	let showResendForm = false

	async function handleResendVerification() {
		if (!resendEmail) {
			toast.error('Please enter your email address')
			return
		}

		resendLoading = true
		try {
			const response = await fetch('/api/auth/resend-verification', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: resendEmail })
			})

			const data = await response.json()
			
			if (data.success) {
				toast.success(data.message)
				showResendForm = false
				resendEmail = ''
			} else {
				toast.error(data.error || 'Failed to resend verification email')
			}
		} catch (error) {
			toast.error('An error occurred. Please try again.')
		} finally {
			resendLoading = false
		}
	}
</script>

<svelte:head>
	<title>Sign In | Driplo</title>
	<meta name="description" content="Sign in to your Driplo account" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
	<div class="w-full max-w-md">
		<div class="bg-white rounded-sm border border-gray-200 p-3">
			<!-- Logo -->
			<div class="text-center mb-3">
				<h1 class="text-2xl font-bold text-blue-400">Driplo</h1>
				<p class="text-gray-600 text-sm mt-1">Welcome back</p>
			</div>
			
			<!-- OAuth Buttons -->
			<div class="space-y-2 mb-3">
				<Button
					variant="outline"
					size="lg"
					class="w-full"
					onclick={() => handleOAuth('google')}
					disabled={loading}
				>
					<svg class="w-5 h-5" viewBox="0 0 24 24">
						<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
						<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
						<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
						<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
					</svg>
					Continue with Google
				</Button>
				<Button
					variant="outline"
					size="lg"
					class="w-full"
					onclick={() => handleOAuth('github')}
					disabled={loading}
				>
					<Icon icon={Github} size="sm" />
					Continue with GitHub
				</Button>
			</div>

			<!-- Divider -->
			<div class="relative mb-3">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-200"></div>
				</div>
				<div class="relative flex justify-center text-xs">
					<span class="px-2 bg-white text-gray-500">Or</span>
				</div>
			</div>

			<!-- Login Form -->
			<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-3">
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
						Email
					</label>
					<Input
						id="email"
						type="email"
						bind:value={email}
						placeholder="Enter your email"
						required
						disabled={loading}
						autocomplete="email"
						size="lg"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-1">
						Password
					</label>
					<div class="relative">
						<Input
							id="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							placeholder="Enter your password"
							required
							disabled={loading}
							autocomplete="current-password"
							size="lg"
							class="pr-10"
						/>
						<button
							type="button"
							class="absolute inset-y-0 right-0 pr-3 flex items-center touch-safe"
							onclick={() => showPassword = !showPassword}
						>
							{#if showPassword}
								<Icon icon={EyeOff} size="sm" class="text-gray-400" />
							{:else}
								<Icon icon={Eye} size="sm" class="text-gray-400" />
							{/if}
						</button>
					</div>
				</div>
				
				<!-- CAPTCHA -->
				<div>
					<CaptchaWrapper
						bind:this={captchaRef}
						onVerify={(token) => {
							captchaToken = token
							showCaptchaError = false
						}}
						onExpire={() => {
							captchaToken = null
						}}
						onError={() => {
							captchaToken = null
							toast.error('CAPTCHA verification failed. Please try again.')
						}}
					/>
					{#if showCaptchaError && !captchaToken}
						<p class="text-red-500 text-xs mt-1">Please complete the CAPTCHA verification</p>
					{/if}
				</div>

				<div class="flex items-center justify-between text-sm">
					<label class="flex items-center">
						<input 
							type="checkbox" 
							bind:checked={rememberMe}
							class="rounded-sm border-gray-300 text-blue-400 focus:ring-blue-400" 
						/>
						<span class="ml-2 text-gray-600">Remember me</span>
					</label>
					<a href="/forgot-password" class="text-blue-400 hover:text-blue-500">
						Forgot password?
					</a>
				</div>

				<button 
					type="submit" 
					class="w-full py-2 bg-blue-400 text-white font-medium rounded-sm hover:bg-blue-500 transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
					disabled={loading || (import.meta.env.MODE === 'production' && !captchaToken)}
				>
					{#if loading}
						<Spinner size="sm" color="white" />
					{:else}
						Sign in
					{/if}
				</button>
			</form>

			<!-- Sign up link -->
			<p class="text-center text-sm text-gray-600 mt-3">
				Don't have an account?
				<a href="/register" class="text-blue-400 hover:text-blue-500 font-medium">
					Sign up
				</a>
			</p>

			<!-- Resend verification link -->
			<p class="text-center text-sm text-gray-600 mt-2">
				Need to verify your email?
				<button
					type="button"
					onclick={() => showResendForm = !showResendForm}
					class="text-blue-400 hover:text-blue-500 font-medium"
				>
					Resend verification
				</button>
			</p>

			<!-- Resend verification form -->
			{#if showResendForm}
				<div class="mt-3 p-3 bg-gray-50 rounded-sm border border-gray-200">
					<p class="text-sm text-gray-700 mb-2">
						Enter your email to receive a new verification link
					</p>
					<form onsubmit={(e) => { e.preventDefault(); handleResendVerification(); }} class="space-y-3">
						<Input
							type="email"
							bind:value={resendEmail}
							placeholder="Enter your email"
							required
							disabled={resendLoading}
							autocomplete="email"
						/>
						<div class="flex gap-2">
							<Button
								type="submit"
								disabled={resendLoading}
								size="sm"
								class="flex-1"
							>
								{#if resendLoading}
									<Spinner size="sm" color="white" />
								{:else}
									Send Verification Email
								{/if}
							</Button>
							<button
								type="button"
								onclick={() => { showResendForm = false; resendEmail = ''; }}
								class="px-3 py-2 border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors duration-fast text-sm"
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			{/if}
		</div>
	</div>
</div>