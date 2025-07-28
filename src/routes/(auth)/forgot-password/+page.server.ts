import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
	const { session } = await safeGetSession();

	// Redirect to home if already logged in
	if (session) {
		throw redirect(303, '/');
	}

	return {};
};