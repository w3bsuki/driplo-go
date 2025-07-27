<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { getAuthContext } from '$lib/stores/auth-context.svelte'
	import { Eye, EyeOff, Github, CheckCircle, Store, User } from 'lucide-svelte'
	import { toast } from 'svelte-sonner'
	import { z } from 'zod'
	import * as m from '$lib/paraglide/messages.js'
	import Spinner from '$lib/components/ui/Spinner.svelte'
	import { cn } from '$lib/utils'
	import { onMount } from 'svelte'
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
	import { createBrowserClient } from '@supabase/ssr'
	import CaptchaWrapper from '$lib/components/auth/CaptchaWrapper.svelte'

	const auth = getAuthContext()
	
	// Create a direct Supabase client as fallback
	const supabaseClient = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY)
	

	let email = $state('')
	let password = $state('')
	let confirmPassword = $state('')
	let showPassword = $state(false)
	let showConfirmPassword = $state(false)
	let loading = $state(false)
	let agreedToTerms = $state(false)
	let accountType = $state<'personal' | 'brand'>('personal')
	
	// Brand-specific fields
	let brandName = $state('')
	let brandCategory = $state('')
	let brandWebsite = $state('')
	
	// CAPTCHA state
	let captchaToken = $state<string | null>(null)
	let showCaptchaError = $state(false)
	let captchaRef: CaptchaWrapper
	
	// Check if showing success message
	let showSuccess = $derived($page.url.searchParams.get('success') === 'true')

	const registerSchema = z.object({
		email: z.string().email('Please enter a valid email address'),
		password: z.string().min(8, 'Password must be at least 8 characters'),
		confirmPassword: z.string(),
		agreedToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms of service'),
		accountType: z.enum(['personal', 'brand']),
		brandName: z.string().optional(),
		brandCategory: z.string().optional(),
		brandWebsite: z.string().optional().refine(
			(val) => !val || val === '' || z.string().url().safeParse(val).success,
			{ message: 'Must be a valid URL' }
		)
	}).refine(data => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"]
	}).refine(data => {
		if (data.accountType === 'brand') {
			return data.brandName && data.brandName.length >= 2
		}
		return true
	}, {
		message: "Brand name is required for brand accounts",
		path: ["brandName"]
	})

	async function handleRegister(e?: Event) {
		
		// Prevent default form submission
		if (e && e.preventDefault) {
			e.preventDefault();
		}
		
		// Check CAPTCHA
		if (!captchaToken) {
			showCaptchaError = true
			toast.error('Please complete the CAPTCHA verification')
			return
		}
		
		// Double check auth context
		if (!auth && !supabaseClient) {
			toast.error('Authentication service not available. Please refresh the page.');
			return;
		}
		
		try {
			const validatedData = registerSchema.parse({
				email,
				password,
				confirmPassword,
				agreedToTerms,
				accountType,
				brandName: brandName || undefined,
				brandCategory: brandCategory || undefined,
				brandWebsite: brandWebsite || undefined
			})

			loading = true
			
			// Try to use auth context first, fallback to direct client
			if (auth) {
				// Sign up with additional metadata and CAPTCHA token
				// Generate a temporary username based on email
				const tempUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 1000)
				await auth.signUp(email, password, tempUsername, undefined, {
					account_type: accountType,
					brand_name: accountType === 'brand' ? brandName : undefined,
					brand_category: accountType === 'brand' ? brandCategory : undefined,
					brand_website: accountType === 'brand' ? brandWebsite : undefined,
					captcha_token: captchaToken,
					needs_username_setup: true
				})
			} else {
				// Use direct Supabase client
				const tempUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 1000)
				const { data, error } = await supabaseClient.auth.signUp({
					email,
					password,
					options: {
						data: {
							username: tempUsername,
							full_name: undefined,
							account_type: accountType,
							brand_name: accountType === 'brand' ? brandName : undefined,
							brand_category: accountType === 'brand' ? brandCategory : undefined,
							brand_website: accountType === 'brand' ? brandWebsite : undefined,
							needs_username_setup: true
						},
						emailRedirectTo: `${window.location.origin}/auth/confirm`,
						captchaToken: captchaToken
					}
				})
				
				if (error) {
					throw error;
				}
			}
			
			// Show success message
			toast.success('Account created! Please check your email to verify your account.')
			
			// Reset CAPTCHA for security
			if (captchaRef) {
				captchaRef.reset()
			}
			captchaToken = null
			
			goto('/register?success=true')
		} catch (error) {
			if (error instanceof z.ZodError) {
				// Zod validation errors
				error.issues.forEach((issue) => {
					toast.error(issue.message)
				})
			} else if (error instanceof Error) {
				// Handle specific Supabase auth errors
				if (error.message.includes('duplicate key') || error.message.includes('already registered')) {
					toast.error('An account with this email already exists. Please login instead.')
				} else if (error.message.includes('username') && error.message.includes('unique')) {
					toast.error('This username is already taken. Please choose another.')
				} else if (error.message.includes('rate limit')) {
					toast.error('Too many signup attempts. Please try again later.')
				} else if (error.message.includes('invalid email')) {
					toast.error('Please enter a valid email address.')
				} else if (error.message.includes('weak password')) {
					toast.error('Password is too weak. Please use a stronger password.')
				} else {
					toast.error(error.message || 'Registration failed')
				}
			} else {
				toast.error('Registration failed')
			}
		} finally {
			loading = false
		}
	}

	async function handleOAuth(provider: 'google' | 'github') {
		loading = true
		try {
			// Store account type preference in localStorage for OAuth callback
			if (accountType === 'brand') {
				localStorage.setItem('pending_account_type', 'brand')
			}
			await auth.signInWithProvider(provider)
		} catch (error) {
			if (error instanceof Error) {
				toast.error(error.message || 'OAuth registration failed')
			} else {
				toast.error('OAuth registration failed')
			}
			loading = false
		}
	}
	
</script>

<svelte:head>
	<title>Sign Up | Driplo</title>
	<meta name="description" content="Create your Driplo account - Personal or Brand" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-2">
	<div class="w-full max-w-md">
		{#if showSuccess}
			<!-- Success message after signup -->
			<div class="bg-white rounded-sm border border-gray-200 p-3 text-center">
				<div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
					<CheckCircle class="w-8 h-8 text-green-600" />
				</div>
				<h2 class="text-xl font-bold text-gray-900 mb-2">Check your email!</h2>
				<p class="text-gray-600 text-sm mb-3">
					We've sent a verification link to your email address. 
					Click the link to activate your account and get started.
				</p>
				{#if accountType === 'brand'}
					<div class="bg-blue-50 border border-blue-200 rounded-sm p-3 mb-3">
						<p class="text-sm text-blue-700">
							<strong>Next steps for brand accounts:</strong> After verifying your email, 
							you'll need to complete brand verification to access all features.
						</p>
					</div>
				{:else}
					<div class="bg-blue-50 border border-blue-200 rounded-sm p-3 mb-3">
						<p class="text-sm text-blue-700">
							<strong>Tip:</strong> If you don't see the email, check your spam folder or wait a few minutes.
						</p>
					</div>
				{/if}
				<a href="/login" class="text-primary hover:text-primary/80 font-medium">
					Return to login
				</a>
			</div>
		{:else}
		<div class="bg-white rounded-sm border border-gray-200 p-3">
			<!-- Logo -->
			<div class="text-center mb-3">
				<h1 class="text-2xl font-bold text-primary">Driplo</h1>
				<p class="text-gray-600 text-sm mt-1">Create your account</p>
			</div>
			
			<!-- Account Type Selection -->
			<div class="mb-3">
				<label class="block text-xs font-medium text-gray-700 mb-2">
					Account Type
				</label>
				<div class="grid grid-cols-2 gap-2">
					<button
						type="button"
						onclick={() => accountType = 'personal'}
						class={cn(
							"relative p-2 rounded-sm border-2 transition-all duration-fast",
							accountType === 'personal' 
								? "border-primary bg-primary/5" 
								: "border-gray-200 hover:border-gray-300"
						)}
					>
						<div class="text-center">
							<User class={cn("w-6 h-6 mx-auto mb-1", 
								accountType === 'personal' ? "text-primary" : "text-gray-400"
							)} />
							<div class="font-medium text-sm">Personal</div>
							<div class="text-xs text-gray-500">Buy & sell fashion</div>
						</div>
					</button>
					<button
						type="button"
						onclick={() => accountType = 'brand'}
						class={cn(
							"relative p-2 rounded-sm border-2 transition-all duration-fast",
							accountType === 'brand' 
								? "border-primary bg-primary/5" 
								: "border-gray-200 hover:border-gray-300"
						)}
					>
						<div class="text-center">
							<Store class={cn("w-6 h-6 mx-auto mb-1", 
								accountType === 'brand' ? "text-primary" : "text-gray-400"
							)} />
							<div class="font-medium text-sm">Brand</div>
							<div class="text-xs text-gray-500">Sell as a business</div>
						</div>
						<div class="absolute -top-2 -right-2 bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
							Pro
						</div>
					</button>
				</div>
			</div>

			<!-- OAuth Buttons -->
			<div class="space-y-2 mb-4">
				<button
					type="button"
					class="w-full flex items-center justify-center gap-3 px-3 py-2 border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors duration-fast text-sm font-medium"
					onclick={() => handleOAuth('google')}
					disabled={loading}
				>
					<svg class="w-4 h-4" viewBox="0 0 24 24">
						<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
						<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
						<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
						<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
					</svg>
					Continue with Google
				</button>
				<button
					type="button"
					class="w-full flex items-center justify-center gap-3 px-3 py-2 border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors duration-fast text-sm font-medium"
					onclick={() => handleOAuth('github')}
					disabled={loading}
				>
					<Github class="w-4 h-4" />
					Continue with GitHub
				</button>
			</div>

			<!-- Divider -->
			<div class="relative mb-4">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-200"></div>
				</div>
				<div class="relative flex justify-center text-xs">
					<span class="px-3 bg-white text-gray-500">Or</span>
				</div>
			</div>

			<!-- Registration Form -->
			<form 
				method="POST"
				onsubmit={(e) => {
					e.preventDefault();
					handleRegister(e);
				}}
				class="space-y-3"
			>

				<div>
					<label for="email" class="block text-xs font-medium text-gray-700 mb-1">
						Email *
					</label>
					<input
						id="email"
						name="email"
						type="email"
						bind:value={email}
						placeholder="Enter your email"
						required
						disabled={loading}
						autocomplete="email"
						class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary focus:border-primary text-sm"
					/>
				</div>

				{#if accountType === 'brand'}
					<div class="space-y-2 p-2 bg-blue-50 rounded-sm border border-blue-100">
						<div>
							<label for="brandName" class="block text-xs font-medium text-gray-700 mb-1">
								Brand Name *
							</label>
							<input
								id="brandName"
								name="brandName"
								type="text"
								bind:value={brandName}
								placeholder="Your brand name"
								required
								disabled={loading}
								class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-white"
							/>
						</div>
						<div>
							<label for="brandCategory" class="block text-xs font-medium text-gray-700 mb-1">
								Brand Category
							</label>
							<select
								id="brandCategory"
								name="brandCategory"
								bind:value={brandCategory}
								disabled={loading}
								class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-white"
							>
								<option value="">Select category</option>
								<option value="fashion">Fashion & Apparel</option>
								<option value="accessories">Accessories</option>
								<option value="footwear">Footwear</option>
								<option value="jewelry">Jewelry</option>
								<option value="bags">Bags & Luggage</option>
								<option value="beauty">Beauty & Cosmetics</option>
								<option value="vintage">Vintage & Thrift</option>
								<option value="handmade">Handmade & Artisan</option>
								<option value="sustainable">Sustainable Fashion</option>
								<option value="other">Other</option>
							</select>
						</div>
						<div>
							<label for="brandWebsite" class="block text-xs font-medium text-gray-700 mb-1">
								Website (optional)
							</label>
							<input
								id="brandWebsite"
								name="brandWebsite"
								type="url"
								bind:value={brandWebsite}
								placeholder="https://yourbrand.com"
								disabled={loading}
								class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-white"
							/>
						</div>
						<p class="text-xs text-blue-700">
							You'll need to verify your brand after registration to access all features.
						</p>
					</div>
				{/if}

				<div>
					<label for="password" class="block text-xs font-medium text-gray-700 mb-1">
						Password *
					</label>
					<div class="relative">
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							placeholder="Min 8 characters"
							required
							disabled={loading}
							autocomplete="new-password"
							class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary focus:border-primary text-sm"
						/>
						<button
							type="button"
							class="absolute inset-y-0 right-0 pr-3 flex items-center"
							onclick={() => showPassword = !showPassword}
						>
							{#if showPassword}
								<EyeOff class="h-4 w-4 text-gray-400" />
							{:else}
								<Eye class="h-4 w-4 text-gray-400" />
							{/if}
						</button>
					</div>
				</div>

				<div>
					<label for="confirmPassword" class="block text-xs font-medium text-gray-700 mb-1">
						Confirm password *
					</label>
					<div class="relative">
						<input
							id="confirmPassword"
							name="confirmPassword"
							type={showConfirmPassword ? 'text' : 'password'}
							bind:value={confirmPassword}
							placeholder="Confirm password"
							required
							disabled={loading}
							autocomplete="new-password"
							class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary focus:border-primary text-sm"
						/>
						<button
							type="button"
							class="absolute inset-y-0 right-0 pr-3 flex items-center"
							onclick={() => showConfirmPassword = !showConfirmPassword}
						>
							{#if showConfirmPassword}
								<EyeOff class="h-4 w-4 text-gray-400" />
							{:else}
								<Eye class="h-4 w-4 text-gray-400" />
							{/if}
						</button>
					</div>
				</div>

				<div class="flex items-start">
					<input
						type="checkbox"
						id="terms"
						name="agreedToTerms"
						bind:checked={agreedToTerms}
						class="mt-0.5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary/30"
						required
					/>
					<label for="terms" class="ml-2 text-xs text-gray-600">
						I agree to the
						<a href="/terms" class="text-primary hover:text-primary/80">Terms of Service</a>
						and
						<a href="/privacy" class="text-primary hover:text-primary/80">Privacy Policy</a>
					</label>
				</div>
				
				<!-- CAPTCHA -->
				<div class="mb-4">
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
				
				<!-- Hidden fields -->
				<input type="hidden" name="accountType" value={accountType} />
				<input type="hidden" name="captchaToken" value={captchaToken || ''} />

				<button 
					type="submit" 
					style="background-color: #87CEEB; color: white; width: 100%; padding: 10px; border-radius: 8px; font-weight: 500; margin-top: 10px;"
					class="w-full py-2 bg-primary text-white font-medium rounded-sm hover:bg-primary/90 transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
					disabled={loading || !agreedToTerms || (import.meta.env.MODE === 'production' && !captchaToken)}
				>
					{#if loading}
						<Spinner size="sm" color="white" />
					{:else}
						Sign up {accountType === 'brand' ? 'as Brand' : ''}
					{/if}
				</button>
			</form>
			

			<!-- Sign in link -->
			<p class="text-center text-sm text-gray-600 mt-4">
				Already have an account?
				<a href="/login" class="text-primary hover:text-primary/80 font-medium">
					Sign in
				</a>
			</p>
		</div>
		{/if}
	</div>
</div>