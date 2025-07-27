import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, safeGetSession } = locals;
	const { session } = await safeGetSession();
	
	if (!session) {
		throw redirect(303, '/login?redirectTo=/brands/onboarding');
	}

	// Get user profile
	const { data: profile } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', session.user.id)
		.single();

	if (!profile) {
		throw error(404, 'Profile not found');
	}

	// Check if already a brand
	if (profile?.account_type === 'brand') {
		// Check if brand profile exists
		const { data: brandProfile } = await supabase
			.from('brand_profiles')
			.select('brand_slug')
			.eq('user_id', session.user.id)
			.single();

		if (brandProfile?.brand_slug) {
			throw redirect(303, `/brands/${brandProfile.brand_slug}`);
		}
	}

	// Get existing brand profile if any (for editing)
	const { data: existingBrandProfile } = await supabase
		.from('brand_profiles')
		.select('*')
		.eq('user_id', session.user.id)
		.single();

	return {
		profile,
		existingBrandProfile
	};
};