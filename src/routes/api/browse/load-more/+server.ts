import type { RequestHandler } from './$types'
import { browseListings } from '$lib/server/browse'
import { getCachedData, cacheKeys, cacheTTL } from '$lib/server/cache'
import { apiError, apiSuccess, ApiErrorType, getPagination } from '$lib/server/api-utils'
import { z } from 'zod'
import type { BrowseLoadMoreResponse } from '$lib/types/api.types'

const filterSchema = z.object({
	category: z.string().optional().default(''),
	subcategory: z.string().optional().default(''),
	search: z.string().optional().default(''),
	minPrice: z.number().nullable().optional(),
	maxPrice: z.number().nullable().optional(),
	sizes: z.array(z.string()).optional().default([]),
	brands: z.array(z.string()).optional().default([]),
	conditions: z.array(z.string()).optional().default([]),
	sortBy: z.string().optional().default('recent')
})

export const GET: RequestHandler = async ({ url, locals }) => {
	const requestId = crypto.randomUUID()
	
	try {
		// Extract and validate filter parameters
		const searchParams = url.searchParams
		const { page, limit } = getPagination(url, 24)
		
		const parseResult = filterSchema.safeParse({
			category: searchParams.get('category'),
			subcategory: searchParams.get('subcategory'),
			search: searchParams.get('q'),
			minPrice: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : null,
			maxPrice: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : null,
			sizes: searchParams.get('sizes')?.split(',').filter(Boolean),
			brands: searchParams.get('brands')?.split(',').filter(Boolean),
			conditions: searchParams.get('conditions')?.split(',').filter(Boolean),
			sortBy: searchParams.get('sort')
		})
		
		if (!parseResult.success) {
			return apiError(
				'Invalid filter parameters',
				400,
				ApiErrorType.VALIDATION,
				{ errors: parseResult.error.flatten() },
				requestId
			)
		}
		
		const filters = {
			...parseResult.data,
			page,
			limit
		}

		// Cache browse results for 5 minutes
		const cacheKey = cacheKeys.browseResults(filters)
		const browseResult = await getCachedData(
			cacheKey,
			() => browseListings(locals.supabase, filters),
			cacheTTL.browseResults
		)

		// Transform listings to match expected format
		const enrichedListings = browseResult.listings.map(listing => ({
			id: listing.id,
			title: listing.title,
			price: listing.price,
			size: listing.size,
			brand: listing.brand,
			image: listing.images?.[0] || '/placeholder.jpg',
			seller: {
				username: listing.seller?.username || 'Unknown',
				avatar: listing.seller?.avatar_url
			},
			likes: listing.favorite_count || 0,
			condition: listing.condition,
			// Include full listing data
			...listing,
			is_negotiable: false,
			shipping_included: false
		}))

		const response: BrowseLoadMoreResponse = {
			listings: enrichedListings,
			hasMore: browseResult.hasMore,
			nextPage: browseResult.hasMore ? page + 1 : null
		}

		return apiSuccess(response, 200, requestId)
	} catch (err) {
		return apiError(
			'Failed to load listings',
			500,
			ApiErrorType.INTERNAL,
			undefined,
			requestId
		)
	}
}