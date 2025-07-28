import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { RequestEvent } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals: { supabase, safeGetSession }, getClientAddress }: RequestEvent) => {
	const { session } = await safeGetSession();
	
	try {
		const body = await request.json();
		const { listing_id, session_id } = body;
		
		if (!listing_id) {
			return json({ error: 'Listing ID is required' }, { status: 400 });
		}
		
		// Get client IP address for anonymous tracking
		const ip_address = getClientAddress();
		
		// Call the stored procedure to track the view
		const { error } = await supabase.rpc('track_listing_view', {
			p_listing_id: listing_id,
			p_viewer_id: session?.user?.id || null,
			p_ip_address: session?.user ? null : ip_address,
			p_session_id: session?.user ? null : session_id
		});
		
		if (error) {
			console.error('Error tracking view:', error);
			return json({ error: 'Failed to track view' }, { status: 500 });
		}
		
		return json({ success: true });
	} catch (error) {
		console.error('Error in view tracking:', error);
		return json({ error: 'Invalid request' }, { status: 400 });
	}
};