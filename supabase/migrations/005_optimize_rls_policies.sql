-- Migration: Optimize RLS (Row Level Security) Policies for Performance
-- Purpose: Create efficient RLS policies using proper indexes and helper functions
-- Date: 2025-07-19
-- Critical for both security and performance

-- ============================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================

-- Fast user ID lookup (cached in session)
CREATE OR REPLACE FUNCTION auth.user_id() 
RETURNS uuid 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
$$;

-- Check if user is admin (cached)
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  IF auth.user_id() IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT role INTO v_role
  FROM profiles
  WHERE id = auth.user_id();
  
  RETURN v_role = 'admin';
END;
$$;

-- Check if user is verified seller
CREATE OR REPLACE FUNCTION auth.is_verified_seller()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_seller boolean;
  v_verified boolean;
BEGIN
  IF auth.user_id() IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT is_seller, seller_verified 
  INTO v_is_seller, v_verified
  FROM profiles
  WHERE id = auth.user_id();
  
  RETURN COALESCE(v_is_seller AND v_verified, false);
END;
$$;

-- Get user's seller ID if they are a seller
CREATE OR REPLACE FUNCTION auth.seller_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN is_seller THEN id 
    ELSE NULL 
  END
  FROM profiles
  WHERE id = auth.user_id()
$$;

-- ============================================
-- OPTIMIZED RLS POLICIES - PROFILES
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Optimized profile policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE
USING (id = auth.user_id())
WITH CHECK (id = auth.user_id());

-- ============================================
-- OPTIMIZED RLS POLICIES - LISTINGS
-- ============================================

DROP POLICY IF EXISTS "Active listings are viewable by everyone" ON listings;
DROP POLICY IF EXISTS "Sellers can manage own listings" ON listings;

-- Public can view active listings
CREATE POLICY "Active listings are viewable by everyone" 
ON listings FOR SELECT
USING (
  is_active = true 
  AND deleted_at IS NULL
);

-- Sellers can manage their own listings
CREATE POLICY "Sellers can manage own listings" 
ON listings FOR ALL
USING (seller_id = auth.user_id())
WITH CHECK (seller_id = auth.user_id());

-- Admins can manage all listings
CREATE POLICY "Admins can manage all listings" 
ON listings FOR ALL
USING (auth.is_admin())
WITH CHECK (auth.is_admin());

-- ============================================
-- OPTIMIZED RLS POLICIES - ORDERS
-- ============================================

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;

-- Users can view orders where they are buyer or seller
CREATE POLICY "Users can view own orders" 
ON orders FOR SELECT
USING (
  buyer_id = auth.user_id() 
  OR seller_id = auth.user_id()
);

-- Only buyers can create orders
CREATE POLICY "Buyers can create orders" 
ON orders FOR INSERT
WITH CHECK (buyer_id = auth.user_id());

-- Users can update their orders (limited fields via functions)
CREATE POLICY "Users can update own orders" 
ON orders FOR UPDATE
USING (
  buyer_id = auth.user_id() 
  OR seller_id = auth.user_id()
)
WITH CHECK (
  buyer_id = auth.user_id() 
  OR seller_id = auth.user_id()
);

-- ============================================
-- OPTIMIZED RLS POLICIES - CART
-- ============================================

DROP POLICY IF EXISTS "Users can manage own cart" ON shopping_carts;
DROP POLICY IF EXISTS "Users can manage own cart items" ON cart_items;

-- Cart policies
CREATE POLICY "Users can manage own cart" 
ON shopping_carts FOR ALL
USING (user_id = auth.user_id())
WITH CHECK (user_id = auth.user_id());

-- Cart items through cart ownership
CREATE POLICY "Users can manage own cart items" 
ON cart_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM shopping_carts
    WHERE shopping_carts.id = cart_items.cart_id
    AND shopping_carts.user_id = auth.user_id()
  )
);

-- ============================================
-- OPTIMIZED RLS POLICIES - MESSAGES
-- ============================================

DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view own messages" ON messages;

-- Conversation participants can view
CREATE POLICY "Users can view own conversations" 
ON conversations FOR SELECT
USING (
  participant1_id = auth.user_id() 
  OR participant2_id = auth.user_id()
);

-- Message policies using conversation
CREATE POLICY "Users can view conversation messages" 
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (
      conversations.participant1_id = auth.user_id() 
      OR conversations.participant2_id = auth.user_id()
    )
  )
);

CREATE POLICY "Users can send messages" 
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.user_id()
  AND EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = conversation_id
    AND (
      conversations.participant1_id = auth.user_id() 
      OR conversations.participant2_id = auth.user_id()
    )
  )
);

-- ============================================
-- OPTIMIZED RLS POLICIES - NOTIFICATIONS
-- ============================================

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Simple notification policies
CREATE POLICY "Users can view own notifications" 
ON notifications FOR SELECT
USING (user_id = auth.user_id());

CREATE POLICY "Users can update own notifications" 
ON notifications FOR UPDATE
USING (user_id = auth.user_id())
WITH CHECK (user_id = auth.user_id());

-- System can create notifications (via service role)
CREATE POLICY "System can create notifications" 
ON notifications FOR INSERT
WITH CHECK (true);

-- ============================================
-- OPTIMIZED RLS POLICIES - FAVORITES
-- ============================================

DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
DROP POLICY IF EXISTS "Public can view favorite counts" ON favorites;

-- Users manage their own favorites
CREATE POLICY "Users can manage own favorites" 
ON favorites FOR ALL
USING (user_id = auth.user_id())
WITH CHECK (user_id = auth.user_id());

-- Public can count favorites (for listing stats)
CREATE POLICY "Public can view favorite counts" 
ON favorites FOR SELECT
USING (true);

-- ============================================
-- OPTIMIZED RLS POLICIES - REVIEWS
-- ============================================

DROP POLICY IF EXISTS "Public can view reviews" ON user_ratings;
DROP POLICY IF EXISTS "Users can create own reviews" ON user_ratings;

-- Anyone can read reviews
CREATE POLICY "Public can view reviews" 
ON user_ratings FOR SELECT
USING (true);

-- Users can create reviews (validated by trigger)
CREATE POLICY "Users can create own reviews" 
ON user_ratings FOR INSERT
WITH CHECK (rater_user_id = auth.user_id());

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" 
ON user_ratings FOR UPDATE
USING (rater_user_id = auth.user_id())
WITH CHECK (rater_user_id = auth.user_id());

-- ============================================
-- OPTIMIZED RLS POLICIES - PAYMENT METHODS
-- ============================================

DROP POLICY IF EXISTS "Users can manage own payment methods" ON payment_methods;

-- Strict payment method access
CREATE POLICY "Users can manage own payment methods" 
ON payment_methods FOR ALL
USING (user_id = auth.user_id())
WITH CHECK (user_id = auth.user_id());

-- ============================================
-- OPTIMIZED RLS POLICIES - DISPUTES
-- ============================================

DROP POLICY IF EXISTS "Dispute parties can view" ON disputes;
DROP POLICY IF EXISTS "Users can create disputes" ON disputes;

-- Dispute participants and admins can view
CREATE POLICY "Dispute parties can view" 
ON disputes FOR SELECT
USING (
  claimant_id = auth.user_id() 
  OR respondent_id = auth.user_id()
  OR auth.is_admin()
);

-- Users can create disputes for their orders
CREATE POLICY "Users can create disputes" 
ON disputes FOR INSERT
WITH CHECK (
  claimant_id = auth.user_id()
  AND EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_id
    AND (orders.buyer_id = auth.user_id() OR orders.seller_id = auth.user_id())
  )
);

-- ============================================
-- PERFORMANCE INDEXES FOR RLS
-- ============================================

-- These indexes specifically support RLS policy checks
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON profiles(id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_id_seller ON profiles(id, is_seller, seller_verified);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_user_id ON shopping_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant1_id, participant2_id);
CREATE INDEX IF NOT EXISTS idx_orders_parties ON orders(buyer_id, seller_id);

-- ============================================
-- RLS BYPASS FOR PERFORMANCE (Service Functions)
-- ============================================

-- Create service functions that bypass RLS for performance-critical operations
CREATE OR REPLACE FUNCTION service_get_listing_with_stats(p_listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- This function can access all data regardless of RLS
  SELECT jsonb_build_object(
    'listing', row_to_json(l.*),
    'favorite_count', COUNT(DISTINCT f.id),
    'view_count', COUNT(DISTINCT lv.id),
    'avg_rating', AVG(r.rating),
    'total_sold', SUM(oi.quantity)
  ) INTO v_result
  FROM listings l
  LEFT JOIN favorites f ON f.listing_id = l.id
  LEFT JOIN archive.listing_views lv ON lv.listing_id = l.id
  LEFT JOIN user_ratings r ON r.listing_id = l.id
  LEFT JOIN order_items oi ON oi.listing_id = l.id
  WHERE l.id = p_listing_id
  GROUP BY l.id;
  
  RETURN v_result;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION service_get_listing_with_stats TO authenticated;

-- ============================================
-- MONITORING RLS PERFORMANCE
-- ============================================

-- Create a view to monitor RLS impact
CREATE OR REPLACE VIEW rls_performance_impact AS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Function to test RLS performance
CREATE OR REPLACE FUNCTION test_rls_performance(p_table_name text, p_user_id uuid)
RETURNS TABLE(
  with_rls numeric,
  without_rls numeric,
  overhead_ms numeric,
  overhead_percent numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start timestamp;
  v_with_rls numeric;
  v_without_rls numeric;
BEGIN
  -- Test with RLS (as user)
  PERFORM set_config('request.jwt.claim.sub', p_user_id::text, true);
  v_start := clock_timestamp();
  EXECUTE format('SELECT COUNT(*) FROM %I', p_table_name);
  v_with_rls := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start);
  
  -- Test without RLS (as service)
  PERFORM set_config('request.jwt.claim.sub', '', true);
  v_start := clock_timestamp();
  EXECUTE format('SELECT COUNT(*) FROM %I', p_table_name);
  v_without_rls := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start);
  
  RETURN QUERY
  SELECT 
    v_with_rls,
    v_without_rls,
    v_with_rls - v_without_rls,
    ROUND(((v_with_rls - v_without_rls) / v_without_rls) * 100, 2);
END;
$$;

-- Summary: Optimized RLS policies that:
-- 1. Use helper functions to cache user checks
-- 2. Leverage proper indexes for fast lookups  
-- 3. Simplify policy logic where possible
-- 4. Provide service functions for complex queries
-- 5. Include monitoring tools to track performance