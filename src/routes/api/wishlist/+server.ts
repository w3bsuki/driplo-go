import type { RequestHandler } from './$types'
import { apiError, apiSuccess, ApiErrorType, requireAuth, validateRequest } from '$lib/server/api-utils'
import { z } from 'zod'
import type { WishlistToggleResponse } from '$lib/types/api.types'

export const GET: RequestHandler = async ({ locals }) => {
	const requestId = crypto.randomUUID()
	
	try {
		// Check authentication
		const auth = await requireAuth(locals)
		if (!auth) {
			return apiError('Unauthorized', 401, ApiErrorType.AUTHENTICATION, undefined, requestId)
		}

		const { data: favorites, error: favoritesError } = await locals.supabase
			.from('favorites')
			.select(`
				id,
				created_at,
				listing_id,
				listings (
					id,
					title,
					price,
					images,
					size,
					brand,
					condition,
					seller_id,
					profiles (
						username,
						avatar_url
					)
				)
			`)
			.eq('user_id', auth.userId)
			.order('created_at', { ascending: false })

		if (favoritesError) {
			return apiError(
				'Failed to fetch favorites',
				500,
				ApiErrorType.DATABASE,
				undefined,
				requestId
			)
		}

		return apiSuccess({ favorites: favorites || [] }, 200, requestId)
	} catch (error) {
		return apiError(
			'An unexpected error occurred',
			500,
			ApiErrorType.INTERNAL,
			undefined,
			requestId
		)
	}
}

const wishlistSchema = z.object({
	listing_id: z.string().uuid()
})

export const POST: RequestHandler = async ({ request, locals }) => {
	const requestId = crypto.randomUUID()
	
	try {
		// Check authentication
		const auth = await requireAuth(locals)
		if (!auth) {
			return apiError('Unauthorized', 401, ApiErrorType.AUTHENTICATION, undefined, requestId)
		}
		
		// Validate request body
		const { listing_id } = await validateRequest(request, wishlistSchema)

		// Check if already favorited
		const { data: existing } = await locals.supabase
			.from('favorites')
			.select('id')
			.eq('user_id', auth.userId)
			.eq('listing_id', listing_id)
			.maybeSingle()

		if (existing) {
			const response: WishlistToggleResponse = {
				added: false,
				favorite_id: existing.id
			}
			return apiSuccess(response, 200, requestId)
		}

		const { data, error: insertError } = await locals.supabase
			.from('favorites')
			.insert({
				user_id: auth.userId,
				listing_id
			})
			.select()
			.single()

		if (insertError) {
			return apiError(
				'Failed to add to favorites',
				500,
				ApiErrorType.DATABASE,
				undefined,
				requestId
			)
		}

		const response: WishlistToggleResponse = {
			added: true,
			favorite_id: data.id
		}
		return apiSuccess(response, 201, requestId)
	} catch (error) {
		if (error instanceof ApiError) {
			return apiError(error.message, error.status, error.type, error.details, requestId)
		}
		return apiError(
			'An unexpected error occurred',
			500,
			ApiErrorType.INTERNAL,
			undefined,
			requestId
		)
	}
}

export const DELETE: RequestHandler = async ({ request, locals }) => {
	const requestId = crypto.randomUUID()
	
	try {
		// Check authentication
		const auth = await requireAuth(locals)
		if (!auth) {
			return apiError('Unauthorized', 401, ApiErrorType.AUTHENTICATION, undefined, requestId)
		}
		
		// Validate request body
		const { listing_id } = await validateRequest(request, wishlistSchema)

		const { error: deleteError } = await locals.supabase
			.from('favorites')
			.delete()
			.eq('user_id', auth.userId)
			.eq('listing_id', listing_id)

		if (deleteError) {
			return apiError(
				'Failed to remove from favorites',
				500,
				ApiErrorType.DATABASE,
				undefined,
				requestId
			)
		}

		const response: WishlistToggleResponse = {
			added: false
		}
		return apiSuccess(response, 200, requestId)
	} catch (error) {
		if (error instanceof ApiError) {
			return apiError(error.message, error.status, error.type, error.details, requestId)
		}
		return apiError(
			'An unexpected error occurred',
			500,
			ApiErrorType.INTERNAL,
			undefined,
			requestId
		)
	}
}