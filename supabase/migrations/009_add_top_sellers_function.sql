-- Function to get top sellers (overall or by time period)
CREATE OR REPLACE FUNCTION get_top_sellers(
  time_period text DEFAULT 'month',
  result_limit int DEFAULT 12
)
RETURNS TABLE (
  id uuid,
  username text,
  avatar_url text,
  full_name text,
  total_sales bigint,
  average_rating numeric,
  total_reviews bigint,
  created_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  WITH seller_stats AS (
    SELECT 
      p.id,
      p.username,
      p.avatar_url,
      p.full_name,
      p.created_at,
      COUNT(DISTINCT o.id) AS total_sales,
      AVG(r.rating) AS average_rating,
      COUNT(DISTINCT r.id) AS total_reviews
    FROM profiles p
    LEFT JOIN listings l ON l.seller_id = p.id
    LEFT JOIN orders o ON o.listing_id = l.id 
      AND o.status = 'completed'
      AND (
        CASE 
          WHEN time_period = 'week' THEN o.completed_at >= NOW() - INTERVAL '7 days'
          WHEN time_period = 'month' THEN o.completed_at >= NOW() - INTERVAL '30 days'
          WHEN time_period = 'year' THEN o.completed_at >= NOW() - INTERVAL '365 days'
          ELSE TRUE -- 'all' time
        END
      )
    LEFT JOIN reviews r ON r.seller_id = p.id
    WHERE p.is_seller = true
      AND p.is_active = true
    GROUP BY p.id, p.username, p.avatar_url, p.full_name, p.created_at
    HAVING COUNT(DISTINCT o.id) > 0
  )
  SELECT 
    id,
    username,
    avatar_url,
    full_name,
    total_sales,
    COALESCE(ROUND(average_rating, 1), 0) AS average_rating,
    total_reviews,
    created_at
  FROM seller_stats
  ORDER BY total_sales DESC, average_rating DESC
  LIMIT result_limit;
$$;

-- Function to get top sellers for a specific category
CREATE OR REPLACE FUNCTION get_top_category_sellers(
  category_uuid uuid,
  time_period text DEFAULT 'month',
  result_limit int DEFAULT 6
)
RETURNS TABLE (
  id uuid,
  username text,
  avatar_url text,
  full_name text,
  category_sales bigint,
  category_rating numeric,
  category_reviews bigint,
  created_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  WITH category_seller_stats AS (
    SELECT 
      p.id,
      p.username,
      p.avatar_url,
      p.full_name,
      p.created_at,
      COUNT(DISTINCT o.id) AS category_sales,
      AVG(r.rating) AS category_rating,
      COUNT(DISTINCT r.id) AS category_reviews
    FROM profiles p
    LEFT JOIN listings l ON l.seller_id = p.id
    LEFT JOIN orders o ON o.listing_id = l.id 
      AND o.status = 'completed'
      AND l.category_id = category_uuid
      AND (
        CASE 
          WHEN time_period = 'week' THEN o.completed_at >= NOW() - INTERVAL '7 days'
          WHEN time_period = 'month' THEN o.completed_at >= NOW() - INTERVAL '30 days'
          WHEN time_period = 'year' THEN o.completed_at >= NOW() - INTERVAL '365 days'
          ELSE TRUE -- 'all' time
        END
      )
    LEFT JOIN reviews r ON r.listing_id = l.id
      AND l.category_id = category_uuid
    WHERE p.is_seller = true
      AND p.is_active = true
    GROUP BY p.id, p.username, p.avatar_url, p.full_name, p.created_at
    HAVING COUNT(DISTINCT o.id) > 0
  )
  SELECT 
    id,
    username,
    avatar_url,
    full_name,
    category_sales,
    COALESCE(ROUND(category_rating, 1), 0) AS category_rating,
    category_reviews,
    created_at
  FROM category_seller_stats
  ORDER BY category_sales DESC, category_rating DESC
  LIMIT result_limit;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_top_sellers TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_category_sellers TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_sellers TO anon;
GRANT EXECUTE ON FUNCTION get_top_category_sellers TO anon;