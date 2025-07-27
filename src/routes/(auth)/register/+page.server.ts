import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { z } from 'zod'

const registerSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
	confirmPassword: z.string(),
	accountType: z.enum(['personal', 'brand']),
	brandName: z.string().optional(),
	brandCategory: z.string().optional(),
	brandWebsite: z.string().optional(),
	captchaToken: z.string().optional(),
	agreedToTerms: z.string().transform(val => val === 'on')
}).refine(data => data.password === data.confirmPassword, {
	message: "Passwords don't match",
	path: ["confirmPassword"]
}).refine(data => data.agreedToTerms, {
	message: "You must agree to the terms of service",
	path: ["agreedToTerms"]
})

export const load: PageServerLoad = async ({ locals: { safeGetSession }, url }) => {
	const { session } = await safeGetSession()
	
	// If already logged in, redirect to home
	if (session) {
		throw redirect(303, '/')
	}
	
	// Check if showing success message
	const success = url.searchParams.get('success') === 'true'
	
	return {
		success
	}
}

export const actions = {
	default: async ({ request, locals, getClientAddress }) => {
		const formData = await request.formData()
		const data = Object.fromEntries(formData)
		
		// Validate form data
		const result = registerSchema.safeParse(data)
		if (!result.success) {
			return fail(400, {
				error: 'Please check your form and try again',
				errors: result.error.flatten().fieldErrors
			})
		}
		
		const { 
			email, 
			password, 
			accountType, 
			brandName, 
			brandCategory, 
			brandWebsite, 
			captchaToken 
		} = result.data
		
		// Verify CAPTCHA with Google (skip in development if not configured)
		const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY
		
		// In development, skip CAPTCHA if not configured
		if (process.env.NODE_ENV !== 'production' && !recaptchaSecret) {
			// Skip CAPTCHA verification in development
		} else if (recaptchaSecret && captchaToken) {
			try {
				const verifyResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: new URLSearchParams({
						secret: recaptchaSecret,
						response: captchaToken,
						remoteip: getClientAddress()
					})
				})
				
				const verifyData = await verifyResponse.json()
				
				if (!verifyData.success) {
					return fail(400, {
						error: 'CAPTCHA verification failed. Please try again.'
					})
				}
			} catch (error) {
				console.error('CAPTCHA verification error:', error)
				// Continue without CAPTCHA in development
				if (process.env.NODE_ENV === 'production') {
					return fail(500, {
						error: 'CAPTCHA verification service unavailable'
					})
				}
			}
		} else if (process.env.NODE_ENV === 'production' && !captchaToken) {
			// In production, CAPTCHA is required
			return fail(400, {
				error: 'CAPTCHA verification is required'
			})
		}
		
		// Check rate limit using RPC function
		const { data: rateLimitCheck, error: rateLimitError } = await locals.supabase.rpc('check_auth_rate_limit', {
			p_identifier: email,
			p_action: 'register',
			p_max_attempts: 3,
			p_window_minutes: 60,
			p_block_minutes: 120
		})
		
		if (rateLimitError) {
			console.error('Rate limit check error:', rateLimitError)
		}
		
		if (rateLimitCheck && !rateLimitCheck.allowed) {
			const minutes = Math.ceil((rateLimitCheck.retry_after || 7200) / 60)
			return fail(429, {
				error: `Too many registration attempts. Please try again in ${minutes} minutes.`
			})
		}
		
		// Generate a temporary username from email
		const tempUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 1000)
		
		// Sign up user through Supabase Auth
		const { data: signUpData, error: signUpError } = await locals.supabase.auth.signUp({
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
				emailRedirectTo: `${request.headers.get('origin')}/auth/callback`
			}
		})
		
		if (signUpError) {
			// Log failed registration attempt
			await locals.supabase.rpc('log_auth_event', {
				p_user_id: null,
				p_action: 'register_failed',
				p_ip_address: getClientAddress(),
				p_user_agent: request.headers.get('user-agent') || null,
				p_success: false,
				p_error_message: signUpError.message,
				p_metadata: { email, account_type: accountType }
			}).catch(console.error)
			
			// Handle specific error cases
			if (signUpError.message?.includes('duplicate') || signUpError.message?.includes('already registered')) {
				return fail(400, {
					error: 'An account with this email already exists'
				})
			}
			
			return fail(400, {
				error: signUpError.message || 'Registration failed'
			})
		}
		
		if (signUpData.user) {
			// Log successful registration
			await locals.supabase.rpc('log_auth_event', {
				p_user_id: signUpData.user.id,
				p_action: 'register_success',
				p_ip_address: getClientAddress(),
				p_user_agent: request.headers.get('user-agent') || null,
				p_success: true,
				p_error_message: null,
				p_metadata: { email, account_type: accountType }
			}).catch(console.error)
		}
		
		// Redirect to success page
		throw redirect(303, '/register?success=true')
	}
} satisfies Actions