import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, user } = locals;
	
	if (!user) {
		throw redirect(302, '/login');
	}
	
	// Check if user is admin
	const { data: adminData } = await supabase
		.from('admin_users')
		.select('*')
		.eq('user_id', user.id)
		.single();
	
	if (!adminData || !adminData.can_verify_emails) {
		throw error(403, 'Unauthorized');
	}
	
	// Get all unverified users using RPC
	const { data: unverifiedUsers, error: usersError } = await supabase
		.rpc('get_unverified_users_for_admin');
	
	if (usersError) {
		console.error('Error fetching unverified users:', usersError);
		return {
			unverifiedUsers: []
		};
	}
	
	return {
		unverifiedUsers: unverifiedUsers || []
	};
};

export const actions = {
	verifyEmail: async ({ request, locals }) => {
		const { supabase, user } = locals;
		
		if (!user) {
			throw error(401, 'Unauthorized');
		}
		
		const formData = await request.formData();
		const targetUserId = formData.get('userId') as string;
		
		if (!targetUserId) {
			throw error(400, 'User ID required');
		}
		
		try {
			// Call the admin function to verify email
			const { data, error: verifyError } = await supabase
				.rpc('admin_verify_user_email', {
					target_user_id: targetUserId
				});
			
			if (verifyError) {
				throw error(500, verifyError.message);
			}
			
			return { success: true };
		} catch (err) {
			console.error('Error verifying email:', err);
			throw error(500, 'Failed to verify email');
		}
	}
} satisfies Actions;