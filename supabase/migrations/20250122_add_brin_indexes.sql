-- Add BRIN (Block Range INdex) indexes for time-series data
-- BRIN indexes are ~10x smaller than B-tree indexes and perfect for monotonically increasing columns

-- Drop existing B-tree indexes on created_at/updated_at if they exist
-- (We'll keep foreign key indexes as B-tree)

-- Profiles table
DROP INDEX IF EXISTS idx_profiles_created_at;
CREATE INDEX idx_profiles_created_at_brin ON profiles USING brin(created_at);

-- Listings table
DROP INDEX IF EXISTS idx_listings_created_at;
DROP INDEX IF EXISTS idx_listings_updated_at;
CREATE INDEX idx_listings_created_at_brin ON listings USING brin(created_at);
CREATE INDEX idx_listings_updated_at_brin ON listings USING brin(updated_at);

-- Orders table
DROP INDEX IF EXISTS idx_orders_created_at;
DROP INDEX IF EXISTS idx_orders_updated_at;
CREATE INDEX idx_orders_created_at_brin ON orders USING brin(created_at);
CREATE INDEX idx_orders_updated_at_brin ON orders USING brin(updated_at);

-- Messages table (high volume, perfect for BRIN)
DROP INDEX IF EXISTS idx_messages_created_at;
CREATE INDEX idx_messages_created_at_brin ON messages USING brin(created_at);

-- Notifications table
DROP INDEX IF EXISTS idx_notifications_created_at;
CREATE INDEX idx_notifications_created_at_brin ON notifications USING brin(created_at);

-- User ratings table
DROP INDEX IF EXISTS idx_user_ratings_created_at;
CREATE INDEX idx_user_ratings_created_at_brin ON user_ratings USING brin(created_at);

-- Transactions table
DROP INDEX IF EXISTS idx_transactions_created_at;
CREATE INDEX idx_transactions_created_at_brin ON transactions USING brin(created_at);

-- Activity logs table
DROP INDEX IF EXISTS idx_activity_logs_created_at;
CREATE INDEX idx_activity_logs_created_at_brin ON activity_logs USING brin(created_at);

-- Disputes table
DROP INDEX IF EXISTS idx_disputes_created_at;
CREATE INDEX idx_disputes_created_at_brin ON disputes USING brin(created_at);

-- Dispute history table
DROP INDEX IF EXISTS idx_dispute_history_created_at;
CREATE INDEX idx_dispute_history_created_at_brin ON dispute_history USING brin(created_at);

-- Seller payouts table
DROP INDEX IF EXISTS idx_seller_payouts_created_at;
CREATE INDEX idx_seller_payouts_created_at_brin ON seller_payouts USING brin(created_at);

-- Shopping carts table
DROP INDEX IF EXISTS idx_shopping_carts_created_at;
DROP INDEX IF EXISTS idx_shopping_carts_updated_at;
CREATE INDEX idx_shopping_carts_created_at_brin ON shopping_carts USING brin(created_at);
CREATE INDEX idx_shopping_carts_updated_at_brin ON shopping_carts USING brin(updated_at);

-- Create a function to analyze BRIN index effectiveness
CREATE OR REPLACE FUNCTION analyze_brin_effectiveness()
RETURNS TABLE (
  table_name text,
  index_name text,
  index_size text,
  estimated_btree_size text,
  space_saved_percent numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH brin_indexes AS (
    SELECT 
      schemaname,
      tablename,
      indexname,
      pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
      pg_relation_size(indexrelid) as index_size_bytes,
      pg_relation_size(tablename::regclass) as table_size_bytes
    FROM pg_indexes
    JOIN pg_class ON pg_class.relname = indexname
    WHERE schemaname = 'public' 
    AND indexdef LIKE '%USING brin%'
  )
  SELECT 
    tablename as table_name,
    indexname as index_name,
    index_size,
    pg_size_pretty((table_size_bytes * 0.15)::bigint) as estimated_btree_size,
    ROUND(100 - (index_size_bytes::numeric / (table_size_bytes * 0.15) * 100), 2) as space_saved_percent
  FROM brin_indexes
  ORDER BY space_saved_percent DESC;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION analyze_brin_effectiveness TO authenticated;

COMMENT ON FUNCTION analyze_brin_effectiveness IS 'Analyzes the space savings from using BRIN indexes compared to estimated B-tree size';