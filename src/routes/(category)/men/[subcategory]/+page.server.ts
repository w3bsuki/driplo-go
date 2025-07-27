import type { PageServerLoad } from './$types';
import { loadSubcategoryPage } from '$lib/server/category';

export const load: PageServerLoad = async ({ params, url, locals }) => {
  return await loadSubcategoryPage('men', params.subcategory, url, locals.supabase);
};