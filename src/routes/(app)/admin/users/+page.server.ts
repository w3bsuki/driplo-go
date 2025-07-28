import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const { data: users } = await locals.supabase
		.from('profiles')
		.select('*')
		.order('created_at', { ascending: false })
		.limit(100)
	
	return {
		users: users || []
	}
}