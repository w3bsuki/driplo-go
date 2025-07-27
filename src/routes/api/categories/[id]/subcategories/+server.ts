import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params, locals }) => {
	const { id } = params
	
	try {
		const { data, error } = await locals.supabase
			.from('categories')
			.select('id, name, icon, slug')
			.eq('parent_id', id)
			.eq('is_active', true)
			.order('display_order')
		
		if (error) {
			console.error('Failed to load subcategories:', error)
			return json({ error: 'Failed to load subcategories' }, { status: 500 })
		}
		
		return json(data || [])
	} catch (error) {
		console.error('Failed to load subcategories:', error)
		return json({ error: 'Failed to load subcategories' }, { status: 500 })
	}
}