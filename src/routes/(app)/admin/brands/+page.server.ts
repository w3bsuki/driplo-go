import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const { data: requests } = await locals.supabase
		.from('brand_verification_requests' as any)
		.select(`
			*,
			profiles!inner(
				id,
				username,
				email,
				brand_name
			)
		`)
		.order('created_at', { ascending: false })
	
	return {
		requests: requests || []
	}
}

export const actions = {
	approve: async ({ request, locals }) => {
		const formData = await request.formData()
		const requestId = formData.get('requestId') as string
		const userId = formData.get('userId') as string
		
		// Update verification request
		await locals.supabase
			.from('brand_verification_requests' as any)
			.update({
				status: 'approved',
				reviewed_at: new Date().toISOString(),
				reviewed_by: (await locals.safeGetSession()).user?.id
			})
			.eq('id', requestId)
		
		// Update user profile
		await locals.supabase
			.from('profiles')
			.update({
				is_verified: true,
				is_seller: true,
				account_type: 'brand'
			})
			.eq('id', userId)
			
		// Create admin approval record
		await locals.supabase
			.from('admin_approvals' as any)
			.insert({
				admin_id: (await locals.safeGetSession()).user?.id,
				action_type: 'brand_verification',
				target_id: requestId,
				target_type: 'brand_verification_request',
				action_details: { status: 'approved' }
			})
		
		return { success: true }
	},
	
	reject: async ({ request, locals }) => {
		const formData = await request.formData()
		const requestId = formData.get('requestId') as string
		const reason = formData.get('reason') as string
		
		// Update verification request
		await locals.supabase
			.from('brand_verification_requests' as any)
			.update({
				status: 'rejected',
				rejection_reason: reason,
				reviewed_at: new Date().toISOString(),
				reviewed_by: (await locals.safeGetSession()).user?.id
			})
			.eq('id', requestId)
			
		// Create admin approval record
		await locals.supabase
			.from('admin_approvals' as any)
			.insert({
				admin_id: (await locals.safeGetSession()).user?.id,
				action_type: 'brand_verification',
				target_id: requestId,
				target_type: 'brand_verification_request',
				action_details: { status: 'rejected', reason }
			})
		
		return { success: true }
	}
} satisfies Actions