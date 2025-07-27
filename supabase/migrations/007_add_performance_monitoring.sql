-- Migration: Add Performance Monitoring and Analytics
-- Purpose: Track query performance, monitor database health, and provide insights
-- Date: 2025-07-19
-- Essential for maintaining optimal performance in production

-- ============================================
-- ENABLE REQUIRED EXTENSIONS
-- ============================================

-- Enable query statistics tracking
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Enable cronjob scheduling (if available)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- PERFORMANCE MONITORING TABLES
-- ============================================

-- Query performance tracking
CREATE TABLE IF NOT EXISTS public.query_performance_log (
    id serial PRIMARY KEY,
    query_hash text,
    query_text text,
    execution_time_ms numeric,
    rows_returned int,
    user_id uuid,
    endpoint text,
    created_at timestamptz DEFAULT now(),
    
    -- Indexes for analysis
    INDEX idx_perf_log_created_at (created_at DESC),
    INDEX idx_perf_log_execution_time (execution_time_ms DESC),
    INDEX idx_perf_log_user_id (user_id),
    INDEX idx_perf_log_query_hash (query_hash)
);

-- Database health metrics
CREATE TABLE IF NOT EXISTS public.database_health_metrics (
    id serial PRIMARY KEY,
    metric_name text NOT NULL,
    metric_value numeric,
    metric_data jsonb,
    recorded_at timestamptz DEFAULT now(),
    
    INDEX idx_health_metrics_name_time (metric_name, recorded_at DESC)
);

-- Slow query tracking
CREATE TABLE IF NOT EXISTS public.slow_queries (
    id serial PRIMARY KEY,
    query text,
    execution_time_ms numeric,
    calls bigint,
    mean_time_ms numeric,
    total_time_ms numeric,
    recorded_at timestamptz DEFAULT now(),
    
    INDEX idx_slow_queries_time (recorded_at DESC),
    INDEX idx_slow_queries_mean_time (mean_time_ms DESC)
);

-- ============================================
-- MONITORING FUNCTIONS
-- ============================================

-- Function to log slow queries
CREATE OR REPLACE FUNCTION log_slow_queries(p_threshold_ms numeric DEFAULT 100)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Clear old entries (keep 30 days)
    DELETE FROM slow_queries 
    WHERE recorded_at < now() - interval '30 days';
    
    -- Insert new slow queries
    INSERT INTO slow_queries (query, execution_time_ms, calls, mean_time_ms, total_time_ms)
    SELECT 
        query,
        mean_exec_time as execution_time_ms,
        calls,
        mean_exec_time as mean_time_ms,
        total_exec_time as total_time_ms
    FROM pg_stat_statements
    WHERE mean_exec_time > p_threshold_ms
        AND query NOT LIKE '%pg_%'  -- Exclude system queries
        AND query NOT LIKE '%slow_queries%'  -- Exclude this query
    ORDER BY mean_exec_time DESC
    LIMIT 100;
END;
$$;

-- Function to capture database health metrics
CREATE OR REPLACE FUNCTION capture_database_health()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_metrics jsonb;
BEGIN
    -- Database size
    INSERT INTO database_health_metrics (metric_name, metric_value, metric_data)
    SELECT 
        'database_size_mb',
        pg_database_size(current_database()) / 1024 / 1024,
        jsonb_build_object(
            'database', current_database(),
            'size_bytes', pg_database_size(current_database())
        );
    
    -- Connection count
    INSERT INTO database_health_metrics (metric_name, metric_value, metric_data)
    SELECT 
        'connection_count',
        count(*),
        jsonb_build_object(
            'active', count(*) FILTER (WHERE state = 'active'),
            'idle', count(*) FILTER (WHERE state = 'idle'),
            'idle_in_transaction', count(*) FILTER (WHERE state = 'idle in transaction')
        )
    FROM pg_stat_activity
    WHERE datname = current_database();
    
    -- Table bloat estimation
    INSERT INTO database_health_metrics (metric_name, metric_value, metric_data)
    SELECT 
        'table_bloat_percentage',
        AVG(CASE WHEN n_live_tup > 0 
            THEN (n_dead_tup::numeric / n_live_tup) * 100 
            ELSE 0 END),
        jsonb_agg(jsonb_build_object(
            'table', schemaname || '.' || tablename,
            'live_tuples', n_live_tup,
            'dead_tuples', n_dead_tup,
            'bloat_ratio', CASE WHEN n_live_tup > 0 
                THEN ROUND((n_dead_tup::numeric / n_live_tup) * 100, 2)
                ELSE 0 END
        ) ORDER BY n_dead_tup DESC)
    FROM pg_stat_user_tables
    WHERE n_dead_tup > 1000;  -- Only tables with significant dead tuples
    
    -- Index usage statistics
    INSERT INTO database_health_metrics (metric_name, metric_value, metric_data)
    SELECT 
        'index_hit_rate',
        CASE WHEN (sum(idx_blks_hit) + sum(idx_blks_read)) > 0
            THEN (sum(idx_blks_hit)::numeric / (sum(idx_blks_hit) + sum(idx_blks_read))) * 100
            ELSE 0 END,
        jsonb_build_object(
            'total_index_hits', sum(idx_blks_hit),
            'total_index_reads', sum(idx_blks_read)
        )
    FROM pg_statio_user_indexes;
    
    -- Cache hit rate
    INSERT INTO database_health_metrics (metric_name, metric_value, metric_data)
    SELECT 
        'cache_hit_rate',
        CASE WHEN (sum(heap_blks_hit) + sum(heap_blks_read)) > 0
            THEN (sum(heap_blks_hit)::numeric / (sum(heap_blks_hit) + sum(heap_blks_read))) * 100
            ELSE 0 END,
        jsonb_build_object(
            'heap_hits', sum(heap_blks_hit),
            'heap_reads', sum(heap_blks_read)
        )
    FROM pg_statio_user_tables;
    
    -- Clean old metrics (keep 90 days)
    DELETE FROM database_health_metrics
    WHERE recorded_at < now() - interval '90 days';
END;
$$;

-- ============================================
-- MONITORING VIEWS
-- ============================================

-- Real-time performance dashboard
CREATE OR REPLACE VIEW performance_dashboard AS
SELECT 
    'Active Queries' as metric,
    count(*) as value,
    string_agg(query, '; ') as details
FROM pg_stat_activity
WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%'
UNION ALL
SELECT 
    'Slow Queries (>100ms)',
    count(*),
    string_agg(substring(query, 1, 50) || '...', '; ')
FROM pg_stat_statements
WHERE mean_exec_time > 100
UNION ALL
SELECT 
    'Database Size (MB)',
    pg_database_size(current_database()) / 1024 / 1024,
    current_database()::text
UNION ALL
SELECT 
    'Cache Hit Rate %',
    ROUND(
        sum(heap_blks_hit)::numeric / 
        NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100
    ),
    'Last hour'
FROM pg_statio_user_tables;

-- Table size and bloat analysis
CREATE OR REPLACE VIEW table_analysis AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as indexes_size,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    CASE WHEN n_live_tup > 0 
        THEN ROUND((n_dead_tup::numeric / n_live_tup) * 100, 2)
        ELSE 0 
    END as bloat_percentage,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index effectiveness analysis
CREATE OR REPLACE VIEW index_effectiveness AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 10 THEN 'RARELY USED'
        WHEN idx_scan < 100 THEN 'OCCASIONALLY USED'
        WHEN idx_scan < 1000 THEN 'FREQUENTLY USED'
        ELSE 'HEAVILY USED'
    END as usage_category
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Query patterns analysis
CREATE OR REPLACE VIEW query_patterns AS
WITH query_stats AS (
    SELECT 
        substring(query from '^(\w+)') as query_type,
        count(*) as query_count,
        sum(calls) as total_calls,
        avg(mean_exec_time) as avg_time_ms,
        sum(total_exec_time) as total_time_ms
    FROM pg_stat_statements
    WHERE query NOT LIKE '%pg_%'
    GROUP BY substring(query from '^(\w+)')
)
SELECT 
    query_type,
    query_count as unique_queries,
    total_calls,
    ROUND(avg_time_ms::numeric, 2) as avg_time_ms,
    ROUND(total_time_ms::numeric / 1000, 2) as total_time_seconds,
    ROUND((total_time_ms / sum(total_time_ms) OVER ()) * 100, 2) as time_percentage
FROM query_stats
ORDER BY total_time_ms DESC;

-- ============================================
-- ALERTING FUNCTIONS
-- ============================================

-- Function to check for performance issues
CREATE OR REPLACE FUNCTION check_performance_alerts()
RETURNS TABLE(
    alert_level text,
    alert_type text,
    message text,
    details jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check cache hit rate
    RETURN QUERY
    SELECT 
        'WARNING'::text,
        'LOW_CACHE_HIT_RATE'::text,
        'Cache hit rate below 90%'::text,
        jsonb_build_object(
            'current_rate', ROUND(
                sum(heap_blks_hit)::numeric / 
                NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100, 2
            ),
            'threshold', 90
        )
    FROM pg_statio_user_tables
    HAVING sum(heap_blks_hit)::numeric / 
           NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100 < 90;
    
    -- Check for table bloat
    RETURN QUERY
    SELECT 
        'WARNING'::text,
        'HIGH_TABLE_BLOAT'::text,
        'Table ' || schemaname || '.' || tablename || ' has high bloat'::text,
        jsonb_build_object(
            'table', schemaname || '.' || tablename,
            'bloat_percentage', ROUND((n_dead_tup::numeric / n_live_tup) * 100, 2),
            'dead_tuples', n_dead_tup
        )
    FROM pg_stat_user_tables
    WHERE n_live_tup > 0 
        AND (n_dead_tup::numeric / n_live_tup) > 0.2  -- 20% bloat
        AND n_dead_tup > 10000;
    
    -- Check for long running queries
    RETURN QUERY
    SELECT 
        'CRITICAL'::text,
        'LONG_RUNNING_QUERY'::text,
        'Query running for over 5 minutes'::text,
        jsonb_build_object(
            'pid', pid,
            'duration', now() - query_start,
            'query', substring(query, 1, 100),
            'state', state
        )
    FROM pg_stat_activity
    WHERE state = 'active'
        AND now() - query_start > interval '5 minutes'
        AND query NOT LIKE '%pg_stat_activity%';
    
    -- Check connection count
    RETURN QUERY
    SELECT 
        'WARNING'::text,
        'HIGH_CONNECTION_COUNT'::text,
        'Connection count approaching limit'::text,
        jsonb_build_object(
            'current_connections', count(*),
            'max_connections', setting::int
        )
    FROM pg_stat_activity, pg_settings
    WHERE pg_settings.name = 'max_connections'
    GROUP BY setting
    HAVING count(*) > setting::int * 0.8;  -- 80% of max
END;
$$;

-- ============================================
-- AUTOMATED MAINTENANCE
-- ============================================

-- Function to perform routine maintenance
CREATE OR REPLACE FUNCTION perform_routine_maintenance()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_results jsonb := '{}';
    v_table record;
BEGIN
    -- Update table statistics for query planner
    FOR v_table IN 
        SELECT schemaname, tablename 
        FROM pg_stat_user_tables 
        WHERE last_analyze < now() - interval '7 days'
            OR last_analyze IS NULL
    LOOP
        EXECUTE format('ANALYZE %I.%I', v_table.schemaname, v_table.tablename);
        v_results := v_results || jsonb_build_object(
            v_table.schemaname || '.' || v_table.tablename, 'analyzed'
        );
    END LOOP;
    
    -- Log current performance metrics
    PERFORM capture_database_health();
    PERFORM log_slow_queries();
    
    -- Clean up old notifications
    DELETE FROM notifications
    WHERE created_at < now() - interval '90 days'
        AND (read = true OR expires_at < now());
    
    -- Clean up expired sessions
    DELETE FROM auth_sessions
    WHERE expires_at < now() - interval '7 days';
    
    -- Clean up old cart items
    DELETE FROM cart_items
    WHERE created_at < now() - interval '30 days'
        AND cart_id IN (
            SELECT id FROM shopping_carts 
            WHERE expires_at < now()
        );
    
    v_results := v_results || jsonb_build_object(
        'maintenance_completed_at', now(),
        'next_run', now() + interval '1 day'
    );
    
    RETURN v_results;
END;
$$;

-- ============================================
-- QUERY OPTIMIZATION HELPERS
-- ============================================

-- Function to suggest indexes for slow queries
CREATE OR REPLACE FUNCTION suggest_missing_indexes()
RETURNS TABLE(
    table_name text,
    suggested_index text,
    reason text,
    estimated_improvement text
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Foreign keys without indexes
    RETURN QUERY
    SELECT 
        conrelid::regclass::text,
        format('CREATE INDEX idx_%s_%s ON %s(%s);',
            conrelid::regclass::text,
            array_to_string(col_array, '_'),
            conrelid::regclass,
            array_to_string(col_array, ', ')
        ),
        'Missing index on foreign key',
        'High - Improves JOIN performance'
    FROM (
        SELECT 
            conrelid,
            array_agg(attname ORDER BY attnum) as col_array
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
        WHERE c.contype = 'f'
        GROUP BY conrelid, conkey
    ) fk
    WHERE NOT EXISTS (
        SELECT 1 FROM pg_index i
        WHERE i.indrelid = fk.conrelid
        AND i.indkey::int[] @> (
            SELECT array_agg(attnum)
            FROM pg_attribute
            WHERE attrelid = fk.conrelid
            AND attname = ANY(fk.col_array)
        )
    );
    
    -- High sequential scan tables
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename,
        'Analyze query patterns to determine optimal index',
        format('Table has %s sequential scans vs %s index scans', seq_scan, idx_scan),
        'Medium - May improve query performance'
    FROM pg_stat_user_tables
    WHERE seq_scan > 1000
        AND seq_scan > idx_scan * 2
        AND n_live_tup > 10000;
END;
$$;

-- ============================================
-- SCHEDULED JOBS (Using pg_cron if available)
-- ============================================

-- Schedule routine maintenance (requires pg_cron)
-- SELECT cron.schedule('routine-maintenance', '0 3 * * *', 'SELECT perform_routine_maintenance();');
-- SELECT cron.schedule('capture-health-metrics', '*/15 * * * *', 'SELECT capture_database_health();');
-- SELECT cron.schedule('log-slow-queries', '*/5 * * * *', 'SELECT log_slow_queries();');

-- ============================================
-- PERMISSIONS
-- ============================================

-- Grant necessary permissions
GRANT SELECT ON performance_dashboard TO authenticated;
GRANT SELECT ON table_analysis TO authenticated;
GRANT SELECT ON index_effectiveness TO authenticated;
GRANT SELECT ON query_patterns TO authenticated;
GRANT EXECUTE ON FUNCTION check_performance_alerts() TO authenticated;
GRANT EXECUTE ON FUNCTION suggest_missing_indexes() TO authenticated;

-- ============================================
-- INITIAL DATA CAPTURE
-- ============================================

-- Capture initial metrics
SELECT capture_database_health();
SELECT log_slow_queries();

-- Summary: This migration provides:
-- 1. Query performance tracking
-- 2. Database health monitoring
-- 3. Automated maintenance routines
-- 4. Performance alerting
-- 5. Index optimization suggestions
-- 6. Real-time performance dashboards