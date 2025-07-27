import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '$lib/types/database.types'

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
	filters: BrowseFilters
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
		// Build the base query with proper joins
		let query = supabase
			.from('listings')
			.select(`
				id,
				title,
				description,
				price,
				currency,
				brand,
				size,
				condition,
				images,
				location,
				view_count,
				favorite_count,
				shipping_cost,
				created_at,
				seller:profiles!seller_id(
					id,
					username,
					full_name,
					avatar_url,
					account_type,
					is_verified
				),
				category:categories!category_id(
					id,
					name,
					slug,
					icon_url
				)
			`)
			.eq('status', 'active')

		// Apply filters
		if (category) {
			// First, get the category ID from slug or name
			const categoryQuery = category.includes('-')
				? supabase.from('categories').select('id').eq('slug', category).single()
				: supabase.from('categories').select('id').eq('name', category).single()
			
			const { data: categoryData } = await categoryQuery
			
			if (categoryData) {
				query = query.eq('category_id', categoryData.id)
			}
		}

		if (subcategory) {
			// For subcategory, we need to join with the subcategory table
			query = query.eq('subcategory_id', subcategory)
		}

		if (search) {
			// Use full-text search if available, otherwise fallback to ILIKE
			const searchTerms = search.split(' ').map(term => `'${term.replace(/'/g, "''")}'`).join(' | ')
			query = query.or(`title.fts.${searchTerms},description.fts.${searchTerms},brand.ilike.%${search}%,title.ilike.%${search}%,description.ilike.%${search}%`)
		}

		if (minPrice !== null && minPrice !== undefined) {
			query = query.gte('price', minPrice)
		}

		if (maxPrice !== null && maxPrice !== undefined) {
			query = query.lte('price', maxPrice)
		}

		if (sizes.length > 0) {
			query = query.in('size', sizes)
		}

		if (brands.length > 0) {
			query = query.in('brand', brands)
		}

		if (conditions.length > 0) {
			query = query.in('condition', conditions)
		}

		// Apply sorting
		switch (sortBy) {
			case 'price-low':
				query = query.order('price', { ascending: true })
				break
			case 'price-high':
				query = query.order('price', { ascending: false })
				break
			case 'popular':
				query = query.order('view_count', { ascending: false })
				break
			case 'favorites':
				query = query.order('favorite_count', { ascending: false })
				break
			case 'ending':
				// For ending soon, we'd need an end_date field
				// For now, sort by created_at ascending (oldest first)
				query = query.order('created_at', { ascending: true })
				break
			case 'recent':
			default:
				query = query.order('created_at', { ascending: false })
				break
		}

		// Get total count for pagination
		const countQuery = supabase
			.from('listings')
			.select('*', { count: 'exact', head: true })
			.eq('status', 'active')

		// Apply same filters to count query
		if (category) {
			// Use the same category ID we already fetched
			const categoryQuery = category.includes('-')
				? supabase.from('categories').select('id').eq('slug', category).single()
				: supabase.from('categories').select('id').eq('name', category).single()
			
			const { data: categoryData } = await categoryQuery
			
			if (categoryData) {
				countQuery.eq('category_id', categoryData.id)
			}
		}

		if (subcategory) {
			countQuery.eq('subcategory_id', subcategory)
		}

		if (search) {
			const searchTerms = search.split(' ').map(term => `'${term.replace(/'/g, "''")}'`).join(' | ')
			countQuery.or(`title.fts.${searchTerms},description.fts.${searchTerms},brand.ilike.%${search}%,title.ilike.%${search}%,description.ilike.%${search}%`)
		}

		if (minPrice !== null && minPrice !== undefined) {
			countQuery.gte('price', minPrice)
		}

		if (maxPrice !== null && maxPrice !== undefined) {
			countQuery.lte('price', maxPrice)
		}

		if (sizes.length > 0) {
			countQuery.in('size', sizes)
		}

		if (brands.length > 0) {
			countQuery.in('brand', brands)
		}

		if (conditions.length > 0) {
			countQuery.in('condition', conditions)
		}

		// Execute queries in parallel
		const offset = (page - 1) * limit
		const [listingsResult, countResult] = await Promise.all([
			query.range(offset, offset + limit - 1),
			countQuery
		])

		if (listingsResult.error) {
			console.error('Browse listings error:', listingsResult.error)
			throw listingsResult.error
		}

		if (countResult.error) {
			console.error('Browse count error:', countResult.error)
		}

		const totalCount = countResult.count || 0
		const hasMore = offset + limit < totalCount

		return {
			listings: listingsResult.data || [],
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