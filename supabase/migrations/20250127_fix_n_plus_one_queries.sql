-- Migration: Fix N+1 Query Problems
-- Description: Adds indexes and optimized functions to reduce database queries from 41 to 2

-- Add critical indexes for foreign keys and commonly queried columns
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_listings_status_created ON listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_category_status ON listings(category_id, status);
CREATE INDEX IF NOT EXISTS idx_listings_seller_status ON listings(seller_id, status);

-- Index for favorites lookups
CREATE INDEX IF NOT EXISTS idx_favorites_user_listing ON favorites(user_id, listing_id);

-- Add full-text search capability
ALTER TABLE listings ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update search vector for existing records
UPDATE listings 
SET search_vector = to_tsvector('english', 
  coalesce(title, '') || ' ' || 
  coalesce(description, '') || ' ' || 
  coalesce(brand, '')
);

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_listings_search_vector ON listings USING gin(search_vector);

-- Trigger to automatically update search vector
CREATE OR REPLACE FUNCTION update_listings_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.title, '') || ' ' || 
    coalesce(NEW.description, '') || ' ' || 
    coalesce(NEW.brand, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_listings_search_vector_trigger ON listings;
CREATE TRIGGER update_listings_search_vector_trigger
BEFORE INSERT OR UPDATE ON listings
FOR EACH ROW
EXECUTE FUNCTION update_listings_search_vector();

-- Optimized function to get listings with all related data and favorite status
CREATE OR REPLACE FUNCTION get_listings_with_favorites(
  p_user_id uuid DEFAULT NULL,
  p_category_id bigint DEFAULT NULL,
  p_subcategory_id text DEFAULT NULL,
  p_status text DEFAULT 'active',
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0,
  p_sort_by text DEFAULT 'created_at',
  p_sort_order text DEFAULT 'desc',
  p_search text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_brands text[] DEFAULT NULL,
  p_sizes text[] DEFAULT NULL,
  p_conditions text[] DEFAULT NULL
)
RETURNS TABLE (
  listing_data jsonb,
  is_favorited boolean
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    jsonb_build_object(
      'id', l.id,
      'title', l.title,
      'description', l.description,
      'price', l.price,
      'currency', l.currency,
      'size', l.size,
      'brand', l.brand,
      'condition', l.condition,
      'status', l.status,
      'created_at', l.created_at,
      'image_urls', l.image_urls,
      'category_id', l.category_id,
      'seller_id', l.seller_id,
      'view_count', l.view_count,
      'like_count', COALESCE(fc.count, 0),
      'location_city', l.location,
      'profiles', jsonb_build_object(
        'username', p.username,
        'avatar_url', p.avatar_url,
        'account_type', p.account_type,
        'is_verified', p.is_verified
      ),
      'categories', jsonb_build_object(
        'name', c.name,
        'slug', c.slug
      )
    ) as listing_data,
    CASE 
      WHEN p_user_id IS NOT NULL AND f.user_id IS NOT NULL THEN true 
      ELSE false 
    END as is_favorited
  FROM listings l
  INNER JOIN profiles p ON l.seller_id = p.id
  LEFT JOIN categories c ON l.category_id = c.id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as count 
    FROM favorites 
    WHERE listing_id = l.id
  ) fc ON true
  LEFT JOIN favorites f ON l.id = f.listing_id AND f.user_id = p_user_id
  WHERE 
    l.status = p_status
    AND (p_category_id IS NULL OR l.category_id = p_category_id)
    AND (p_subcategory_id IS NULL OR l.subcategory_id = p_subcategory_id)
    AND (p_min_price IS NULL OR l.price >= p_min_price)
    AND (p_max_price IS NULL OR l.price <= p_max_price)
    AND (p_brands IS NULL OR l.brand = ANY(p_brands))
    AND (p_sizes IS NULL OR l.size = ANY(p_sizes))
    AND (p_conditions IS NULL OR l.condition = ANY(p_conditions))
    AND (p_search IS NULL OR l.search_vector @@ plainto_tsquery('english', p_search))
  ORDER BY 
    CASE 
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN l.created_at 
    END DESC,
    CASE 
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN l.created_at 
    END ASC,
    CASE 
      WHEN p_sort_by = 'price' AND p_sort_order = 'desc' THEN l.price 
    END DESC,
    CASE 
      WHEN p_sort_by = 'price' AND p_sort_order = 'asc' THEN l.price 
    END ASC,
    CASE 
      WHEN p_sort_by = 'view_count' AND p_sort_order = 'desc' THEN l.view_count 
    END DESC,
    CASE 
      WHEN p_sort_by = 'like_count' AND p_sort_order = 'desc' THEN fc.count 
    END DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Optimized function to get total count for pagination
CREATE OR REPLACE FUNCTION get_listings_count(
  p_category_id bigint DEFAULT NULL,
  p_subcategory_id text DEFAULT NULL,
  p_status text DEFAULT 'active',
  p_search text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_brands text[] DEFAULT NULL,
  p_sizes text[] DEFAULT NULL,
  p_conditions text[] DEFAULT NULL
)
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)
  FROM listings l
  WHERE 
    l.status = p_status
    AND (p_category_id IS NULL OR l.category_id = p_category_id)
    AND (p_subcategory_id IS NULL OR l.subcategory_id = p_subcategory_id)
    AND (p_min_price IS NULL OR l.price >= p_min_price)
    AND (p_max_price IS NULL OR l.price <= p_max_price)
    AND (p_brands IS NULL OR l.brand = ANY(p_brands))
    AND (p_sizes IS NULL OR l.size = ANY(p_sizes))
    AND (p_conditions IS NULL OR l.condition = ANY(p_conditions))
    AND (p_search IS NULL OR l.search_vector @@ plainto_tsquery('english', p_search));
$$;

-- Optimized function to get profile listings with stats
CREATE OR REPLACE FUNCTION get_profile_listings_with_stats(
  p_seller_id uuid,
  p_viewer_id uuid DEFAULT NULL,
  p_status text DEFAULT 'active',
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  listings jsonb,
  total_listings bigint,
  total_likes bigint,
  total_sales bigint
)
LANGUAGE sql
STABLE
AS $$
  WITH profile_listings AS (
    SELECT 
      l.id,
      l.title,
      l.description,
      l.price,
      l.currency,
      l.size,
      l.brand,
      l.condition,
      l.status,
      l.created_at,
      l.image_urls,
      l.category_id,
      l.view_count,
      COALESCE(fc.count, 0) as favorite_count,
      CASE 
        WHEN p_viewer_id IS NOT NULL AND f.user_id IS NOT NULL THEN true 
        ELSE false 
      END as is_favorited,
      c.name as category_name,
      c.slug as category_slug
    FROM listings l
    LEFT JOIN categories c ON l.category_id = c.id
    LEFT JOIN LATERAL (
      SELECT COUNT(*) as count 
      FROM favorites 
      WHERE listing_id = l.id
    ) fc ON true
    LEFT JOIN favorites f ON l.id = f.listing_id AND f.user_id = p_viewer_id
    WHERE 
      l.seller_id = p_seller_id
      AND l.status = p_status
    ORDER BY l.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ),
  stats AS (
    SELECT 
      COUNT(DISTINCT l.id) as total_listings,
      COUNT(DISTINCT f.id) as total_likes,
      COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) as total_sales
    FROM profiles p
    LEFT JOIN listings l ON l.seller_id = p.id AND l.status = 'active'
    LEFT JOIN favorites f ON f.listing_id = l.id
    LEFT JOIN orders o ON o.listing_id = l.id
    WHERE p.id = p_seller_id
  )
  SELECT 
    jsonb_agg(pl.*) as listings,
    s.total_listings,
    s.total_likes,
    s.total_sales
  FROM profile_listings pl
  CROSS JOIN stats s
  GROUP BY s.total_listings, s.total_likes, s.total_sales;
$$;

-- Function to get user's total likes across all their listings
CREATE OR REPLACE FUNCTION get_user_total_likes(p_user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(DISTINCT f.id)
  FROM favorites f
  INNER JOIN listings l ON f.listing_id = l.id
  WHERE l.seller_id = p_user_id;
$$;

-- Optimized function for wishlist/favorites page
CREATE OR REPLACE FUNCTION get_user_favorites_with_listings(
  p_user_id uuid,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  favorite_id uuid,
  created_at timestamptz,
  listing_data jsonb
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    f.id as favorite_id,
    f.created_at,
    jsonb_build_object(
      'id', l.id,
      'title', l.title,
      'price', l.price,
      'currency', l.currency,
      'images', l.image_urls,
      'size', l.size,
      'brand', l.brand,
      'condition', l.condition,
      'status', l.status,
      'seller_id', l.seller_id,
      'location', l.location,
      'profiles', jsonb_build_object(
        'username', p.username,
        'avatar_url', p.avatar_url,
        'account_type', p.account_type
      )
    ) as listing_data
  FROM favorites f
  INNER JOIN listings l ON f.listing_id = l.id
  INNER JOIN profiles p ON l.seller_id = p.id
  WHERE f.user_id = p_user_id
    AND l.status = 'active'
  ORDER BY f.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Optimized function for home page categories with counts
CREATE OR REPLACE FUNCTION get_categories_with_counts()
RETURNS TABLE (
  category_data jsonb,
  product_count bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'slug', c.slug,
      'icon_url', c.icon_url,
      'is_active', c.is_active,
      'sort_order', c.sort_order,
      'parent_id', c.parent_id
    ) as category_data,
    COUNT(DISTINCT l.id) as product_count
  FROM categories c
  LEFT JOIN listings l ON c.id = l.category_id AND l.status = 'active'
  WHERE c.parent_id IS NULL
    AND c.is_active = true
  GROUP BY c.id, c.name, c.slug, c.icon_url, c.is_active, c.sort_order, c.parent_id
  ORDER BY c.sort_order, c.name;
$$;

-- Optimized function for home page featured/popular listings
CREATE OR REPLACE FUNCTION get_homepage_listings(
  p_type text DEFAULT 'featured', -- 'featured' or 'popular'
  p_limit int DEFAULT 16
)
RETURNS TABLE (
  listing_data jsonb
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    jsonb_build_object(
      'id', l.id,
      'title', l.title,
      'price', l.price,
      'currency', l.currency,
      'condition', l.condition,
      'brand', l.brand,
      'size', l.size,
      'image_urls', l.image_urls,
      'created_at', l.created_at,
      'view_count', l.view_count,
      'seller', jsonb_build_object(
        'username', p.username,
        'avatar_url', p.avatar_url
      )
    ) as listing_data
  FROM listings l
  INNER JOIN profiles p ON l.seller_id = p.id
  WHERE l.status = 'active'
  ORDER BY 
    CASE 
      WHEN p_type = 'featured' THEN l.created_at 
    END DESC,
    CASE 
      WHEN p_type = 'popular' THEN l.view_count 
    END DESC
  LIMIT p_limit;
$$;

-- Optimized function for category page listings
CREATE OR REPLACE FUNCTION get_category_listings(
  p_category_id bigint,
  p_subcategory_id bigint DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0,
  p_sort_by text DEFAULT 'created_at',
  p_sort_order text DEFAULT 'desc',
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_brands text[] DEFAULT NULL,
  p_sizes text[] DEFAULT NULL,
  p_conditions text[] DEFAULT NULL,
  p_colors text[] DEFAULT NULL
)
RETURNS TABLE (
  listing_data jsonb,
  total_count bigint
)
LANGUAGE sql
STABLE
AS $$
  WITH filtered_listings AS (
    SELECT 
      l.id,
      l.title,
      l.price,
      l.currency,
      l.size,
      l.brand,
      l.condition,
      l.color,
      l.status,
      l.created_at,
      l.image_urls,
      l.view_count,
      l.seller_id,
      p.username,
      p.avatar_url,
      c.name as category_name,
      c.slug as category_slug,
      sc.name as subcategory_name,
      sc.slug as subcategory_slug
    FROM listings l
    INNER JOIN profiles p ON l.seller_id = p.id
    LEFT JOIN categories c ON l.category_id = c.id
    LEFT JOIN categories sc ON l.subcategory_id = sc.id
    WHERE 
      l.status = 'active'
      AND l.category_id = p_category_id
      AND (p_subcategory_id IS NULL OR l.subcategory_id = p_subcategory_id)
      AND (p_min_price IS NULL OR l.price >= p_min_price)
      AND (p_max_price IS NULL OR l.price <= p_max_price)
      AND (p_brands IS NULL OR l.brand = ANY(p_brands))
      AND (p_sizes IS NULL OR l.size = ANY(p_sizes))
      AND (p_conditions IS NULL OR l.condition = ANY(p_conditions))
      AND (p_colors IS NULL OR l.color = ANY(p_colors))
  ),
  paginated AS (
    SELECT *
    FROM filtered_listings
    ORDER BY 
      CASE 
        WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN created_at 
      END DESC,
      CASE 
        WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN created_at 
      END ASC,
      CASE 
        WHEN p_sort_by = 'price' AND p_sort_order = 'desc' THEN price 
      END DESC,
      CASE 
        WHEN p_sort_by = 'price' AND p_sort_order = 'asc' THEN price 
      END ASC,
      CASE 
        WHEN p_sort_by = 'view_count' AND p_sort_order = 'desc' THEN view_count 
      END DESC
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT 
    jsonb_build_object(
      'id', p.id,
      'title', p.title,
      'price', p.price,
      'currency', p.currency,
      'size', p.size,
      'brand', p.brand,
      'condition', p.condition,
      'color', p.color,
      'created_at', p.created_at,
      'image_urls', p.image_urls,
      'view_count', p.view_count,
      'seller', jsonb_build_object(
        'username', p.username,
        'avatar_url', p.avatar_url
      ),
      'category', jsonb_build_object(
        'name', p.category_name,
        'slug', p.category_slug
      ),
      'subcategory', CASE 
        WHEN p.subcategory_name IS NOT NULL THEN jsonb_build_object(
          'name', p.subcategory_name,
          'slug', p.subcategory_slug
        )
        ELSE NULL
      END
    ) as listing_data,
    (SELECT COUNT(*) FROM filtered_listings) as total_count
  FROM paginated p;
$$;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_listings_subcategory_id ON listings(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_listings_brand ON listings(brand);
CREATE INDEX IF NOT EXISTS idx_listings_size ON listings(size);
CREATE INDEX IF NOT EXISTS idx_listings_condition ON listings(condition);
CREATE INDEX IF NOT EXISTS idx_listings_color ON listings(color);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(location);
CREATE INDEX IF NOT EXISTS idx_listings_view_count ON listings(view_count DESC);

-- Composite indexes for category queries
CREATE INDEX IF NOT EXISTS idx_listings_category_subcategory_status ON listings(category_id, subcategory_id, status);

-- Indexes for favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON favorites(listing_id);

-- Indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_total_sales ON profiles(total_sales DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_seller_rating ON profiles(seller_rating DESC);

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_listings_with_favorites TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_listings_count TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_profile_listings_with_stats TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_total_likes TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_favorites_with_listings TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_categories_with_counts TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_homepage_listings TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_category_listings TO authenticated, anon;