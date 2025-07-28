import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const { user } = await locals.safeGetSession();
	
	// Require authentication
	if (!user) {
		redirect(302, `/login?redirectTo=${url.pathname}`);
	}
	
	// Check if user is admin
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.single();
	
	const isAdmin = profile?.role === 'admin';
	
	// Get pending brand approvals count
	let pendingBrands = 0;
	if (isAdmin) {
		const { count } = await locals.supabase
			.from('brand_verification_requests' as any)
			.select('*', { count: 'exact', head: true })
			.eq('verification_status', 'pending');
		
		pendingBrands = count || 0;
	}
	
	// Get admin statistics
	let stats = null;
	if (isAdmin) {
		// Total users
		const { count: totalUsers } = await locals.supabase
			.from('profiles')
			.select('*', { count: 'exact', head: true });
		
		// Active listings
		const { count: activeListings } = await locals.supabase
			.from('listings')
			.select('*', { count: 'exact', head: true })
			.eq('status', 'active');
		
		// Today's sales (placeholder - would need orders table)
		const todaySales = 0;
		
		stats = {
			totalUsers: totalUsers || 0,
			activeListings: activeListings || 0,
			todaySales
		};
	}
	
	return {
		user,
		profile,
		isAdmin,
		pendingBrands,
		stats
	};
};