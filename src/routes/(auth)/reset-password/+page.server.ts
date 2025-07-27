import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	// The reset password page needs to handle tokens from the URL
	// These are typically passed as hash fragments or query parameters
	return {
		code: url.searchParams.get('code'),
		error: url.searchParams.get('error'),
		error_description: url.searchParams.get('error_description')
	};
};