import type { PageServerLoad } from './$types';
import { getCachedData, cacheKeys, cacheTTL } from '$lib/server/cache';

export const load: PageServerLoad = async ({ locals }) => {
  // Load critical data first, stream the rest
  const criticalData = await getCachedData(
    cacheKeys.homepage_critical,
    async () => {
      // Use optimized RPC functions to reduce queries
      const [categoriesResult, featuredResult] = await Promise.all([
        // Get main categories with product counts in single query
        locals.supabase.rpc('get_categories_with_counts'),

        // Get featured listings with all related data
        locals.supabase.rpc('get_homepage_listings', {
          p_type: 'featured',
          p_limit: 8
        })
      ]);

      if (categoriesResult.error) {
        console.error('Error loading categories:', categoriesResult.error);
      }
      if (featuredResult.error) {
        console.error('Error loading featured listings:', featuredResult.error);
      }

      // Transform RPC results to match expected format
      const categories = (categoriesResult.data || []).map((item: any) => ({
        ...item.category_data,
        product_count: [{ count: item.product_count }]
      }));

      const featuredListings = (featuredResult.data || []).map((item: any) => item.listing_data);

      return {
        categories,
        featuredListings
      };
    },
    cacheTTL.homepage
  );

  // Load non-critical data asynchronously
  const nonCriticalData = getCachedData(
    cacheKeys.homepage_secondary,
    async () => {
      const [popularResult, topSellersResult] = await Promise.all([
        // Get popular listings with optimized query
        locals.supabase.rpc('get_homepage_listings', {
          p_type: 'popular',
          p_limit: 16
        }),

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

      if (popularResult.error) {
        console.error('Error loading popular listings:', popularResult.error);
      }

      const popularListings = (popularResult.data || []).map((item: any) => item.listing_data);

      return {
        popularListings,
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