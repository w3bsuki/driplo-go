import type { PageServerLoad } from './$types';

export const load = (async () => {
	// TODO: Implement actual seller fetching from database
	// For now, return mock data
	
	return {
		sellers: [],
		stats: {
			totalSellers: 1234,
			activeToday: 342,
			newThisMonth: 87,
			avgRating: 4.7
		}
	};
}) satisfies PageServerLoad;