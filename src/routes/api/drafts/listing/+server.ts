import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// Save or update draft
export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
	const { data: { user }, error: authError } = await supabase.auth.getUser()
	
	if (authError || !user) {
		throw error(401, 'Unauthorized')
	}
	
	try {
		const formData = await request.json()
		
		// Upsert draft (insert or update)
		const { data, error: dbError } = await supabase
			.from('listing_drafts')
			.upsert({
				user_id: user.id,
				form_data: formData
			}, {
				onConflict: 'user_id'
			})
			.select()
			.single()
		
		if (dbError) {
			console.error('Draft save error:', dbError)
			throw error(500, 'Failed to save draft')
		}
		
		return json({ 
			success: true, 
			message: 'Draft saved',
			updated_at: data.updated_at 
		})
	} catch (err: any) {
		console.error('Draft save error:', err)
		if (err.status) throw err
		throw error(500, 'Internal server error')
	}
}

// Load draft
export const GET: RequestHandler = async ({ locals: { supabase } }) => {
	const { data: { user }, error: authError } = await supabase.auth.getUser()
	
	if (authError || !user) {
		throw error(401, 'Unauthorized')
	}
	
	try {
		const { data, error: dbError } = await supabase
			.from('listing_drafts')
			.select('*')
			.eq('user_id', user.id)
			.single()
		
		if (dbError) {
			// No draft found is not an error
			if (dbError.code === 'PGRST116') {
				return json({ draft: null })
			}
			console.error('Draft load error:', dbError)
			throw error(500, 'Failed to load draft')
		}
		
		return json({ 
			draft: data.form_data,
			updated_at: data.updated_at
		})
	} catch (err: any) {
		console.error('Draft load error:', err)
		if (err.status) throw err
		throw error(500, 'Internal server error')
	}
}

// Delete draft
export const DELETE: RequestHandler = async ({ locals: { supabase } }) => {
	const { data: { user }, error: authError } = await supabase.auth.getUser()
	
	if (authError || !user) {
		throw error(401, 'Unauthorized')
	}
	
	try {
		const { error: dbError } = await supabase
			.from('listing_drafts')
			.delete()
			.eq('user_id', user.id)
		
		if (dbError) {
			console.error('Draft delete error:', dbError)
			throw error(500, 'Failed to delete draft')
		}
		
		return json({ success: true })
	} catch (err: any) {
		console.error('Draft delete error:', err)
		if (err.status) throw err
		throw error(500, 'Internal server error')
	}
}