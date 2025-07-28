import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { isAdmin } = await parent();
	
	if (!isAdmin) {
		error(403, 'Unauthorized');
	}
	
	// Get comprehensive stats
	const [
		{ count: totalUsers },
		{ count: activeListings },
		{ count: verifiedBrands },
		{ data: pendingBrands },
		{ data: recentReports }
	] = await Promise.all([
		// Total users
		locals.supabase
			.from('profiles')
			.select('*', { count: 'exact', head: true }),
		
		// Active listings
		locals.supabase
			.from('listings')
			.select('*', { count: 'exact', head: true })
			.eq('status', 'active'),
		
		// Verified brands
		locals.supabase
			.from('profiles')
			.select('*', { count: 'exact', head: true })
			.eq('account_type', 'brand')
			.eq('is_verified', true),
		
		// Pending brand verification requests
		locals.supabase
			.from('brand_verification_requests' as any)
			.select('*')
			.eq('verification_status', 'pending')
			.order('submitted_at', { ascending: false })
			.limit(10),
		
		// Recent reports (placeholder - would need reports table)
		Promise.resolve({ data: [] })
	]);
	
	// Calculate monthly revenue (placeholder)
	const monthlyRevenue = 0;
	
	return {
		stats: {
			totalUsers: totalUsers || 0,
			activeListings: activeListings || 0,
			verifiedBrands: verifiedBrands || 0,
			monthlyRevenue
		},
		pendingBrands: pendingBrands || [],
		recentReports: recentReports || []
	};
};