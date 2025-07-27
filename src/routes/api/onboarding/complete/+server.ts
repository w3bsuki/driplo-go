import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals: { supabase, safeGetSession } }) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Update profile to mark onboarding as complete
		const { error: updateError } = await supabase
			.from('profiles')
			.update({
				onboarding_completed: true,
				setup_completed: true,
				onboarding_step: 5, // Final step
				setup_completed_at: new Date().toISOString()
			})
			.eq('id', user.id);

		if (updateError) {
			console.error('Error updating profile:', updateError);
			throw error(500, 'Failed to complete onboarding');
		}

		// Log successful onboarding completion
		await supabase.rpc('log_auth_event', {
			p_user_id: user.id,
			p_action: 'onboarding_completed',
			p_success: true,
			p_metadata: {
				completed_at: new Date().toISOString()
			}
		});

		return json({ success: true });
	} catch (err) {
		console.error('Onboarding completion error:', err);
		
		// Log failed attempt
		await supabase.rpc('log_auth_event', {
			p_user_id: user.id,
			p_action: 'onboarding_completed',
			p_success: false,
			p_error_message: err instanceof Error ? err.message : 'Unknown error'
		});

		throw error(500, 'Failed to complete onboarding');
	}
};