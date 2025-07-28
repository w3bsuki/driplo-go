-- Migration: Add Materialized Views for Analytics and Performance
-- Purpose: Pre-compute complex aggregations for instant dashboard loading
-- Date: 2025-07-19
-- Materialized views dramatically improve performance for analytics queries

-- ============================================
-- POPULAR PRODUCTS & TRENDING ITEMS
-- ============================================

-- Popular products by various metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_products_mv AS
WITH product_metrics AS (
    SELECT 
        l.id,
        l.title,
        l.slug,
        l.price,
        l.currency,
        l.images,
        l.category_id,
        l.subcategory_id,
        l.seller_id,
        p.username as seller_username,
        p.shop_name,
        p.avatar_url as seller_avatar,
        p.seller_rating,
        -- Sales metrics
        COUNT(DISTINCT oi.order_id) as order_count,
        COALESCE(SUM(oi.quantity), 0) as total_sold,
        COALESCE(SUM(oi.quantity * oi.price), 0) as revenue,
        -- Engagement metrics
        COUNT(DISTINCT f.user_id) as favorite_count,
        COUNT(DISTINCT lv.viewer_id) as view_count,
        COUNT(DISTINCT r.id) as review_count,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        -- Time-based metrics
        MAX(oi.created_at) as last_sold_at,
        COUNT(DISTINCT oi.order_id) FILTER (WHERE oi.created_at > now() - interval '7 days') as sales_last_week,
        COUNT(DISTINCT oi.order_id) FILTER (WHERE oi.created_at > now() - interval '30 days') as sales_last_month
    FROM listings l
    JOIN profiles p ON p.id = l.seller_id
    LEFT JOIN order_items oi ON oi.listing_id = l.id
        AND oi.status != 'cancelled'
    LEFT JOIN orders o ON o.id = oi.order_id 
        AND o.status IN ('completed', 'shipped', 'delivered')
    LEFT JOIN favorites f ON f.listing_id = l.id
    LEFT JOIN archive.listing_views lv ON lv.listing_id = l.id
    LEFT JOIN user_ratings r ON r.listing_id = l.id
    WHERE l.is_active = true 
        AND l.deleted_at IS NULL
    GROUP BY l.id, p.id
),
ranked_products AS (
    SELECT 
        *,
        -- Popularity score (weighted combination)
        (
            (order_count * 10) +              -- Orders are most important
            (total_sold * 5) +                -- Quantity sold
            (favorite_count * 3) +            -- Favorites indicate interest
            (view_count * 0.1) +              -- Views are least important
            (avg_rating * review_count * 2)  -- Good ratings with many reviews
        ) as popularity_score,
        -- Trending score (recent activity)
        (
            (sales_last_week * 20) +
            (sales_last_month * 5)
        ) as trending_score
    FROM product_metrics
)
SELECT 
    *,
    ROW_NUMBER() OVER (ORDER BY popularity_score DESC) as popularity_rank,
    ROW_NUMBER() OVER (ORDER BY trending_score DESC) as trending_rank,
    ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY popularity_score DESC) as category_rank
FROM ranked_products
WHERE order_count > 0 OR favorite_count > 5;  -- Only products with some activity

CREATE UNIQUE INDEX idx_popular_products_id ON popular_products_mv(id);
CREATE INDEX idx_popular_products_popularity ON popular_products_mv(popularity_rank);
CREATE INDEX idx_popular_products_trending ON popular_products_mv(trending_rank);
CREATE INDEX idx_popular_products_category ON popular_products_mv(category_id, category_rank);

-- ============================================
-- SELLER PERFORMANCE ANALYTICS
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS seller_analytics_mv AS
WITH seller_metrics AS (
    SELECT 
        p.id as seller_id,
        p.username,
        p.shop_name,
        p.avatar_url,
        p.seller_rating,
        p.created_at as member_since,
        -- Listing metrics
        COUNT(DISTINCT l.id) as total_listings,
        COUNT(DISTINCT l.id) FILTER (WHERE l.is_active = true) as active_listings,
        AVG(l.price) as avg_listing_price,
        -- Sales metrics
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT o.id) FILTER (WHERE o.created_at > now() - interval '30 days') as orders_last_30_days,
        COALESCE(SUM(o.total_amount), 0) as lifetime_revenue,
        COALESCE(SUM(o.total_amount) FILTER (WHERE o.created_at > now() - interval '30 days'), 0) as revenue_last_30_days,
        -- Customer metrics
        COUNT(DISTINCT o.buyer_id) as unique_customers,
        COUNT(DISTINCT o.buyer_id) FILTER (
            WHERE o.buyer_id IN (
                SELECT buyer_id FROM orders 
                WHERE seller_id = p.id 
                GROUP BY buyer_id 
                HAVING COUNT(*) > 1
            )
        ) as repeat_customers,
        -- Performance metrics
        AVG(EXTRACT(EPOCH FROM o.shipped_at - o.created_at) / 3600) as avg_fulfillment_hours,
        COUNT(DISTINCT r.id) FILTER (WHERE r.rating >= 4) as positive_reviews,
        COUNT(DISTINCT r.id) FILTER (WHERE r.rating <= 2) as negative_reviews,
        COUNT(DISTINCT d.id) as total_disputes,
        COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'resolved_seller_favor') as disputes_won,
        -- Response metrics
        AVG(EXTRACT(EPOCH FROM m.created_at - prev_m.created_at) / 3600) as avg_response_time_hours
    FROM profiles p
    LEFT JOIN listings l ON l.seller_id = p.id
    LEFT JOIN orders o ON o.seller_id = p.id 
        AND o.status IN ('completed', 'shipped', 'delivered')
    LEFT JOIN user_ratings r ON r.rated_user_id = p.id AND r.type = 'seller'
    LEFT JOIN disputes d ON d.order_id = o.id
    LEFT JOIN LATERAL (
        SELECT 
            m1.created_at,
            LAG(m2.created_at) OVER (PARTITION BY m1.conversation_id ORDER BY m1.created_at) as prev_created_at
        FROM messages m1
        JOIN messages m2 ON m2.conversation_id = m1.conversation_id
        WHERE m1.sender_id = p.id 
            AND m2.sender_id != p.id
            AND m1.created_at > m2.created_at
    ) m(created_at, prev_m_created_at) ON true
    WHERE p.is_seller = true
    GROUP BY p.id
),
seller_rankings AS (
    SELECT 
        *,
        -- Calculate seller score
        (
            (CASE WHEN total_orders > 0 THEN LOG(total_orders + 1) * 10 ELSE 0 END) +
            (CASE WHEN lifetime_revenue > 0 THEN LOG(lifetime_revenue + 1) ELSE 0 END) +
            (seller_rating * 20) +
            (CASE WHEN total_orders > 0 
                THEN (repeat_customers::numeric / unique_customers) * 50 
                ELSE 0 END) +
            (CASE WHEN (positive_reviews + negative_reviews) > 0
                THEN (positive_reviews::numeric / (positive_reviews + negative_reviews)) * 30
                ELSE 0 END)
        ) as seller_score,
        -- Performance tier
        CASE 
            WHEN total_orders >= 1000 AND seller_rating >= 4.5 THEN 'platinum'
            WHEN total_orders >= 500 AND seller_rating >= 4.0 THEN 'gold'
            WHEN total_orders >= 100 AND seller_rating >= 3.5 THEN 'silver'
            WHEN total_orders >= 10 THEN 'bronze'
            ELSE 'new'
        END as seller_tier
    FROM seller_metrics
)
SELECT 
    *,
    ROW_NUMBER() OVER (ORDER BY seller_score DESC) as overall_rank,
    ROW_NUMBER() OVER (ORDER BY revenue_last_30_days DESC) as monthly_revenue_rank,
    ROW_NUMBER() OVER (ORDER BY orders_last_30_days DESC) as monthly_orders_rank
FROM seller_rankings;

CREATE UNIQUE INDEX idx_seller_analytics_id ON seller_analytics_mv(seller_id);
CREATE INDEX idx_seller_analytics_score ON seller_analytics_mv(seller_score DESC);
CREATE INDEX idx_seller_analytics_tier ON seller_analytics_mv(seller_tier);

-- ============================================
-- CATEGORY PERFORMANCE
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS category_analytics_mv AS
SELECT 
    c.id as category_id,
    c.name as category_name,
    c.slug as category_slug,
    c.parent_id,
    -- Listing metrics
    COUNT(DISTINCT l.id) as total_listings,
    COUNT(DISTINCT l.id) FILTER (WHERE l.is_active = true) as active_listings,
    AVG(l.price) as avg_price,
    MIN(l.price) as min_price,
    MAX(l.price) as max_price,
    -- Sales metrics
    COUNT(DISTINCT oi.order_id) as total_orders,
    COALESCE(SUM(oi.quantity), 0) as total_items_sold,
    COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue,
    -- Seller diversity
    COUNT(DISTINCT l.seller_id) as unique_sellers,
    COUNT(DISTINCT o.buyer_id) as unique_buyers,
    -- Popularity metrics
    AVG(pm.view_count) as avg_views_per_listing,
    AVG(pm.favorite_count) as avg_favorites_per_listing,
    AVG(pm.avg_rating) as category_avg_rating,
    -- Time-based metrics
    COUNT(DISTINCT l.id) FILTER (WHERE l.created_at > now() - interval '7 days') as new_listings_last_week,
    COUNT(DISTINCT oi.order_id) FILTER (WHERE oi.created_at > now() - interval '30 days') as orders_last_month
FROM categories c
LEFT JOIN listings l ON l.category_id = c.id
LEFT JOIN order_items oi ON oi.listing_id = l.id
LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
LEFT JOIN popular_products_mv pm ON pm.id = l.id
WHERE c.is_active = true
GROUP BY c.id;

CREATE UNIQUE INDEX idx_category_analytics_id ON category_analytics_mv(category_id);
CREATE INDEX idx_category_analytics_revenue ON category_analytics_mv(total_revenue DESC);

-- ============================================
-- USER ENGAGEMENT ANALYTICS
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS user_engagement_mv AS
WITH user_activity AS (
    SELECT 
        p.id as user_id,
        p.username,
        p.created_at as joined_at,
        p.last_active_at,
        -- Purchase behavior
        COUNT(DISTINCT o.id) as total_purchases,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.created_at) as last_purchase_date,
        COUNT(DISTINCT o.id) FILTER (WHERE o.created_at > now() - interval '30 days') as purchases_last_30_days,
        -- Selling behavior (if seller)
        COUNT(DISTINCT l.id) as listings_created,
        COUNT(DISTINCT o2.id) as sales_made,
        -- Engagement metrics
        COUNT(DISTINCT f.listing_id) as items_favorited,
        COUNT(DISTINCT uf1.following_id) as users_following,
        COUNT(DISTINCT uf2.follower_id) as followers,
        COUNT(DISTINCT m.id) as messages_sent,
        COUNT(DISTINCT r.id) as reviews_written,
        -- Activity scoring
        EXTRACT(EPOCH FROM now() - p.last_active_at) / 86400 as days_since_active
    FROM profiles p
    LEFT JOIN orders o ON o.buyer_id = p.id AND o.status != 'cancelled'
    LEFT JOIN listings l ON l.seller_id = p.id
    LEFT JOIN orders o2 ON o2.seller_id = p.id AND o2.status != 'cancelled'
    LEFT JOIN favorites f ON f.user_id = p.id
    LEFT JOIN user_follows uf1 ON uf1.follower_id = p.id
    LEFT JOIN user_follows uf2 ON uf2.following_id = p.id
    LEFT JOIN messages m ON m.sender_id = p.id
    LEFT JOIN user_ratings r ON r.rater_user_id = p.id
    GROUP BY p.id
),
user_segments AS (
    SELECT 
        *,
        -- Engagement score
        (
            CASE 
                WHEN days_since_active <= 7 THEN 100
                WHEN days_since_active <= 30 THEN 50
                WHEN days_since_active <= 90 THEN 20
                ELSE 0
            END +
            LEAST(total_purchases * 10, 100) +
            LEAST(messages_sent * 2, 50) +
            LEAST(items_favorited * 3, 30) +
            LEAST(reviews_written * 5, 25)
        ) as engagement_score,
        -- User segment
        CASE 
            WHEN total_purchases = 0 AND listings_created = 0 THEN 'new_user'
            WHEN total_purchases >= 10 AND total_spent > 1000 THEN 'vip_buyer'
            WHEN sales_made >= 50 THEN 'power_seller'
            WHEN days_since_active > 90 THEN 'dormant'
            WHEN days_since_active <= 7 AND (total_purchases > 0 OR sales_made > 0) THEN 'active'
            ELSE 'casual'
        END as user_segment,
        -- Churn risk
        CASE
            WHEN days_since_active > 60 AND total_purchases > 0 THEN 'high'
            WHEN days_since_active > 30 AND purchases_last_30_days = 0 THEN 'medium'
            ELSE 'low'
        END as churn_risk
    FROM user_activity
)
SELECT * FROM user_segments;

CREATE UNIQUE INDEX idx_user_engagement_id ON user_engagement_mv(user_id);
CREATE INDEX idx_user_engagement_segment ON user_engagement_mv(user_segment);
CREATE INDEX idx_user_engagement_churn ON user_engagement_mv(churn_risk);

-- ============================================
-- REVENUE ANALYTICS
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS revenue_analytics_mv AS
WITH daily_revenue AS (
    SELECT 
        date_trunc('day', o.created_at) as revenue_date,
        COUNT(DISTINCT o.id) as order_count,
        COUNT(DISTINCT o.buyer_id) as unique_buyers,
        COUNT(DISTINCT o.seller_id) as unique_sellers,
        SUM(o.subtotal) as gross_revenue,
        SUM(o.platform_fee) as platform_revenue,
        SUM(o.subtotal - o.platform_fee) as seller_revenue,
        AVG(o.total_amount) as avg_order_value,
        -- Payment methods
        COUNT(DISTINCT o.id) FILTER (WHERE pt.payment_type = 'card') as card_payments,
        COUNT(DISTINCT o.id) FILTER (WHERE pt.payment_type = 'bank_transfer') as bank_transfers,
        COUNT(DISTINCT o.id) FILTER (WHERE pt.payment_type = 'wallet') as wallet_payments
    FROM orders o
    LEFT JOIN payment_transactions pt ON pt.order_id = o.id AND pt.status = 'completed'
    WHERE o.status IN ('completed', 'shipped', 'delivered')
        AND o.created_at >= now() - interval '365 days'
    GROUP BY date_trunc('day', o.created_at)
),
monthly_summary AS (
    SELECT 
        date_trunc('month', revenue_date) as month,
        SUM(order_count) as monthly_orders,
        SUM(gross_revenue) as monthly_gross_revenue,
        SUM(platform_revenue) as monthly_platform_revenue,
        AVG(avg_order_value) as monthly_avg_order_value,
        COUNT(DISTINCT revenue_date) as active_days
    FROM daily_revenue
    GROUP BY date_trunc('month', revenue_date)
)
SELECT 
    dr.*,
    ms.monthly_orders,
    ms.monthly_gross_revenue,
    ROUND((dr.gross_revenue / NULLIF(ms.monthly_gross_revenue, 0) * 100), 2) as percent_of_month,
    LAG(dr.gross_revenue, 7) OVER (ORDER BY dr.revenue_date) as revenue_week_ago,
    LAG(dr.gross_revenue, 30) OVER (ORDER BY dr.revenue_date) as revenue_month_ago
FROM daily_revenue dr
JOIN monthly_summary ms ON date_trunc('month', dr.revenue_date) = ms.month
ORDER BY dr.revenue_date DESC;

CREATE INDEX idx_revenue_analytics_date ON revenue_analytics_mv(revenue_date DESC);

-- ============================================
-- SEARCH ANALYTICS
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS search_analytics_mv AS
WITH search_terms AS (
    -- This would typically come from a search_logs table
    -- For now, we'll analyze listing titles for common terms
    SELECT 
        word,
        COUNT(*) as occurrence_count,
        COUNT(DISTINCT listing_id) as listing_count
    FROM (
        SELECT 
            l.id as listing_id,
            unnest(string_to_array(lower(
                regexp_replace(l.title, '[^a-zA-Z0-9\s]', '', 'g')
            ), ' ')) as word
        FROM listings l
        WHERE l.is_active = true
    ) words
    WHERE length(word) > 2  -- Skip short words
    GROUP BY word
    HAVING COUNT(*) > 5  -- Only common terms
)
SELECT 
    word as search_term,
    occurrence_count,
    listing_count,
    ROUND(listing_count::numeric / (SELECT COUNT(*) FROM listings WHERE is_active = true) * 100, 2) as coverage_percent
FROM search_terms
ORDER BY occurrence_count DESC
LIMIT 1000;

CREATE INDEX idx_search_analytics_term ON search_analytics_mv(search_term);
CREATE INDEX idx_search_analytics_count ON search_analytics_mv(occurrence_count DESC);

-- ============================================
-- ACHIEVEMENT PROGRESS
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS achievement_progress_mv AS
WITH achievement_stats AS (
    SELECT 
        ua.user_id,
        ua.achievement_type,
        ua.progress,
        ua.earned_at,
        p.username,
        -- Calculate how many users have this achievement
        COUNT(*) OVER (PARTITION BY ua.achievement_type) as total_users_with_achievement,
        -- Rank users by when they earned it
        ROW_NUMBER() OVER (PARTITION BY ua.achievement_type ORDER BY ua.earned_at) as earned_order
    FROM archive.user_achievements ua
    JOIN profiles p ON p.id = ua.user_id
    WHERE ua.progress = 100
),
achievement_summary AS (
    SELECT 
        achievement_type,
        COUNT(DISTINCT user_id) as users_completed,
        MIN(earned_at) as first_earned_at,
        MAX(earned_at) as last_earned_at,
        AVG(EXTRACT(EPOCH FROM earned_at - (SELECT MIN(created_at) FROM profiles WHERE id = user_id)) / 86400) as avg_days_to_earn
    FROM achievement_stats
    GROUP BY achievement_type
)
SELECT 
    a.*,
    ROUND((a.users_completed::numeric / (SELECT COUNT(*) FROM profiles) * 100), 2) as completion_rate,
    -- Rarity score (inverse of completion rate)
    CASE 
        WHEN a.users_completed <= 10 THEN 'legendary'
        WHEN a.users_completed <= 50 THEN 'epic'
        WHEN a.users_completed <= 200 THEN 'rare'
        WHEN a.users_completed <= 1000 THEN 'uncommon'
        ELSE 'common'
    END as rarity
FROM achievement_summary a;

CREATE INDEX idx_achievement_progress_type ON achievement_progress_mv(achievement_type);
CREATE INDEX idx_achievement_progress_rarity ON achievement_progress_mv(rarity);

-- ============================================
-- REFRESH FUNCTIONS
-- ============================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_time timestamp;
    v_end_time timestamp;
    v_results jsonb := '{}';
BEGIN
    -- Refresh in dependency order
    
    -- 1. Popular products (base view)
    v_start_time := clock_timestamp();
    REFRESH MATERIALIZED VIEW CONCURRENTLY popular_products_mv;
    v_end_time := clock_timestamp();
    v_results := v_results || jsonb_build_object('popular_products_mv', 
        jsonb_build_object(
            'duration_ms', EXTRACT(MILLISECONDS FROM v_end_time - v_start_time),
            'status', 'success'
        )
    );
    
    -- 2. Category analytics (depends on popular products)
    v_start_time := clock_timestamp();
    REFRESH MATERIALIZED VIEW CONCURRENTLY category_analytics_mv;
    v_end_time := clock_timestamp();
    v_results := v_results || jsonb_build_object('category_analytics_mv',
        jsonb_build_object(
            'duration_ms', EXTRACT(MILLISECONDS FROM v_end_time - v_start_time),
            'status', 'success'
        )
    );
    
    -- 3. Other independent views
    v_start_time := clock_timestamp();
    REFRESH MATERIALIZED VIEW CONCURRENTLY seller_analytics_mv;
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_engagement_mv;
    REFRESH MATERIALIZED VIEW CONCURRENTLY revenue_analytics_mv;
    REFRESH MATERIALIZED VIEW CONCURRENTLY search_analytics_mv;
    REFRESH MATERIALIZED VIEW CONCURRENTLY achievement_progress_mv;
    v_end_time := clock_timestamp();
    
    v_results := v_results || jsonb_build_object(
        'other_views', jsonb_build_object(
            'duration_ms', EXTRACT(MILLISECONDS FROM v_end_time - v_start_time),
            'status', 'success'
        ),
        'completed_at', now()
    );
    
    RETURN v_results;
END;
$$;

-- Schedule refresh (using pg_cron if available)
-- Refresh popular products every hour
-- SELECT cron.schedule('refresh-popular-products', '0 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY popular_products_mv;');

-- Refresh other views daily at 3 AM
-- SELECT cron.schedule('refresh-analytics-views', '0 3 * * *', 'SELECT refresh_all_materialized_views();');

-- ============================================
-- PERMISSIONS
-- ============================================

GRANT SELECT ON popular_products_mv TO authenticated, anon;
GRANT SELECT ON seller_analytics_mv TO authenticated;
GRANT SELECT ON category_analytics_mv TO authenticated, anon;
GRANT SELECT ON user_engagement_mv TO authenticated;
GRANT SELECT ON revenue_analytics_mv TO authenticated;
GRANT SELECT ON search_analytics_mv TO authenticated;
GRANT SELECT ON achievement_progress_mv TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_all_materialized_views() TO service_role;

-- Initial population
SELECT refresh_all_materialized_views();

-- Summary: These materialized views provide:
-- 1. Instant product popularity rankings
-- 2. Pre-computed seller performance metrics
-- 3. Category-level analytics
-- 4. User engagement segmentation
-- 5. Revenue trends and analysis
-- 6. Search term insights
-- 7. Achievement rarity and progress tracking