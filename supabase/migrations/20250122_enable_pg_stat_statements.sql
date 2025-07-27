-- Enable pg_stat_statements extension for query performance monitoring
-- This extension tracks execution statistics of all SQL statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create a function to get the top slow queries (accessible via Supabase dashboard)
CREATE OR REPLACE FUNCTION get_slow_queries(
  p_limit integer DEFAULT 20,
  p_min_calls integer DEFAULT 10
)
RETURNS TABLE (
  query text,
  calls bigint,
  total_time double precision,
  mean_time double precision,
  min_time double precision,
  max_time double precision,
  stddev_time double precision,
  rows bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT 
    query::text,
    calls,
    total_exec_time as total_time,
    mean_exec_time as mean_time,
    min_exec_time as min_time,
    max_exec_time as max_time,
    stddev_exec_time as stddev_time,
    rows
  FROM pg_stat_statements
  WHERE 
    query NOT LIKE '%pg_stat_statements%'
    AND calls >= p_min_calls
  ORDER BY mean_exec_time DESC
  LIMIT p_limit;
$$;

-- Grant execute permission to authenticated users (for dashboard access)
GRANT EXECUTE ON FUNCTION get_slow_queries TO authenticated;

-- Create a view for cache hit rates
CREATE OR REPLACE VIEW cache_performance AS
SELECT 
  'index hit rate' as metric,
  ROUND((sum(idx_blks_hit)::numeric / nullif(sum(idx_blks_hit + idx_blks_read), 0) * 100), 2) as percentage
FROM pg_statio_user_indexes
UNION ALL
SELECT 
  'table hit rate' as metric,
  ROUND((sum(heap_blks_hit)::numeric / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100), 2) as percentage
FROM pg_statio_user_tables;

-- Grant select permission on the view
GRANT SELECT ON cache_performance TO authenticated;

COMMENT ON EXTENSION pg_stat_statements IS 'Track execution statistics of SQL statements';
COMMENT ON FUNCTION get_slow_queries IS 'Returns the slowest queries based on mean execution time';
COMMENT ON VIEW cache_performance IS 'Shows database cache hit rates for monitoring';