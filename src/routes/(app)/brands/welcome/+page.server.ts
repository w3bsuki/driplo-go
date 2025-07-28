import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { supabase, safeGetSession } = locals;
	const { session } = await safeGetSession();
	
	if (!session) {
		throw redirect(303, '/login');
	}

	const brandSlug = url.searchParams.get('slug');
	if (!brandSlug) {
		throw error(400, 'Brand slug is required');
	}

	// Get brand profile
	const { data: brandProfile, error: brandError } = await supabase
		.from('brand_profiles')
		.select('*')
		.eq('brand_slug', brandSlug)
		.eq('user_id', session.user.id)
		.single();

	if (brandError || !brandProfile) {
		throw error(404, 'Brand profile not found');
	}

	// Get user profile
	const { data: profile } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', session.user.id)
		.single();

	return {
		brandProfile,
		profile
	};
};