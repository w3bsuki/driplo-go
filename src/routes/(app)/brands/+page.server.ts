import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Fetch top brands
	const { data: topBrands, error } = await locals.supabase
		.rpc('get_top_brands', { limit_count: 12 });
	
	if (error) {
		console.error('Error fetching top brands:', error);
	}
	
	return {
		topBrands: topBrands || []
	};
};