-- Test script for N+1 query optimization functions
-- Run this after applying the migration to verify functions work correctly

-- Test 1: get_listings_with_favorites
SELECT * FROM get_listings_with_favorites(
  p_user_id := NULL,
  p_limit := 5
);

-- Test 2: get_listings_count
SELECT get_listings_count();

-- Test 3: get_profile_listings_with_stats
-- Replace with an actual seller_id from your database
-- SELECT * FROM get_profile_listings_with_stats(
--   p_seller_id := 'YOUR_SELLER_ID_HERE',
--   p_limit := 5
-- );

-- Test 4: get_user_total_likes
-- Replace with an actual user_id from your database
-- SELECT get_user_total_likes('YOUR_USER_ID_HERE');

-- Test 5: get_user_favorites_with_listings
-- Replace with an actual user_id from your database
-- SELECT * FROM get_user_favorites_with_listings(
--   p_user_id := 'YOUR_USER_ID_HERE',
--   p_limit := 5
-- );

-- Test 6: get_categories_with_counts
SELECT * FROM get_categories_with_counts();

-- Test 7: get_homepage_listings (featured)
SELECT * FROM get_homepage_listings('featured', 5);

-- Test 8: get_homepage_listings (popular)
SELECT * FROM get_homepage_listings('popular', 5);

-- Test 9: get_category_listings
-- Replace with an actual category_id from your database
-- SELECT * FROM get_category_listings(
--   p_category_id := 1,
--   p_limit := 5
-- );

-- Verify indexes exist
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('listings', 'favorites', 'categories', 'profiles')
ORDER BY tablename, indexname;

-- Check query performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM get_listings_with_favorites(
  p_user_id := NULL,
  p_limit := 20
);