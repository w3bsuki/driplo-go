import { redirect } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession()
	
	if (!user) {
		throw redirect(303, '/login')
	}
	
	// Get user profile with brand info and social media accounts
	const { data: profile, error: profileError } = await locals.supabase
		.from('profiles')
		.select(`
			*,
			socialMediaAccounts:social_media_accounts(*)
		`)
		.eq('id', user.id)
		.single()
	
	if (profileError) {
		console.error('Error loading profile:', profileError)
		// Fallback: try without join
		const { data: profileSimple } = await locals.supabase
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.single()
		
		const { data: socialMediaAccounts } = await locals.supabase
			.from('social_media_accounts')
			.select('*')
			.eq('user_id', user.id)
		
		return {
			user,
			profile: profileSimple,
			socialMediaAccounts: socialMediaAccounts || [],
			verificationRequest: null
		}
	}
	
	// Get verification status
	const { data: verificationRequest } = await locals.supabase
		.from('brand_verification_requests' as any)
		.select('*')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle()
	
	return {
		user,
		profile,
		socialMediaAccounts: profile?.socialMediaAccounts || [],
		verificationRequest
	}
}

export const actions = {
	updateBrand: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession()
		if (!user) throw redirect(303, '/login')
		
		const formData = await request.formData()
		
		// Update profile with brand info
		const { error } = await locals.supabase
			.from('profiles')
			.update({
				brand_name: formData.get('brand_name'),
				brand_description: formData.get('brand_description'),
				brand_size: formData.get('brand_size'),
				account_type: 'brand'
			})
			.eq('id', user.id)
		
		if (error) {
			return { success: false, error: error.message }
		}
		
		return { success: true }
	},
	
	requestVerification: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession()
		if (!user) throw redirect(303, '/login')
		
		const formData = await request.formData()
		
		// Create verification request
		const { error } = await locals.supabase
			.from('brand_verification_requests' as any)
			.insert({
				user_id: user.id,
				business_type: formData.get('business_type'),
				business_registration_number: formData.get('registration_number'),
				business_description: formData.get('business_description'),
				documents: [], // In production, handle file uploads
				status: 'pending'
			})
		
		if (error) {
			return { success: false, error: error.message }
		}
		
		return { success: true }
	}
} satisfies Actions