import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '$lib/types/database'

export interface BrowseFilters {
	category?: string
	subcategory?: string
	search?: string
	minPrice?: number | null
	maxPrice?: number | null
	sizes?: string[]
	brands?: string[]
	conditions?: string[]
	sortBy?: string
	page?: number
	limit?: number
}

export interface BrowseResult {
	listings: any[]
	totalCount: number
	hasMore: boolean
	page: number
	limit: number
}

export async function browseListings(
	supabase: SupabaseClient<Database>,
	filters: BrowseFilters,
	userId?: string
): Promise<BrowseResult> {
	const {
		category = '',
		subcategory = '',
		search = '',
		minPrice,
		maxPrice,
		sizes = [],
		brands = [],
		conditions = [],
		sortBy = 'recent',
		page = 1,
		limit = 24
	} = filters

	try {
		// Get category ID if category filter is provided
		let categoryId: string | null = null
		if (category) {
			const categoryQuery = category.includes('-')
				? supabase.from('categories').select('id').eq('slug', category).single()
				: supabase.from('categories').select('id').eq('name', category).single()
			
			const { data: categoryData } = await categoryQuery
			categoryId = categoryData?.id || null
		}

		// Map sort options to database columns
		let sortColumn = 'created_at'
		let sortOrder = 'desc'
		
		switch (sortBy) {
			case 'price-low':
				sortColumn = 'price'
				sortOrder = 'asc'
				break
			case 'price-high':
				sortColumn = 'price'
				sortOrder = 'desc'
				break
			case 'popular':
				sortColumn = 'view_count'
				sortOrder = 'desc'
				break
			case 'favorites':
				sortColumn = 'like_count'
				sortOrder = 'desc'
				break
			case 'ending':
				sortColumn = 'created_at'
				sortOrder = 'asc'
				break
			case 'recent':
			default:
				sortColumn = 'created_at'
				sortOrder = 'desc'
				break
		}

		// Execute optimized queries in parallel
		const offset = (page - 1) * limit
		const [listingsResult, countResult] = await Promise.all([
			// Get listings with all related data in a single query
			supabase.rpc('get_listings_with_favorites', {
				p_user_id: userId || null,
				p_limit: limit,
				p_offset: offset,
				p_status: 'active',
				p_category_id: categoryId,
				p_subcategory_id: subcategory || null,
				p_min_price: minPrice,
				p_max_price: maxPrice,
				p_brands: brands.length > 0 ? brands : null,
				p_sizes: sizes.length > 0 ? sizes : null,
				p_conditions: conditions.length > 0 ? conditions : null,
				p_sort_by: sortColumn,
				p_sort_order: sortOrder,
				p_search: search || null
			}),
			// Get total count
			supabase.rpc('get_listings_count', {
				p_status: 'active',
				p_category_id: categoryId,
				p_subcategory_id: subcategory || null,
				p_min_price: minPrice,
				p_max_price: maxPrice,
				p_brands: brands.length > 0 ? brands : null,
				p_sizes: sizes.length > 0 ? sizes : null,
				p_conditions: conditions.length > 0 ? conditions : null,
				p_search: search || null
			})
		])

		if (listingsResult.error) {
			console.error('Browse listings error:', listingsResult.error)
			throw listingsResult.error
		}

		if (countResult.error) {
			console.error('Browse count error:', countResult.error)
			throw countResult.error
		}

		// Transform the RPC result to match the expected format
		const listings = (listingsResult.data || []).map((item: any) => {
			const listingData = item.listing_data || {}
			return {
				...listingData,
				is_favorited: item.is_favorited || false,
				// Ensure backward compatibility
				location: listingData.location_city || listingData.location,
				favorite_count: listingData.like_count || 0
			}
		})

		const totalCount = Number(countResult.data) || 0
		const hasMore = offset + limit < totalCount

		return {
			listings,
			totalCount,
			hasMore,
			page,
			limit
		}
	} catch (err) {
		console.error('Browse listings error:', err)
		throw err
	}
}

// Helper function to get unique filter values
export async function getBrowseFilters(
	supabase: SupabaseClient<Database>,
	category?: string
): Promise<{
	brands: string[]
	sizes: string[]
	conditions: string[]
	priceRange: { min: number; max: number } | null
}> {
	let query = supabase
		.from('listings')
		.select('brand, size, condition, price')
		.eq('status', 'active')

	if (category) {
		if (category.includes('-')) {
			// Category slug
			const { data: categoryData } = await supabase
				.from('categories')
				.select('id')
				.eq('slug', category)
				.single()
			
			if (categoryData) {
				query = query.eq('category_id', categoryData.id)
			}
		} else {
			// Category name
			const { data: categoryData } = await supabase
				.from('categories')
				.select('id')
				.eq('name', category)
				.single()
			
			if (categoryData) {
				query = query.eq('category_id', categoryData.id)
			}
		}
	}

	const { data } = await query

	if (!data) {
		return {
			brands: [],
			sizes: [],
			conditions: [],
			priceRange: null
		}
	}

	// Extract unique values
	const brands = [...new Set(data.map(item => item.brand).filter(Boolean) as string[])].sort()
	const sizes = [...new Set(data.map(item => item.size).filter(Boolean) as string[])].sort()
	const conditions = [...new Set(data.map(item => item.condition).filter(Boolean) as string[])].sort()
	
	const prices = data.map(item => item.price).filter(Boolean)
	const priceRange = prices.length > 0 ? {
		min: Math.min(...prices),
		max: Math.max(...prices)
	} : null

	return {
		brands,
		sizes,
		conditions,
		priceRange
	}
}