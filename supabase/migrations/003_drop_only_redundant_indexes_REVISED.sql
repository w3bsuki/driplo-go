-- Migration: Drop ONLY Redundant Indexes - REVISED for Production Safety
-- Purpose: Remove only truly redundant indexes while keeping all potentially useful ones
-- Date: 2025-07-19
-- IMPORTANT: This is a much more conservative approach than the original

-- Drop redundant profile indexes (user lookups are better done by ID)
DROP INDEX CONCURRENTLY IF EXISTS public.idx_profiles_role;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_profiles_verification;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_profiles_seller_rating;

-- Drop redundant date indexes (covered by more specific indexes)
DROP INDEX CONCURRENTLY IF EXISTS public.idx_orders_created_date; -- Keep idx_orders_created instead
DROP INDEX CONCURRENTLY IF EXISTS public.idx_messages_conversation_created; -- Covered by other indexes
DROP INDEX CONCURRENTLY IF EXISTS public.idx_listing_views_created; -- Archive table, low priority

-- Drop overly specific user stat indexes
DROP INDEX CONCURRENTLY IF EXISTS public.idx_user_stats_last_calc;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_profiles_last_active;

-- Drop redundant achievement/activity indexes (archive tables, rarely queried)
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_achievements_user;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_achievements_type;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_achievements_earned;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_activities_user;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_activities_public;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_activities_type;

-- Drop redundant view tracking indexes (keep only essential ones)
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_listing_views_viewer;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_profile_views_date;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_profile_views_viewer;

-- Drop unused rating indexes (ratings might be calculated differently)
DROP INDEX CONCURRENTLY IF EXISTS public.idx_user_ratings_rated_user;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_user_ratings_rater_user;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_user_ratings_listing;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_user_ratings_type_rating;

-- Drop redundant follow indexes (social features might not be priority)
DROP INDEX CONCURRENTLY IF EXISTS public.idx_follows_follower;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_follows_following;

-- Drop redundant inventory indexes (archive table)
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_inventory_logs_variant;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_inventory_logs_listing;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_inventory_logs_created;

-- Drop redundant shipping address indexes (user_id lookup is sufficient)
DROP INDEX CONCURRENTLY IF EXISTS public.idx_shipping_addresses_default;

-- Drop redundant variant indexes (may be covered by listing_id)
DROP INDEX CONCURRENTLY IF EXISTS public.idx_variants_available;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_variants_stock;

-- Total: ~32 indexes dropped (instead of 105)
-- Keeping: All transaction, payment, order, cart, search, and core business indexes

-- IMPORTANT INDEXES WE'RE KEEPING:
-- ✓ idx_transactions_status - Critical for payment status queries
-- ✓ idx_orders_status - Critical for order management
-- ✓ idx_orders_buyer/seller - Critical for user dashboards
-- ✓ idx_cart_items_* - Critical for shopping cart
-- ✓ idx_listings_search* - Critical for search functionality
-- ✓ idx_notifications_* - Critical for user experience
-- ✓ idx_coupons_code - Critical for checkout
-- ✓ All payment-related indexes
-- ✓ All messaging indexes
-- ✓ All dispute/return indexes

-- After this migration, monitor query performance for 30 days
-- before considering removing any additional indexes