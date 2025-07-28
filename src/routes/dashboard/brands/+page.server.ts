import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { isAdmin } = await parent();
	
	if (!isAdmin) {
		error(403, 'Unauthorized');
	}
	
	// Get all brand verification requests with user info
	const { data: requests, error: requestsError } = await locals.supabase
		.from('brand_verification_requests' as any)
		.select(`
			*,
			profiles!inner(username, full_name, avatar_url)
		`)
		.order('submitted_at', { ascending: false });
	
	if (requestsError) {
		console.error('Error loading brand requests:', requestsError);
		error(500, 'Failed to load brand requests');
	}
	
	// Get statistics
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
	
	const [
		{ count: pending },
		{ count: approved }
	] = await Promise.all([
		locals.supabase
			.from('brand_verification_requests' as any)
			.select('*', { count: 'exact', head: true })
			.eq('verification_status', 'pending'),
		
		locals.supabase
			.from('brand_verification_requests' as any)
			.select('*', { count: 'exact', head: true })
			.eq('verification_status', 'approved')
			.gte('reviewed_at', thirtyDaysAgo.toISOString())
	]);
	
	// Format requests with username
	const formattedRequests = requests?.map(request => ({
		...request,
		username: request.profiles?.username || 'unknown'
	})) || [];
	
	return {
		requests: formattedRequests,
		stats: {
			pending: pending || 0,
			approved: approved || 0
		}
	};
};