import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logger } from '$lib/services/logger';

export const GET: RequestHandler = async ({ locals }) => {
	const { supabase } = locals;

	try {
		// Fetch categories
		const { data: categories, error: catError } = await supabase
			.from('categories')
			.select('id, name, slug, icon')
			.eq('is_active', true)
			.is('parent_id', null) // Get only parent categories
			.order('display_order');

		if (catError) throw catError;

		// Fetch subcategories
		const { data: subcategories, error: subError } = await supabase
			.from('categories')
			.select('id, name, slug, icon, parent_id')
			.eq('is_active', true)
			.not('parent_id', 'is', null)
			.order('display_order');

		if (subError) throw subError;

		// Fetch popular brands - use fallback directly since RPC might not exist
		const { data: listings } = await supabase
			.from('listings')
			.select('brand')
			.eq('status', 'active')
			.not('brand', 'is', null);

		const brandCounts = new Map<string, number>();
		listings?.forEach(l => {
			if (l.brand) {
				brandCounts.set(l.brand, (brandCounts.get(l.brand) || 0) + 1);
			}
		});

		// Sort by count and take top 20
		const brands = Array.from(brandCounts.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 20)
			.map(([brand, count]) => ({ brand, count }));

		return json({
			categories: categories || [],
			subcategories: subcategories || [],
			brands: brands || []
		});
	} catch (error) {
		logger.error('Error fetching filter data:', error);
		return json({
			categories: [],
			subcategories: [],
			brands: []
		}, { status: 500 });
	}
};