import type { Actions, PageServerLoad } from './$types'
import { fail, redirect } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms'
import { zod } from 'sveltekit-superforms/adapters'
import { createListingSchema, createListingDefaults } from '$lib/schemas/listing'
import { serverCache, cacheKeys } from '$lib/server/cache'

export const load: PageServerLoad = async ({ locals }) => {
	const { data: { user }, error } = await locals.supabase.auth.getUser()
	if (error || !user) {
		throw redirect(303, '/login?redirect=/sell')
	}
	
	// Initialize form with superforms - ensure all fields have proper defaults
	const formDefaults = {
		...createListingDefaults,
		condition: createListingDefaults.condition || 'new_with_tags',
		shipping_type: createListingDefaults.shipping_type || 'standard',
		color: createListingDefaults.color || '',
		images: createListingDefaults.images || [],
		tags: createListingDefaults.tags || [],
		materials: createListingDefaults.materials || []
	}
	const form = await superValidate(formDefaults, zod(createListingSchema))
	
	// Fetch categories
	const { data: categories } = await locals.supabase
		.from('categories')
		.select('*')
		.is('parent_id', null)
		.eq('is_active', true)
		.order('display_order')
	
	// Check payment account
	let hasPaymentAccount = false
	try {
		const { data: paymentAccount } = await locals.supabase
			.from('payment_accounts')
			.select('*')
			.eq('user_id', user.id)
			.single()
		
		hasPaymentAccount = !!paymentAccount
	} catch (error) {
		// If error is "no rows returned", that's fine
		if (error.code !== 'PGRST116') {
			console.error('Failed to check payment account:', error)
		}
	}
	
	return {
		form,
		user, // Return user data explicitly
		categories: categories || [],
		hasPaymentAccount
	}
}

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const { data: { user }, error: authError } = await locals.supabase.auth.getUser()
		if (authError || !user) {
			return fail(401, { error: 'Unauthorized' })
		}

		// Use superValidate to parse the request directly
		const form = await superValidate(request, zod(createListingSchema))
		
		if (!form.valid) {
			console.error('Form validation failed:', form.errors)
			console.error('Form data received:', form.data)
			return fail(400, { form, error: 'Validation failed. Please check all fields.' })
		}
		
		const supabase = locals.supabase
		
		const { title, description, price, category_id, subcategory_id, condition, color, location_city, shipping_type, shipping_cost, brand, size, images, tags, materials, ships_worldwide } = form.data
		
		// Generate slug
		const slug = title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 50) + '-' + Date.now().toString(36)

		try {
			const { data, error } = await supabase
				.from('listings')
				.insert({
					seller_id: user.id,
					title,
					slug,
					description,
					price,
					category_id,
					subcategory_id,
					condition,
					images,
					image_urls: images, // Store in both fields for compatibility
					color,
					location_city,
					shipping_type,
					shipping_cost,
					ships_worldwide,
					status: 'active',
					brand,
					size,
					tags,
					materials,
					location: { city: location_city },
					shipping_info: { 
						type: shipping_type, 
						cost: shipping_cost, 
						worldwide: ships_worldwide 
					},
					published_at: new Date().toISOString()
				})
				.select()
				.single()

			if (error) {
				console.error('Database error:', error)
				console.error('Database error details:', {
					message: error.message,
					details: error.details,
					hint: error.hint,
					code: error.code
				})
				console.error('Data attempted to insert:', {
					seller_id: user.id,
					title,
					category_id,
					subcategory_id,
					price,
					condition,
					shipping_type,
					images_count: images?.length || 0
				})
				return fail(500, { 
					form, 
					error: error.message || 'Failed to create listing' 
				})
			}
			
			// Clear only relevant caches instead of all cache for better performance
			serverCache.delete(cacheKeys.homepage)
			serverCache.delete(cacheKeys.featuredListings)
			serverCache.delete(cacheKeys.popularListings)
			// Clear specific browse cache pattern instead of all cache
			const browsePattern = 'browse:'
			for (const key of serverCache.keys()) {
				if (key.startsWith(browsePattern)) {
					serverCache.delete(key)
				}
			}
			
			// Redirect to success page
			throw redirect(303, `/sell/success?id=${data.id}`)
			
		} catch (error: any) {
			// If it's a redirect, rethrow it
			if (error.status === 303) {
				throw error
			}
			
			console.error('Listing creation error:', error)
			return fail(500, { 
				form,
				error: error.message || 'Failed to create listing' 
			})
		}
	}
}