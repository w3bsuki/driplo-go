-- Migration: Add Performance-Optimized Database Functions
-- Purpose: Create functions for complex operations that run faster in the database
-- Date: 2025-07-19
-- These functions reduce client-server roundtrips and leverage database optimization

-- ============================================
-- ORDER MANAGEMENT FUNCTIONS
-- ============================================

-- Calculate order totals with all fees
CREATE OR REPLACE FUNCTION calculate_order_totals(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  WITH order_calculations AS (
    SELECT 
      o.id,
      o.currency,
      -- Item totals
      COALESCE(SUM(oi.quantity * oi.price), 0) as subtotal,
      COALESCE(SUM(oi.quantity * oi.price * 0.10), 0) as platform_fee, -- 10% platform fee
      -- Shipping
      COALESCE(o.shipping_cost, 0) as shipping_cost,
      -- Discount
      COALESCE(o.discount_amount, 0) as discount_amount,
      -- Coupon discount
      COALESCE(c.discount_amount, c.discount_percentage * SUM(oi.quantity * oi.price) / 100, 0) as coupon_discount
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN coupon_usage cu ON cu.order_id = o.id
    LEFT JOIN coupons c ON c.id = cu.coupon_id
    WHERE o.id = p_order_id
    GROUP BY o.id, o.currency, o.shipping_cost, o.discount_amount, c.discount_amount, c.discount_percentage
  )
  SELECT jsonb_build_object(
    'order_id', id,
    'currency', currency,
    'subtotal', subtotal,
    'platform_fee', platform_fee,
    'shipping_cost', shipping_cost,
    'discount_amount', discount_amount,
    'coupon_discount', coupon_discount,
    'total_amount', subtotal + platform_fee + shipping_cost - discount_amount - coupon_discount,
    'seller_payout', subtotal - platform_fee
  ) INTO v_result
  FROM order_calculations;
  
  -- Update order if totals changed
  UPDATE orders
  SET 
    subtotal = (v_result->>'subtotal')::numeric,
    total_amount = (v_result->>'total_amount')::numeric,
    platform_fee = (v_result->>'platform_fee')::numeric,
    updated_at = now()
  WHERE id = p_order_id;
  
  RETURN v_result;
END;
$$;

-- Get order with all details (optimized single query)
CREATE OR REPLACE FUNCTION get_order_details(p_order_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_user_id uuid;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  -- Check access
  IF NOT EXISTS (
    SELECT 1 FROM orders 
    WHERE id = p_order_id 
    AND (buyer_id = v_user_id OR seller_id = v_user_id OR auth.is_admin())
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  SELECT jsonb_build_object(
    'order', row_to_json(o.*),
    'buyer', jsonb_build_object(
      'id', b.id,
      'username', b.username,
      'avatar_url', b.avatar_url,
      'trust_score', b.trust_score
    ),
    'seller', jsonb_build_object(
      'id', s.id,
      'username', s.username,
      'shop_name', s.shop_name,
      'avatar_url', s.avatar_url,
      'seller_rating', s.seller_rating
    ),
    'items', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', oi.id,
        'listing_id', oi.listing_id,
        'variant_id', oi.variant_id,
        'quantity', oi.quantity,
        'price', oi.price,
        'title', l.title,
        'image_url', l.images->0->>'url',
        'variant_name', pv.name,
        'status', oi.status
      ) ORDER BY oi.created_at
    ) FILTER (WHERE oi.id IS NOT NULL), '[]'::jsonb) as items,
    'shipping', CASE 
      WHEN o.shipping_address_id IS NOT NULL THEN
        jsonb_build_object(
          'address', row_to_json(sa.*),
          'tracking', row_to_json(ot.*)
        )
      ELSE NULL
    END,
    'payment', jsonb_build_object(
      'method', pm.payment_type,
      'last4', pm.last4,
      'status', pt.status,
      'processor_response', pt.processor_response
    ),
    'totals', calculate_order_totals(o.id)
  ) INTO v_result
  FROM orders o
  JOIN profiles b ON b.id = o.buyer_id
  JOIN profiles s ON s.id = o.seller_id
  LEFT JOIN order_items oi ON oi.order_id = o.id
  LEFT JOIN listings l ON l.id = oi.listing_id
  LEFT JOIN product_variants pv ON pv.id = oi.variant_id
  LEFT JOIN shipping_addresses sa ON sa.id = o.shipping_address_id
  LEFT JOIN order_tracking ot ON ot.order_id = o.id
  LEFT JOIN payment_transactions pt ON pt.order_id = o.id AND pt.status = 'completed'
  LEFT JOIN payment_methods pm ON pm.id = pt.payment_method_id
  WHERE o.id = p_order_id
  GROUP BY o.id, b.id, s.id, sa.id, ot.id, pm.id, pt.id;
  
  RETURN v_result;
END;
$$;

-- ============================================
-- USER STATISTICS FUNCTIONS
-- ============================================

-- Get comprehensive user statistics (cached for performance)
CREATE OR REPLACE FUNCTION get_user_statistics(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_stats jsonb;
  v_is_seller boolean;
BEGIN
  -- Check if user is seller
  SELECT is_seller INTO v_is_seller
  FROM profiles WHERE id = p_user_id;
  
  -- Base statistics
  WITH user_stats AS (
    SELECT
      -- Buyer stats
      COUNT(DISTINCT o.id) FILTER (WHERE o.buyer_id = p_user_id) as total_purchases,
      COALESCE(SUM(o.total_amount) FILTER (WHERE o.buyer_id = p_user_id), 0) as total_spent,
      COUNT(DISTINCT f.id) as total_favorites,
      COUNT(DISTINCT uf.id) as followers_count,
      COUNT(DISTINCT uf2.id) as following_count,
      -- Seller stats (if applicable)
      COUNT(DISTINCT l.id) FILTER (WHERE l.seller_id = p_user_id) as total_listings,
      COUNT(DISTINCT l.id) FILTER (WHERE l.seller_id = p_user_id AND l.is_active = true) as active_listings,
      COUNT(DISTINCT o2.id) FILTER (WHERE o2.seller_id = p_user_id) as total_sales,
      COALESCE(SUM(o2.total_amount) FILTER (WHERE o2.seller_id = p_user_id), 0) as total_revenue,
      -- Ratings
      AVG(r.rating) FILTER (WHERE r.rated_user_id = p_user_id) as avg_rating,
      COUNT(r.id) FILTER (WHERE r.rated_user_id = p_user_id) as total_reviews
    FROM profiles p
    LEFT JOIN orders o ON o.buyer_id = p.id AND o.status = 'completed'
    LEFT JOIN orders o2 ON o2.seller_id = p.id AND o2.status = 'completed'
    LEFT JOIN listings l ON l.seller_id = p.id
    LEFT JOIN favorites f ON f.user_id = p.id
    LEFT JOIN user_follows uf ON uf.following_id = p.id
    LEFT JOIN user_follows uf2 ON uf2.follower_id = p.id
    LEFT JOIN user_ratings r ON r.rated_user_id = p.id
    WHERE p.id = p_user_id
    GROUP BY p.id
  ),
  -- Recent activity
  recent_activity AS (
    SELECT jsonb_build_object(
      'last_purchase', MAX(created_at) FILTER (WHERE buyer_id = p_user_id),
      'last_sale', MAX(created_at) FILTER (WHERE seller_id = p_user_id),
      'last_login', MAX(login_at) FILTER (WHERE success = true)
    ) as activity
    FROM orders o
    FULL OUTER JOIN auth_login_history lh ON lh.user_id = p_user_id
    WHERE o.buyer_id = p_user_id OR o.seller_id = p_user_id OR lh.user_id = p_user_id
  ),
  -- Achievements summary
  achievements AS (
    SELECT 
      COUNT(*) FILTER (WHERE progress = 100) as completed_achievements,
      COUNT(*) as total_achievements,
      MAX(earned_at) as last_achievement_date
    FROM archive.user_achievements
    WHERE user_id = p_user_id
  )
  SELECT jsonb_build_object(
    'user_id', p_user_id,
    'is_seller', v_is_seller,
    'buyer_stats', jsonb_build_object(
      'total_purchases', total_purchases,
      'total_spent', total_spent,
      'total_favorites', total_favorites
    ),
    'seller_stats', CASE 
      WHEN v_is_seller THEN jsonb_build_object(
        'total_listings', total_listings,
        'active_listings', active_listings,
        'total_sales', total_sales,
        'total_revenue', total_revenue,
        'avg_rating', ROUND(avg_rating, 2),
        'total_reviews', total_reviews
      )
      ELSE NULL
    END,
    'social_stats', jsonb_build_object(
      'followers_count', followers_count,
      'following_count', following_count
    ),
    'achievements', jsonb_build_object(
      'completed', achievements.completed_achievements,
      'total', achievements.total_achievements,
      'last_earned', achievements.last_achievement_date
    ),
    'recent_activity', recent_activity.activity,
    'calculated_at', now()
  ) INTO v_stats
  FROM user_stats, recent_activity, achievements;
  
  RETURN v_stats;
END;
$$;

-- ============================================
-- LISTING SEARCH & DISCOVERY FUNCTIONS
-- ============================================

-- Advanced listing search with filters and sorting
CREATE OR REPLACE FUNCTION search_listings(
  p_query text DEFAULT NULL,
  p_category_id int DEFAULT NULL,
  p_subcategory_id int DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_tags text[] DEFAULT NULL,
  p_condition text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_seller_id uuid DEFAULT NULL,
  p_sort_by text DEFAULT 'created_at',
  p_sort_order text DEFAULT 'DESC',
  p_limit int DEFAULT 24,
  p_offset int DEFAULT 0
)
RETURNS TABLE(
  listing jsonb,
  relevance_score numeric
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_listings AS (
    SELECT 
      l.*,
      -- Calculate relevance score
      CASE 
        WHEN p_query IS NOT NULL THEN
          ts_rank(
            to_tsvector('english', l.title || ' ' || COALESCE(l.description, '')),
            plainto_tsquery('english', p_query)
          )
        ELSE 1.0
      END as relevance,
      -- Get aggregated stats
      COUNT(DISTINCT f.id) as favorite_count,
      COUNT(DISTINCT oi.id) as sales_count,
      AVG(r.rating) as avg_rating,
      p.username as seller_username,
      p.avatar_url as seller_avatar,
      p.seller_rating,
      p.seller_verified
    FROM listings l
    JOIN profiles p ON p.id = l.seller_id
    LEFT JOIN favorites f ON f.listing_id = l.id
    LEFT JOIN order_items oi ON oi.listing_id = l.id
    LEFT JOIN user_ratings r ON r.listing_id = l.id
    WHERE l.is_active = true
      AND l.deleted_at IS NULL
      AND (p_query IS NULL OR 
           to_tsvector('english', l.title || ' ' || COALESCE(l.description, '')) @@ 
           plainto_tsquery('english', p_query))
      AND (p_category_id IS NULL OR l.category_id = p_category_id)
      AND (p_subcategory_id IS NULL OR l.subcategory_id = p_subcategory_id)
      AND (p_min_price IS NULL OR l.price >= p_min_price)
      AND (p_max_price IS NULL OR l.price <= p_max_price)
      AND (p_tags IS NULL OR l.tags && p_tags)
      AND (p_condition IS NULL OR l.condition = p_condition)
      AND (p_location IS NULL OR l.location ILIKE '%' || p_location || '%')
      AND (p_seller_id IS NULL OR l.seller_id = p_seller_id)
    GROUP BY l.id, p.id
  )
  SELECT 
    jsonb_build_object(
      'id', id,
      'title', title,
      'slug', slug,
      'price', price,
      'currency', currency,
      'condition', condition,
      'images', images,
      'location', location,
      'created_at', created_at,
      'updated_at', updated_at,
      'seller', jsonb_build_object(
        'id', seller_id,
        'username', seller_username,
        'avatar_url', seller_avatar,
        'rating', seller_rating,
        'verified', seller_verified
      ),
      'stats', jsonb_build_object(
        'favorites', favorite_count,
        'sales', sales_count,
        'rating', ROUND(avg_rating, 1)
      )
    ) as listing,
    relevance as relevance_score
  FROM filtered_listings
  ORDER BY
    CASE 
      WHEN p_sort_by = 'relevance' AND p_sort_order = 'DESC' THEN relevance
      WHEN p_sort_by = 'price' AND p_sort_order = 'ASC' THEN price
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'DESC' THEN EXTRACT(EPOCH FROM created_at)
    END DESC NULLS LAST,
    CASE
      WHEN p_sort_by = 'price' AND p_sort_order = 'DESC' THEN price
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'ASC' THEN EXTRACT(EPOCH FROM created_at)
    END ASC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Get similar listings (for recommendations)
CREATE OR REPLACE FUNCTION get_similar_listings(
  p_listing_id uuid,
  p_limit int DEFAULT 12
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_listing record;
  v_results jsonb;
BEGIN
  -- Get the reference listing
  SELECT category_id, subcategory_id, price, tags, seller_id
  INTO v_listing
  FROM listings
  WHERE id = p_listing_id;
  
  -- Find similar listings
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', l.id,
      'title', l.title,
      'price', l.price,
      'images', l.images,
      'similarity_score', 
        CASE WHEN l.category_id = v_listing.category_id THEN 0.5 ELSE 0 END +
        CASE WHEN l.subcategory_id = v_listing.subcategory_id THEN 0.3 ELSE 0 END +
        CASE WHEN ABS(l.price - v_listing.price) / v_listing.price < 0.2 THEN 0.2 ELSE 0 END +
        CASE WHEN l.tags && v_listing.tags THEN 0.2 ELSE 0 END
    )
    ORDER BY 
      CASE WHEN l.category_id = v_listing.category_id THEN 0.5 ELSE 0 END +
      CASE WHEN l.subcategory_id = v_listing.subcategory_id THEN 0.3 ELSE 0 END +
      CASE WHEN ABS(l.price - v_listing.price) / v_listing.price < 0.2 THEN 0.2 ELSE 0 END +
      CASE WHEN l.tags && v_listing.tags THEN 0.2 ELSE 0 END DESC
    LIMIT p_limit
  ) INTO v_results
  FROM listings l
  WHERE l.id != p_listing_id
    AND l.is_active = true
    AND l.deleted_at IS NULL
    AND l.seller_id != v_listing.seller_id
    AND (
      l.category_id = v_listing.category_id OR
      l.subcategory_id = v_listing.subcategory_id OR
      l.tags && v_listing.tags
    );
  
  RETURN COALESCE(v_results, '[]'::jsonb);
END;
$$;

-- ============================================
-- CART & CHECKOUT FUNCTIONS
-- ============================================

-- Validate and prepare cart for checkout
CREATE OR REPLACE FUNCTION prepare_checkout(p_cart_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_user_id uuid;
  v_issues jsonb[] := '{}';
  v_cart_total numeric := 0;
  v_shipping_total numeric := 0;
BEGIN
  -- Get cart owner
  SELECT user_id INTO v_user_id
  FROM shopping_carts
  WHERE id = p_cart_id;
  
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Validate all cart items
  WITH cart_validation AS (
    SELECT 
      ci.id,
      ci.listing_id,
      ci.variant_id,
      ci.quantity,
      ci.price,
      l.title,
      l.seller_id,
      l.is_active,
      l.price as current_price,
      l.shipping_cost,
      COALESCE(pv.stock, l.quantity_available) as available_stock,
      pv.is_available,
      CASE
        WHEN l.deleted_at IS NOT NULL THEN 'Listing no longer available'
        WHEN l.is_active = false THEN 'Listing is inactive'
        WHEN ci.price != l.price THEN 'Price has changed'
        WHEN COALESCE(pv.stock, l.quantity_available) < ci.quantity THEN 'Insufficient stock'
        WHEN pv.id IS NOT NULL AND pv.is_available = false THEN 'Variant unavailable'
        ELSE NULL
      END as issue
    FROM cart_items ci
    JOIN listings l ON l.id = ci.listing_id
    LEFT JOIN product_variants pv ON pv.id = ci.variant_id
    WHERE ci.cart_id = p_cart_id
      AND ci.deleted_at IS NULL
  ),
  -- Group by seller for shipping optimization
  seller_groups AS (
    SELECT 
      seller_id,
      jsonb_agg(
        jsonb_build_object(
          'item_id', id,
          'listing_id', listing_id,
          'title', title,
          'quantity', quantity,
          'price', price,
          'current_price', current_price,
          'shipping_cost', shipping_cost,
          'issue', issue
        ) ORDER BY title
      ) as items,
      SUM(quantity * price) as seller_subtotal,
      MAX(shipping_cost) as seller_shipping, -- Combined shipping
      bool_and(issue IS NULL) as all_valid
    FROM cart_validation
    GROUP BY seller_id
  )
  SELECT jsonb_build_object(
    'cart_id', p_cart_id,
    'user_id', v_user_id,
    'sellers', jsonb_agg(
      jsonb_build_object(
        'seller_id', seller_id,
        'items', items,
        'subtotal', seller_subtotal,
        'shipping', seller_shipping,
        'valid', all_valid
      )
    ),
    'totals', jsonb_build_object(
      'subtotal', SUM(seller_subtotal),
      'shipping', SUM(seller_shipping),
      'platform_fee', SUM(seller_subtotal) * 0.10,
      'total', SUM(seller_subtotal) + SUM(seller_shipping) + (SUM(seller_subtotal) * 0.10)
    ),
    'issues', array_to_json(
      array_agg(items -> 'issue') 
      FILTER (WHERE NOT all_valid)
    ),
    'ready_for_checkout', bool_and(all_valid),
    'prepared_at', now()
  ) INTO v_result
  FROM seller_groups;
  
  RETURN v_result;
END;
$$;

-- ============================================
-- MESSAGING FUNCTIONS
-- ============================================

-- Get or create conversation between users
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_other_user_id uuid,
  p_listing_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id uuid;
  v_current_user_id uuid;
BEGIN
  v_current_user_id := auth.uid();
  
  -- Check for existing conversation
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE (
    (participant1_id = v_current_user_id AND participant2_id = p_other_user_id) OR
    (participant1_id = p_other_user_id AND participant2_id = v_current_user_id)
  )
  AND (p_listing_id IS NULL OR listing_id = p_listing_id);
  
  -- Create if not exists
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (
      participant1_id,
      participant2_id,
      listing_id
    ) VALUES (
      v_current_user_id,
      p_other_user_id,
      p_listing_id
    )
    RETURNING id INTO v_conversation_id;
  END IF;
  
  RETURN v_conversation_id;
END;
$$;

-- Get conversation with messages and participants
CREATE OR REPLACE FUNCTION get_conversation_details(p_conversation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_current_user_id uuid;
BEGIN
  v_current_user_id := auth.uid();
  
  -- Verify access
  IF NOT EXISTS (
    SELECT 1 FROM conversations
    WHERE id = p_conversation_id
    AND (participant1_id = v_current_user_id OR participant2_id = v_current_user_id)
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Get conversation with recent messages
  WITH conversation_data AS (
    SELECT 
      c.*,
      p1.username as participant1_username,
      p1.avatar_url as participant1_avatar,
      p2.username as participant2_username,
      p2.avatar_url as participant2_avatar,
      l.title as listing_title,
      l.images->0->>'url' as listing_image
    FROM conversations c
    JOIN profiles p1 ON p1.id = c.participant1_id
    JOIN profiles p2 ON p2.id = c.participant2_id
    LEFT JOIN listings l ON l.id = c.listing_id
    WHERE c.id = p_conversation_id
  ),
  recent_messages AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', m.id,
        'content', m.content,
        'sender_id', m.sender_id,
        'created_at', m.created_at,
        'is_read', m.is_read,
        'attachments', m.attachments
      ) ORDER BY m.created_at DESC
    ) as messages
    FROM (
      SELECT * FROM messages
      WHERE conversation_id = p_conversation_id
      ORDER BY created_at DESC
      LIMIT 50
    ) m
  )
  SELECT jsonb_build_object(
    'id', cd.id,
    'participant1', jsonb_build_object(
      'id', cd.participant1_id,
      'username', cd.participant1_username,
      'avatar_url', cd.participant1_avatar
    ),
    'participant2', jsonb_build_object(
      'id', cd.participant2_id,
      'username', cd.participant2_username,
      'avatar_url', cd.participant2_avatar
    ),
    'listing', CASE 
      WHEN cd.listing_id IS NOT NULL THEN jsonb_build_object(
        'id', cd.listing_id,
        'title', cd.listing_title,
        'image', cd.listing_image
      )
      ELSE NULL
    END,
    'messages', COALESCE(rm.messages, '[]'::jsonb),
    'last_message_at', cd.last_message_at,
    'created_at', cd.created_at
  ) INTO v_result
  FROM conversation_data cd, recent_messages rm;
  
  -- Mark messages as read
  UPDATE messages
  SET is_read = true
  WHERE conversation_id = p_conversation_id
    AND sender_id != v_current_user_id
    AND is_read = false;
  
  RETURN v_result;
END;
$$;

-- ============================================
-- NOTIFICATION FUNCTIONS
-- ============================================

-- Create notification with deduplication
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_data jsonb DEFAULT '{}'::jsonb,
  p_dedupe_key text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  -- Check for duplicate if dedupe key provided
  IF p_dedupe_key IS NOT NULL THEN
    SELECT id INTO v_notification_id
    FROM notifications
    WHERE user_id = p_user_id
      AND type = p_type
      AND data->>'dedupe_key' = p_dedupe_key
      AND created_at > now() - interval '24 hours';
    
    IF v_notification_id IS NOT NULL THEN
      RETURN v_notification_id;
    END IF;
  END IF;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_data || jsonb_build_object('dedupe_key', p_dedupe_key)
  )
  RETURNING id INTO v_notification_id;
  
  -- Send realtime notification
  PERFORM pg_notify(
    'user_notification',
    json_build_object(
      'user_id', p_user_id,
      'notification_id', v_notification_id,
      'type', p_type,
      'title', p_title
    )::text
  );
  
  RETURN v_notification_id;
END;
$$;

-- Batch mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(p_notification_ids uuid[])
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int;
BEGIN
  UPDATE notifications
  SET read = true, read_at = now()
  WHERE id = ANY(p_notification_ids)
    AND user_id = auth.uid()
    AND read = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_order_totals TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION search_listings TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_similar_listings TO authenticated, anon;
GRANT EXECUTE ON FUNCTION prepare_checkout TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_conversation TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_details TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION mark_notifications_read TO authenticated;