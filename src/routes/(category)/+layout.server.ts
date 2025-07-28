import type { LayoutServerLoad } from './$types';
import { getCachedData, cacheKeys, cacheTTL } from '$lib/server/cache';

export const load: LayoutServerLoad = async ({ locals }) => {
  // Cache category navigation data for 1 hour
  const categories = await getCachedData(
    cacheKeys.categories,
    async () => {
      const { data } = await locals.supabase
        .from('categories')
        .select('*')
        .is('parent_id', null)
        .eq('is_active', true)
        .order('sort_order')
        .order('name');

      return data || [];
    },
    cacheTTL.categories
  );

  return {
    categories
  };
};