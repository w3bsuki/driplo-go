import { json } from '@sveltejs/kit'
import { createAdminClient } from '$lib/server/supabase-admin'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// CRITICAL SECURITY: Require authentication
		const { user } = await locals.safeGetSession()
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 })
		}
		
		// Check if user is already an admin
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single()
		
		if (profile?.role !== 'admin') {
			return json({ error: 'Forbidden - Admin access required' }, { status: 403 })
		}
		
		// Only allow creating admin if no other admins exist (first-time setup)
		const { count } = await locals.supabase
			.from('profiles')
			.select('*', { count: 'exact', head: true })
			.eq('role', 'admin')
		
		if (count && count > 1) {
			return json({ error: 'Admin accounts already exist' }, { status: 403 })
		}
		
		const { email, password } = await request.json()
		
		if (!email || !password) {
			return json({ error: 'Email and password are required' }, { status: 400 })
		}
		
		// Create admin client
		const supabaseAdmin = createAdminClient()
		
		// Create user
		const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
			email,
			password,
			email_confirm: true,
			user_metadata: {
				username: email.split('@')[0],
				full_name: 'Admin User'
			}
		})
		
		if (authError) {
			console.error('Error creating user:', authError)
			return json({ error: authError.message }, { status: 500 })
		}
		
		// Update profile to admin
		const { error: profileError } = await supabaseAdmin
			.from('profiles')
			.update({
				role: 'admin',
				is_admin: true,
				setup_completed: true
			})
			.eq('id', authData.user.id)
		
		if (profileError) {
			console.error('Error updating profile:', profileError)
			return json({ error: 'User created but failed to set admin role' }, { status: 500 })
		}
		
		return json({ 
			success: true, 
			user: {
				id: authData.user.id,
				email: authData.user.email
			}
		})
	} catch (error) {
		console.error('Error in create-first-admin:', error)
		return json({ error: 'Internal server error' }, { status: 500 })
	}
}