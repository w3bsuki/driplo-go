import type { PageServerLoad } from './$types';
import { getCachedData, cacheKeys, cacheTTL } from '$lib/server/cache';

export const load: PageServerLoad = async ({ locals }) => {
  // Load critical data first, stream the rest
  const criticalData = await getCachedData(
    cacheKeys.homepage_critical,
    async () => {
      // Load only categories and featured listings first (critical for FCP)
      const [categoriesResult, featuredResult] = await Promise.all([
        // Get main categories with product counts
        locals.supabase
          .from('categories')
          .select(`
            *,
            product_count:listings(count)
          `)
          .is('parent_id', null)
          .eq('is_active', true)
          .order('sort_order')
          .order('name'),

        // Get featured listings
        locals.supabase
          .from('listings')
          .select(`
            *,
            seller:profiles!seller_id(username, avatar_url),
            condition
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(8) // Reduced for faster initial load
      ]);

      return {
        categories: categoriesResult.data || [],
        featuredListings: featuredResult.data || []
      };
    },
    cacheTTL.homepage
  );

  // Load non-critical data asynchronously
  const nonCriticalData = getCachedData(
    cacheKeys.homepage_secondary,
    async () => {
      const [popularResult, topSellersResult] = await Promise.all([
        // Get most viewed listings
        locals.supabase
          .from('listings')
          .select(`
            *,
            seller:profiles!seller_id(username, avatar_url),
            condition
          `)
          .eq('status', 'active')
          .order('view_count', { ascending: false })
          .limit(16),

        // Get top sellers based on sales count and rating
        locals.supabase
          .from('profiles')
          .select(`
            id,
            username,
            avatar_url,
            seller_rating,
            seller_rating_count,
            total_sales,
            bio,
            location,
            created_at
          `)
          .not('total_sales', 'is', null)
          .gte('total_sales', 1)
          .gte('seller_rating', 1.0)
          .order('total_sales', { ascending: false })
          .order('seller_rating', { ascending: false })
          .limit(5)
      ]);

      return {
        popularListings: popularResult.data || [],
        topSellers: topSellersResult.data || []
      };
    },
    cacheTTL.homepage
  );

  // Return critical data immediately, non-critical will stream
  return {
    ...criticalData,
    popularListings: (await nonCriticalData).popularListings,
    topSellers: (await nonCriticalData).topSellers
  };
};