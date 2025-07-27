-- Migration: Recreate critical indexes for performance
-- Generated: 2025-07-24
-- Purpose: Recreate indexes that were dropped but are critical for query performance

-- ===== CRITICAL LISTING INDEXES =====
-- These are essential for browse page and search performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_seller_active 
  ON public.listings(seller_id) 
  WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_price 
  ON public.listings(price);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_category_status 
  ON public.listings(category_id, status, created_at DESC) 
  WHERE status = 'active';

-- Full text search index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_search 
  ON public.listings 
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(brand, '')));

-- ===== CRITICAL ORDER INDEXES =====
-- Essential for order management and user dashboards
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_buyer_status 
  ON public.orders(buyer_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_seller_status 
  ON public.orders(seller_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_date 
  ON public.orders(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status 
  ON public.orders(status) 
  WHERE status IN ('pending', 'processing', 'shipped');

-- ===== CRITICAL USER/PROFILE INDEXES =====
-- Essential for user lookups and authentication
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_username 
  ON public.profiles(username) 
  WHERE username IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email 
  ON public.profiles(email) 
  WHERE email IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role 
  ON public.profiles(role) 
  WHERE role IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_seller_rating 
  ON public.profiles(seller_rating DESC) 
  WHERE seller_rating IS NOT NULL;

-- ===== CRITICAL MESSAGING INDEXES =====
-- Essential for chat performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation 
  ON public.messages(conversation_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_participants 
  ON public.conversations(buyer_id, seller_id);

-- ===== CRITICAL NOTIFICATION INDEXES =====
-- Essential for notification queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread 
  ON public.notifications(user_id, created_at DESC) 
  WHERE is_read = false;

-- ===== CRITICAL WISHLIST/FAVORITES INDEXES =====
-- Essential for user favorites
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wishlists_user_listing 
  ON public.wishlists(user_id, listing_id);

-- ===== CRITICAL REVIEW INDEXES =====
-- Essential for product reviews
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_product 
  ON public.reviews(product_id, created_at DESC) 
  WHERE status = 'published';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_ratings_rated_user 
  ON public.user_ratings(rated_user_id, rating_type);

-- ===== NEW PERFORMANCE INDEXES =====
-- Additional indexes for common query patterns

-- For filtering listings by multiple criteria
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_browse_filters 
  ON public.listings(status, category_id, condition, price) 
  WHERE status = 'active';

-- For user activity tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_last_active 
  ON public.profiles(last_active DESC) 
  WHERE account_status = 'active';

-- For order tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_tracking 
  ON public.orders(tracking_number) 
  WHERE tracking_number IS NOT NULL;

-- For pagination with created_at
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_created_active 
  ON public.listings(created_at DESC) 
  WHERE status = 'active';

-- For brand searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_brand 
  ON public.listings(brand) 
  WHERE brand IS NOT NULL AND status = 'active';

-- For subcategory filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_subcategory_active 
  ON public.listings(subcategory_id) 
  WHERE subcategory_id IS NOT NULL AND status = 'active';

-- For size filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_size 
  ON public.listings((details->>'size')) 
  WHERE status = 'active';

-- For color filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_color 
  ON public.listings((details->>'color')) 
  WHERE status = 'active';

-- For cart performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_items_user 
  ON public.cart_items(user_id, created_at DESC);

-- For transaction lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_order 
  ON public.transactions(order_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_stripe 
  ON public.transactions(stripe_payment_intent_id) 
  WHERE stripe_payment_intent_id IS NOT NULL;

-- ===== MONITORING INDEX USAGE =====
-- Create a function to track index usage
CREATE OR REPLACE FUNCTION get_index_usage_stats() 
RETURNS TABLE (
  schemaname TEXT,
  tablename TEXT,
  indexname TEXT,
  idx_scan BIGINT,
  idx_tup_read BIGINT,
  idx_tup_fetch BIGINT,
  size TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.schemaname::TEXT,
    s.tablename::TEXT,
    s.indexname::TEXT,
    s.idx_scan,
    s.idx_tup_read,
    s.idx_tup_fetch,
    pg_size_pretty(pg_relation_size(s.indexrelid))::TEXT as size
  FROM pg_stat_user_indexes s
  WHERE s.schemaname = 'public'
  ORDER BY s.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Comment on the function
COMMENT ON FUNCTION get_index_usage_stats() IS 'Returns index usage statistics to identify unused indexes';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_index_usage_stats() TO authenticated;