-- Create RPC function for brand sales statistics
CREATE OR REPLACE FUNCTION get_brand_sales_stats(
    user_id_param UUID,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() - INTERVAL '30 days')
)
RETURNS TABLE (
    total_sales BIGINT,
    total_revenue NUMERIC,
    avg_order_value NUMERIC,
    total_orders BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT o.id)::BIGINT AS total_sales,
        COALESCE(SUM(o.total_amount), 0)::NUMERIC AS total_revenue,
        CASE 
            WHEN COUNT(DISTINCT o.id) > 0 
            THEN (SUM(o.total_amount) / COUNT(DISTINCT o.id))::NUMERIC
            ELSE 0::NUMERIC
        END AS avg_order_value,
        COUNT(DISTINCT o.id)::BIGINT AS total_orders
    FROM orders o
    WHERE o.seller_id = user_id_param
    AND o.created_at >= start_date
    AND o.status NOT IN ('cancelled', 'refunded');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get brand statistics
CREATE OR REPLACE FUNCTION get_brand_statistics(brand_user_id UUID)
RETURNS TABLE (
    total_listings BIGINT,
    active_listings BIGINT,
    total_sales BIGINT,
    total_reviews BIGINT,
    avg_rating NUMERIC,
    total_views BIGINT,
    total_favorites BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT l.id)::BIGINT AS total_listings,
        COUNT(DISTINCT CASE WHEN l.status = 'active' THEN l.id END)::BIGINT AS active_listings,
        COUNT(DISTINCT o.id)::BIGINT AS total_sales,
        COUNT(DISTINCT r.id)::BIGINT AS total_reviews,
        COALESCE(AVG(r.rating), 0)::NUMERIC AS avg_rating,
        COALESCE(SUM(l.views), 0)::BIGINT AS total_views,
        COALESCE(SUM(l.favorites_count), 0)::BIGINT AS total_favorites
    FROM profiles p
    LEFT JOIN listings l ON l.user_id = p.id
    LEFT JOIN orders o ON o.seller_id = p.id AND o.status = 'delivered'
    LEFT JOIN reviews r ON r.seller_id = p.id
    WHERE p.id = brand_user_id
    GROUP BY p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_brand_sales_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_brand_statistics TO authenticated;