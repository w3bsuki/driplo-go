
export type PageData = {
	listing: {
		id: string
		seller_id: string
		title: string
		description: string
		price: number
		condition: string
		size: string | null
		brand: string | null
		color: string | null
		images: string[]
		location: string
		shipping_type: string
		shipping_cost: number
		status: string
		view_count: number
		favorite_count: number
		tags: string[]
		created_at: string
		updated_at: string
		category_id: string | null
		seller: {
			id: string
			username: string
			full_name: string | null
			avatar_url: string | null
			bio: string | null
			location: string | null
			followers_count: number
			listings_count: number
			created_at: string
		}
		category: {
			id: string
			name: string
			slug: string
			icon: string
		} | null
	}
	sellerListings: Array<{
		id: string
		title: string
		price: number
		images: string[]
		created_at: string
	}>
	relatedListings: Array<{
		id: string
		title: string
		price: number
		images: string[]
		size: string | null
		brand: string | null
		condition: string
		seller: {
			username: string
			avatar_url: string | null
		}
	}>
}