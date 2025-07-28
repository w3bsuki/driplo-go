-- Migration: Add missing RPC functions
-- Generated: 2025-07-24
-- Purpose: Create all missing RPC functions identified in SUPABASE_ISSUES_REPORT.md

-- 1. Auth rate limiting function (already exists in auth_rate_limits table migration)
-- Redefining here for completeness
CREATE OR REPLACE FUNCTION public.check_auth_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN AS $$
DECLARE
  v_attempts INTEGER;
BEGIN
  -- Clean old attempts
  DELETE FROM public.auth_rate_limits 
  WHERE created_at < NOW() - INTERVAL '1 hour';
  
  -- Count recent attempts
  SELECT COUNT(*) INTO v_attempts
  FROM public.auth_rate_limits
  WHERE identifier = p_identifier
    AND action = p_action
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Check limit
  IF v_attempts >= p_max_attempts THEN
    RETURN FALSE;
  END IF;
  
  -- Log attempt
  INSERT INTO public.auth_rate_limits (identifier, action, created_at)
  VALUES (p_identifier, p_action, NOW());
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Auth event logging
CREATE OR REPLACE FUNCTION public.log_auth_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
  -- Insert into audit logs or create a dedicated auth_events table
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    ip_address,
    user_agent,
    new_data,
    created_at
  ) VALUES (
    p_user_id,
    p_event_type,
    'auth_events',
    p_ip_address,
    p_user_agent,
    p_metadata,
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Track listing view for analytics
CREATE OR REPLACE FUNCTION public.track_listing_view(
  p_listing_id UUID,
  p_viewer_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Increment view count
  UPDATE public.listings 
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_listing_id;
  
  -- Log view event if viewer is logged in
  IF p_viewer_id IS NOT NULL THEN
    INSERT INTO public.listing_views (
      listing_id,
      viewer_id,
      viewed_at
    ) VALUES (
      p_listing_id,
      p_viewer_id,
      NOW()
    ) ON CONFLICT (listing_id, viewer_id) DO UPDATE
    SET viewed_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create listing_views table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.listing_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, viewer_id)
);

-- 4. Get user statistics
CREATE OR REPLACE FUNCTION public.get_user_stats(
  p_user_id UUID
) RETURNS TABLE (
  total_listings INTEGER,
  active_listings INTEGER,
  total_sales INTEGER,
  total_purchases INTEGER,
  total_earned NUMERIC,
  total_spent NUMERIC,
  avg_rating NUMERIC,
  rating_count INTEGER,
  member_since TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.listings WHERE seller_id = p_user_id)::INTEGER AS total_listings,
    (SELECT COUNT(*) FROM public.listings WHERE seller_id = p_user_id AND status = 'active')::INTEGER AS active_listings,
    (SELECT COUNT(*) FROM public.orders WHERE seller_id = p_user_id AND status = 'delivered')::INTEGER AS total_sales,
    (SELECT COUNT(*) FROM public.orders WHERE buyer_id = p_user_id AND status = 'delivered')::INTEGER AS total_purchases,
    COALESCE((SELECT SUM(total_amount) FROM public.orders WHERE seller_id = p_user_id AND status = 'delivered'), 0) AS total_earned,
    COALESCE((SELECT SUM(total_amount) FROM public.orders WHERE buyer_id = p_user_id AND status = 'delivered'), 0) AS total_spent,
    (SELECT seller_rating FROM public.profiles WHERE id = p_user_id) AS avg_rating,
    (SELECT seller_rating_count FROM public.profiles WHERE id = p_user_id) AS rating_count,
    (SELECT created_at FROM public.profiles WHERE id = p_user_id) AS member_since;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Get unverified users for admin
CREATE OR REPLACE FUNCTION public.get_unverified_users_for_admin()
RETURNS TABLE (
  id UUID,
  email TEXT,
  username TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ,
  account_type TEXT,
  documents_count INTEGER
) AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.username,
    p.full_name,
    p.created_at,
    p.account_type,
    (SELECT COUNT(*) FROM public.documents WHERE user_id = p.id)::INTEGER AS documents_count
  FROM public.profiles p
  WHERE p.is_verified = false
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Admin verify user email
CREATE OR REPLACE FUNCTION public.admin_verify_user_email(
  p_user_id UUID,
  p_verification_type TEXT DEFAULT 'manual'
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Update user verification status
  UPDATE public.profiles
  SET 
    is_verified = true,
    verification_badges = verification_badges || jsonb_build_object(
      'email_verified', true,
      'verified_at', NOW(),
      'verified_by', auth.uid(),
      'verification_type', p_verification_type
    )
  WHERE id = p_user_id;
  
  -- Log the action
  PERFORM log_auth_event(
    p_user_id,
    'email_verified_by_admin',
    NULL,
    NULL,
    jsonb_build_object('admin_id', auth.uid(), 'type', p_verification_type)
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create order with payment
CREATE OR REPLACE FUNCTION public.create_order_with_payment(
  p_listing_id UUID,
  p_buyer_id UUID,
  p_payment_method_id TEXT,
  p_shipping_address JSONB,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_listing RECORD;
  v_seller_id UUID;
  v_amount NUMERIC;
BEGIN
  -- Get listing details
  SELECT * INTO v_listing 
  FROM public.listings 
  WHERE id = p_listing_id 
    AND status = 'active'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found or not available';
  END IF;
  
  v_seller_id := v_listing.seller_id;
  v_amount := v_listing.price;
  
  -- Create order
  INSERT INTO public.orders (
    listing_id,
    buyer_id,
    seller_id,
    status,
    total_amount,
    payment_method_id,
    shipping_address,
    metadata
  ) VALUES (
    p_listing_id,
    p_buyer_id,
    v_seller_id,
    'pending',
    v_amount,
    p_payment_method_id,
    p_shipping_address,
    p_metadata
  ) RETURNING id INTO v_order_id;
  
  -- Update listing status
  UPDATE public.listings
  SET status = 'sold'
  WHERE id = p_listing_id;
  
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Process refund
CREATE OR REPLACE FUNCTION public.process_refund(
  p_order_id UUID,
  p_reason TEXT,
  p_amount NUMERIC DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
  v_refund_amount NUMERIC;
BEGIN
  -- Get order details
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  -- Check if user is authorized (buyer or admin)
  IF v_order.buyer_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized to process refund';
  END IF;
  
  -- Set refund amount
  v_refund_amount := COALESCE(p_amount, v_order.total_amount);
  
  -- Update order status
  UPDATE public.orders
  SET 
    status = 'refunded',
    refund_reason = p_reason,
    refund_amount = v_refund_amount,
    refunded_at = NOW()
  WHERE id = p_order_id;
  
  -- Create refund record
  INSERT INTO public.refund_requests (
    order_id,
    requester_id,
    reason,
    amount,
    status,
    processed_at
  ) VALUES (
    p_order_id,
    auth.uid(),
    p_reason,
    v_refund_amount,
    'approved',
    NOW()
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Get seller analytics
CREATE OR REPLACE FUNCTION public.get_seller_analytics(
  p_seller_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
  total_views INTEGER,
  unique_viewers INTEGER,
  total_sales INTEGER,
  total_revenue NUMERIC,
  avg_order_value NUMERIC,
  conversion_rate NUMERIC,
  top_categories JSONB,
  sales_by_day JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH sales_data AS (
    SELECT 
      o.id,
      o.total_amount,
      o.created_at::DATE as sale_date,
      l.category_id
    FROM public.orders o
    JOIN public.listings l ON o.listing_id = l.id
    WHERE o.seller_id = p_seller_id
      AND o.status = 'delivered'
      AND o.created_at BETWEEN p_start_date AND p_end_date
  ),
  view_data AS (
    SELECT 
      COUNT(*) as total_views,
      COUNT(DISTINCT viewer_id) as unique_viewers
    FROM public.listing_views lv
    JOIN public.listings l ON lv.listing_id = l.id
    WHERE l.seller_id = p_seller_id
      AND lv.viewed_at BETWEEN p_start_date AND p_end_date
  )
  SELECT
    (SELECT total_views FROM view_data)::INTEGER,
    (SELECT unique_viewers FROM view_data)::INTEGER,
    COUNT(*)::INTEGER as total_sales,
    COALESCE(SUM(total_amount), 0) as total_revenue,
    COALESCE(AVG(total_amount), 0) as avg_order_value,
    CASE 
      WHEN (SELECT total_views FROM view_data) > 0 
      THEN (COUNT(*)::NUMERIC / (SELECT total_views FROM view_data)::NUMERIC * 100)
      ELSE 0
    END as conversion_rate,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'category_id', category_id,
        'sales_count', sales_count
      ) ORDER BY sales_count DESC)
      FROM (
        SELECT category_id, COUNT(*) as sales_count
        FROM sales_data
        GROUP BY category_id
        LIMIT 5
      ) top_cats
    ) as top_categories,
    (
      SELECT jsonb_object_agg(
        sale_date::TEXT,
        daily_revenue
      )
      FROM (
        SELECT sale_date, SUM(total_amount) as daily_revenue
        FROM sales_data
        GROUP BY sale_date
        ORDER BY sale_date
      ) daily_sales
    ) as sales_by_day
  FROM sales_data;
END;
$$ LANGUAGE plpgsql STABLE;

-- 10. Calculate shipping cost
CREATE OR REPLACE FUNCTION public.calculate_shipping_cost(
  p_listing_id UUID,
  p_destination_country TEXT
) RETURNS NUMERIC AS $$
DECLARE
  v_listing RECORD;
  v_base_cost NUMERIC := 5.00;
  v_international_fee NUMERIC := 15.00;
BEGIN
  -- Get listing details
  SELECT * INTO v_listing
  FROM public.listings
  WHERE id = p_listing_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Simple shipping calculation
  -- In production, this would integrate with shipping APIs
  IF p_destination_country != 'US' THEN
    RETURN v_base_cost + v_international_fee;
  ELSE
    RETURN v_base_cost;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- 11. Validate coupon code
CREATE OR REPLACE FUNCTION public.validate_coupon_code(
  p_code TEXT,
  p_user_id UUID,
  p_total_amount NUMERIC
) RETURNS TABLE (
  is_valid BOOLEAN,
  discount_amount NUMERIC,
  discount_percentage NUMERIC,
  message TEXT
) AS $$
DECLARE
  v_coupon RECORD;
BEGIN
  -- In a real implementation, you'd have a coupons table
  -- For now, return a simple response
  RETURN QUERY
  SELECT 
    false AS is_valid,
    0::NUMERIC AS discount_amount,
    0::NUMERIC AS discount_percentage,
    'Coupon system not yet implemented'::TEXT AS message;
END;
$$ LANGUAGE plpgsql STABLE;

-- 12. Get recommended listings
CREATE OR REPLACE FUNCTION public.get_recommended_listings(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  id UUID,
  title TEXT,
  price NUMERIC,
  images JSONB,
  seller_id UUID,
  score NUMERIC
) AS $$
BEGIN
  -- Simple recommendation based on user's purchase history
  -- In production, this would use ML/collaborative filtering
  RETURN QUERY
  WITH user_categories AS (
    SELECT DISTINCT l.category_id
    FROM public.orders o
    JOIN public.listings l ON o.listing_id = l.id
    WHERE o.buyer_id = p_user_id
    LIMIT 5
  )
  SELECT 
    l.id,
    l.title,
    l.price,
    l.images,
    l.seller_id,
    RANDOM() AS score -- Replace with actual scoring algorithm
  FROM public.listings l
  WHERE l.status = 'active'
    AND l.seller_id != p_user_id
    AND (
      l.category_id IN (SELECT category_id FROM user_categories)
      OR NOT EXISTS (SELECT 1 FROM user_categories)
    )
  ORDER BY score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 13. Bulk update order status (admin only)
CREATE OR REPLACE FUNCTION public.bulk_update_order_status(
  p_order_ids UUID[],
  p_new_status TEXT,
  p_reason TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Update orders
  WITH updated AS (
    UPDATE public.orders
    SET 
      status = p_new_status,
      updated_at = NOW(),
      metadata = metadata || jsonb_build_object(
        'bulk_update', true,
        'updated_by', auth.uid(),
        'update_reason', p_reason
      )
    WHERE id = ANY(p_order_ids)
    RETURNING id
  )
  SELECT COUNT(*) INTO v_updated_count FROM updated;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Export user data (GDPR compliance)
CREATE OR REPLACE FUNCTION public.export_user_data(
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_data JSONB;
BEGIN
  -- Check if user is requesting their own data or is admin
  IF p_user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Can only export your own data';
  END IF;
  
  -- Compile user data
  SELECT jsonb_build_object(
    'profile', row_to_json(p.*),
    'listings', (
      SELECT jsonb_agg(row_to_json(l.*))
      FROM public.listings l
      WHERE l.seller_id = p_user_id
    ),
    'orders_as_buyer', (
      SELECT jsonb_agg(row_to_json(o.*))
      FROM public.orders o
      WHERE o.buyer_id = p_user_id
    ),
    'orders_as_seller', (
      SELECT jsonb_agg(row_to_json(o.*))
      FROM public.orders o
      WHERE o.seller_id = p_user_id
    ),
    'messages_sent', (
      SELECT jsonb_agg(row_to_json(m.*))
      FROM public.messages m
      WHERE m.sender_id = p_user_id
    ),
    'messages_received', (
      SELECT jsonb_agg(row_to_json(m.*))
      FROM public.messages m
      WHERE m.receiver_id = p_user_id
    ),
    'reviews_given', (
      SELECT jsonb_agg(row_to_json(r.*))
      FROM public.user_ratings r
      WHERE r.rater_user_id = p_user_id
    ),
    'reviews_received', (
      SELECT jsonb_agg(row_to_json(r.*))
      FROM public.user_ratings r
      WHERE r.rated_user_id = p_user_id
    ),
    'export_date', NOW()
  ) INTO v_data
  FROM public.profiles p
  WHERE p.id = p_user_id;
  
  RETURN v_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Delete user account (GDPR compliance)
CREATE OR REPLACE FUNCTION public.delete_user_account(
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is deleting their own account
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Can only delete your own account';
  END IF;
  
  -- Soft delete the profile
  UPDATE public.profiles
  SET 
    account_status = 'deleted',
    deleted_at = NOW(),
    email = 'deleted_' || id::TEXT || '@deleted.com',
    username = 'deleted_' || id::TEXT,
    full_name = 'Deleted User',
    bio = NULL,
    avatar_url = NULL,
    phone = NULL,
    metadata = jsonb_build_object(
      'deletion_reason', p_reason,
      'deleted_at', NOW()
    )
  WHERE id = p_user_id;
  
  -- Cancel all active listings
  UPDATE public.listings
  SET status = 'cancelled'
  WHERE seller_id = p_user_id
    AND status = 'active';
  
  -- Log the deletion
  PERFORM log_auth_event(
    p_user_id,
    'account_deleted',
    NULL,
    NULL,
    jsonb_build_object('reason', p_reason)
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_auth_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_auth_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_listing_view TO public;
GRANT EXECUTE ON FUNCTION public.get_user_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unverified_users_for_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_verify_user_email TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_payment TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_refund TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_seller_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_shipping_cost TO public;
GRANT EXECUTE ON FUNCTION public.validate_coupon_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recommended_listings TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_update_order_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.export_user_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account TO authenticated;