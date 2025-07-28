import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { supabase } = await parent();
	
	return {
		streamed: {
			brands: supabase
				.rpc('get_top_brands', { limit_count: 50 })
				.then(({ data, error }) => {
					if (error) {
						console.error('Error loading brands:', error);
						return [];
					}
					return data || [];
				})
		}
	};
};