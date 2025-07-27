import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = locals.supabase
	
	// Get statistics
	const [
		{ count: totalUsers },
		{ count: totalListings },
		{ count: totalOrders },
		{ count: pendingVerifications }
	] = await Promise.all([
		supabase.from('profiles').select('*', { count: 'exact', head: true }),
		supabase.from('listings').select('*', { count: 'exact', head: true }),
		supabase.from('orders').select('*', { count: 'exact', head: true }),
		supabase.from('brand_verification_requests' as any)
			.select('*', { count: 'exact', head: true })
			.eq('status', 'pending')
	])
	
	// Get recent activity
	const { data: recentUsers } = await supabase
		.from('profiles')
		.select('id, email, username, created_at')
		.order('created_at', { ascending: false })
		.limit(5)
		
	const { data: recentOrders } = await supabase
		.from('orders')
		.select('id, total_amount, status, created_at')
		.order('created_at', { ascending: false })
		.limit(5)
	
	return {
		stats: {
			totalUsers: totalUsers || 0,
			totalListings: totalListings || 0,
			totalOrders: totalOrders || 0,
			pendingVerifications: pendingVerifications || 0
		},
		recentUsers: recentUsers || [],
		recentOrders: recentOrders || []
	}
}