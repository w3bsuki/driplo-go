import { json } from '@sveltejs/kit'
import { createAdminClient } from '$lib/server/supabase-admin'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
	try {
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