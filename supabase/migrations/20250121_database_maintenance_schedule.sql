-- Database Maintenance Schedule for VACUUM/ANALYZE Operations
-- This migration creates functions and monitoring for automated database maintenance

-- Create a schema for maintenance functions
CREATE SCHEMA IF NOT EXISTS maintenance;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA maintenance TO authenticated;

-- Create table to track maintenance operations
CREATE TABLE IF NOT EXISTS maintenance.operation_log (
    id BIGSERIAL PRIMARY KEY,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('VACUUM', 'VACUUM FULL', 'VACUUM ANALYZE', 'ANALYZE', 'REINDEX')),
    table_name TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms BIGINT GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000
    ) STORED,
    table_size_before BIGINT,
    table_size_after BIGINT,
    space_saved_bytes BIGINT GENERATED ALWAYS AS (
        CASE 
            WHEN table_size_before IS NOT NULL AND table_size_after IS NOT NULL 
            THEN table_size_before - table_size_after
            ELSE NULL
        END
    ) STORED,
    dead_tuples_before BIGINT,
    dead_tuples_after BIGINT,
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Create index for performance
CREATE INDEX idx_maintenance_log_started_at ON maintenance.operation_log(started_at DESC);
CREATE INDEX idx_maintenance_log_table_operation ON maintenance.operation_log(table_name, operation_type);

-- Enable RLS
ALTER TABLE maintenance.operation_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (only admins can view)
CREATE POLICY "Admins can view maintenance logs" ON maintenance.operation_log
    FOR SELECT
    TO authenticated
    USING (auth.jwt()->>'email' LIKE '%@admin.%' OR auth.jwt()->>'role' = 'service_role');

-- Create table to track table bloat and maintenance needs
CREATE TABLE IF NOT EXISTS maintenance.table_health (
    id BIGSERIAL PRIMARY KEY,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    schema_name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    table_size BIGINT,
    table_size_pretty TEXT,
    index_size BIGINT,
    index_size_pretty TEXT,
    total_size BIGINT,
    total_size_pretty TEXT,
    live_tuples BIGINT,
    dead_tuples BIGINT,
    bloat_ratio NUMERIC(5,2),
    last_vacuum TIMESTAMPTZ,
    last_autovacuum TIMESTAMPTZ,
    last_analyze TIMESTAMPTZ,
    last_autoanalyze TIMESTAMPTZ,
    vacuum_needed BOOLEAN DEFAULT FALSE,
    analyze_needed BOOLEAN DEFAULT FALSE,
    maintenance_priority TEXT CHECK (maintenance_priority IN ('critical', 'high', 'medium', 'low')),
    recommendations JSONB DEFAULT '[]'::JSONB
);

-- Create indexes
CREATE INDEX idx_table_health_checked_at ON maintenance.table_health(checked_at DESC);
CREATE INDEX idx_table_health_priority ON maintenance.table_health(maintenance_priority) WHERE maintenance_priority IS NOT NULL;
CREATE INDEX idx_table_health_needs_maintenance ON maintenance.table_health(vacuum_needed, analyze_needed) WHERE vacuum_needed = TRUE OR analyze_needed = TRUE;

-- Enable RLS
ALTER TABLE maintenance.table_health ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Admins can view table health" ON maintenance.table_health
    FOR SELECT
    TO authenticated
    USING (auth.jwt()->>'email' LIKE '%@admin.%' OR auth.jwt()->>'role' = 'service_role');

-- Function to check table health and bloat
CREATE OR REPLACE FUNCTION maintenance.check_table_health(
    p_schema_name TEXT DEFAULT 'public'
)
RETURNS TABLE (
    schema_name TEXT,
    table_name TEXT,
    table_size BIGINT,
    table_size_pretty TEXT,
    index_size BIGINT,
    index_size_pretty TEXT,
    total_size BIGINT,
    total_size_pretty TEXT,
    live_tuples BIGINT,
    dead_tuples BIGINT,
    bloat_ratio NUMERIC,
    last_vacuum TIMESTAMPTZ,
    last_autovacuum TIMESTAMPTZ,
    last_analyze TIMESTAMPTZ,
    last_autoanalyze TIMESTAMPTZ,
    vacuum_needed BOOLEAN,
    analyze_needed BOOLEAN,
    maintenance_priority TEXT,
    recommendations JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = maintenance, pg_catalog, public
AS $$
DECLARE
    v_recommendations JSONB;
    v_vacuum_needed BOOLEAN;
    v_analyze_needed BOOLEAN;
    v_priority TEXT;
    v_bloat_ratio NUMERIC;
BEGIN
    -- Create temporary table for results
    CREATE TEMP TABLE IF NOT EXISTS temp_table_health AS
    SELECT 
        n.nspname AS schema_name,
        c.relname AS table_name,
        pg_table_size(c.oid) AS table_size,
        pg_size_pretty(pg_table_size(c.oid)) AS table_size_pretty,
        pg_indexes_size(c.oid) AS index_size,
        pg_size_pretty(pg_indexes_size(c.oid)) AS index_size_pretty,
        pg_total_relation_size(c.oid) AS total_size,
        pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size_pretty,
        pg_stat_get_live_tuples(c.oid) AS live_tuples,
        pg_stat_get_dead_tuples(c.oid) AS dead_tuples,
        CASE 
            WHEN pg_stat_get_live_tuples(c.oid) > 0 
            THEN ROUND((pg_stat_get_dead_tuples(c.oid)::NUMERIC / pg_stat_get_live_tuples(c.oid)) * 100, 2)
            ELSE 0
        END AS bloat_ratio,
        pg_stat_get_last_vacuum_time(c.oid) AS last_vacuum,
        pg_stat_get_last_autovacuum_time(c.oid) AS last_autovacuum,
        pg_stat_get_last_analyze_time(c.oid) AS last_analyze,
        pg_stat_get_last_autoanalyze_time(c.oid) AS last_autoanalyze
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'  -- Only regular tables
    AND n.nspname = p_schema_name
    AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    AND c.relname NOT LIKE 'pg_%';

    -- Analyze each table and determine maintenance needs
    FOR schema_name, table_name, table_size, table_size_pretty, index_size, index_size_pretty,
        total_size, total_size_pretty, live_tuples, dead_tuples, bloat_ratio,
        last_vacuum, last_autovacuum, last_analyze, last_autoanalyze
    IN SELECT * FROM temp_table_health
    LOOP
        v_recommendations := '[]'::JSONB;
        v_vacuum_needed := FALSE;
        v_analyze_needed := FALSE;
        v_bloat_ratio := bloat_ratio;
        
        -- Check if VACUUM is needed
        IF v_bloat_ratio > 20 THEN
            v_vacuum_needed := TRUE;
            v_recommendations := v_recommendations || jsonb_build_object(
                'type', 'VACUUM',
                'reason', format('High bloat ratio: %s%%', v_bloat_ratio),
                'urgency', 'high'
            );
        ELSIF v_bloat_ratio > 10 THEN
            v_vacuum_needed := TRUE;
            v_recommendations := v_recommendations || jsonb_build_object(
                'type', 'VACUUM',
                'reason', format('Moderate bloat ratio: %s%%', v_bloat_ratio),
                'urgency', 'medium'
            );
        END IF;

        -- Check if VACUUM FULL is needed (extreme bloat)
        IF v_bloat_ratio > 50 AND table_size > 1024 * 1024 * 100 THEN -- 100MB
            v_recommendations := v_recommendations || jsonb_build_object(
                'type', 'VACUUM FULL',
                'reason', format('Extreme bloat ratio: %s%% on large table', v_bloat_ratio),
                'urgency', 'critical'
            );
        END IF;

        -- Check if ANALYZE is needed
        IF last_analyze IS NULL OR last_analyze < NOW() - INTERVAL '7 days' THEN
            v_analyze_needed := TRUE;
            v_recommendations := v_recommendations || jsonb_build_object(
                'type', 'ANALYZE',
                'reason', 'Statistics older than 7 days',
                'urgency', 'medium'
            );
        END IF;

        -- Check for tables that haven't been vacuumed in a long time
        IF last_vacuum IS NULL AND last_autovacuum IS NULL THEN
            v_vacuum_needed := TRUE;
            v_recommendations := v_recommendations || jsonb_build_object(
                'type', 'VACUUM ANALYZE',
                'reason', 'Never vacuumed',
                'urgency', 'high'
            );
        ELSIF COALESCE(last_vacuum, last_autovacuum) < NOW() - INTERVAL '30 days' THEN
            v_vacuum_needed := TRUE;
            v_recommendations := v_recommendations || jsonb_build_object(
                'type', 'VACUUM',
                'reason', 'Not vacuumed in 30+ days',
                'urgency', 'medium'
            );
        END IF;

        -- Determine priority
        IF v_bloat_ratio > 50 OR (v_vacuum_needed AND table_size > 1024 * 1024 * 1000) THEN
            v_priority := 'critical';
        ELSIF v_bloat_ratio > 20 OR (v_vacuum_needed AND table_size > 1024 * 1024 * 100) THEN
            v_priority := 'high';
        ELSIF v_vacuum_needed OR v_analyze_needed THEN
            v_priority := 'medium';
        ELSE
            v_priority := 'low';
        END IF;

        -- Insert into maintenance.table_health
        INSERT INTO maintenance.table_health (
            schema_name, table_name, table_size, table_size_pretty,
            index_size, index_size_pretty, total_size, total_size_pretty,
            live_tuples, dead_tuples, bloat_ratio,
            last_vacuum, last_autovacuum, last_analyze, last_autoanalyze,
            vacuum_needed, analyze_needed, maintenance_priority, recommendations
        ) VALUES (
            schema_name, table_name, table_size, table_size_pretty,
            index_size, index_size_pretty, total_size, total_size_pretty,
            live_tuples, dead_tuples, v_bloat_ratio,
            last_vacuum, last_autovacuum, last_analyze, last_autoanalyze,
            v_vacuum_needed, v_analyze_needed, v_priority, v_recommendations
        );

        -- Return the row
        RETURN QUERY SELECT 
            schema_name, table_name, table_size, table_size_pretty,
            index_size, index_size_pretty, total_size, total_size_pretty,
            live_tuples, dead_tuples, v_bloat_ratio,
            last_vacuum, last_autovacuum, last_analyze, last_autoanalyze,
            v_vacuum_needed, v_analyze_needed, v_priority, v_recommendations;
    END LOOP;

    -- Clean up
    DROP TABLE IF EXISTS temp_table_health;
END;
$$;

-- Function to perform maintenance on a specific table
CREATE OR REPLACE FUNCTION maintenance.perform_maintenance(
    p_schema_name TEXT,
    p_table_name TEXT,
    p_operation TEXT DEFAULT 'VACUUM ANALYZE',
    p_log_operation BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    success BOOLEAN,
    duration_ms BIGINT,
    space_saved_bytes BIGINT,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = maintenance, pg_catalog, public
AS $$
DECLARE
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
    v_size_before BIGINT;
    v_size_after BIGINT;
    v_dead_tuples_before BIGINT;
    v_dead_tuples_after BIGINT;
    v_log_id BIGINT;
    v_full_table_name TEXT;
    v_success BOOLEAN := FALSE;
    v_error_message TEXT;
BEGIN
    -- Validate operation
    IF p_operation NOT IN ('VACUUM', 'VACUUM FULL', 'VACUUM ANALYZE', 'ANALYZE', 'REINDEX') THEN
        RETURN QUERY SELECT FALSE, 0::BIGINT, 0::BIGINT, 'Invalid operation type';
        RETURN;
    END IF;

    -- Build full table name
    v_full_table_name := quote_ident(p_schema_name) || '.' || quote_ident(p_table_name);

    -- Get initial metrics
    v_start_time := NOW();
    
    SELECT 
        pg_total_relation_size(c.oid),
        pg_stat_get_dead_tuples(c.oid)
    INTO v_size_before, v_dead_tuples_before
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = p_schema_name
    AND c.relname = p_table_name;

    -- Log the start if requested
    IF p_log_operation THEN
        INSERT INTO maintenance.operation_log (
            operation_type, table_name, started_at,
            table_size_before, dead_tuples_before
        ) VALUES (
            p_operation, v_full_table_name, v_start_time,
            v_size_before, v_dead_tuples_before
        ) RETURNING id INTO v_log_id;
    END IF;

    -- Perform the operation
    BEGIN
        CASE p_operation
            WHEN 'VACUUM' THEN
                EXECUTE 'VACUUM ' || v_full_table_name;
            WHEN 'VACUUM FULL' THEN
                EXECUTE 'VACUUM FULL ' || v_full_table_name;
            WHEN 'VACUUM ANALYZE' THEN
                EXECUTE 'VACUUM ANALYZE ' || v_full_table_name;
            WHEN 'ANALYZE' THEN
                EXECUTE 'ANALYZE ' || v_full_table_name;
            WHEN 'REINDEX' THEN
                EXECUTE 'REINDEX TABLE ' || v_full_table_name;
        END CASE;
        
        v_success := TRUE;
    EXCEPTION WHEN OTHERS THEN
        v_success := FALSE;
        v_error_message := SQLERRM;
    END;

    -- Get final metrics
    v_end_time := NOW();
    
    SELECT 
        pg_total_relation_size(c.oid),
        pg_stat_get_dead_tuples(c.oid)
    INTO v_size_after, v_dead_tuples_after
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = p_schema_name
    AND c.relname = p_table_name;

    -- Update log if requested
    IF p_log_operation AND v_log_id IS NOT NULL THEN
        UPDATE maintenance.operation_log
        SET 
            completed_at = v_end_time,
            table_size_after = v_size_after,
            dead_tuples_after = v_dead_tuples_after,
            success = v_success,
            error_message = v_error_message
        WHERE id = v_log_id;
    END IF;

    -- Return results
    RETURN QUERY SELECT 
        v_success,
        EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000,
        CASE 
            WHEN v_size_before > v_size_after 
            THEN v_size_before - v_size_after
            ELSE 0
        END,
        CASE 
            WHEN v_success 
            THEN format('%s completed successfully on %s', p_operation, v_full_table_name)
            ELSE format('%s failed on %s: %s', p_operation, v_full_table_name, v_error_message)
        END;
END;
$$;

-- Function to run automated maintenance based on table health
CREATE OR REPLACE FUNCTION maintenance.run_automated_maintenance(
    p_priority_threshold TEXT DEFAULT 'medium',
    p_max_tables INT DEFAULT 5,
    p_dry_run BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    table_name TEXT,
    operation TEXT,
    priority TEXT,
    reason TEXT,
    executed BOOLEAN,
    result TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = maintenance, pg_catalog, public
AS $$
DECLARE
    v_table RECORD;
    v_operation TEXT;
    v_reason TEXT;
    v_result RECORD;
    v_priority_order INT;
BEGIN
    -- Map priority to numeric value for comparison
    v_priority_order := CASE p_priority_threshold
        WHEN 'critical' THEN 4
        WHEN 'high' THEN 3
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 1
        ELSE 2
    END;

    -- First, check table health
    PERFORM maintenance.check_table_health('public');

    -- Process tables needing maintenance
    FOR v_table IN 
        SELECT 
            th.schema_name,
            th.table_name,
            th.maintenance_priority,
            th.vacuum_needed,
            th.analyze_needed,
            th.bloat_ratio,
            th.recommendations,
            th.table_size
        FROM maintenance.table_health th
        WHERE th.checked_at > NOW() - INTERVAL '1 hour'
        AND (th.vacuum_needed = TRUE OR th.analyze_needed = TRUE)
        AND CASE th.maintenance_priority
            WHEN 'critical' THEN 4
            WHEN 'high' THEN 3
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 1
            ELSE 0
        END >= v_priority_order
        ORDER BY 
            CASE th.maintenance_priority
                WHEN 'critical' THEN 4
                WHEN 'high' THEN 3
                WHEN 'medium' THEN 2
                WHEN 'low' THEN 1
                ELSE 0
            END DESC,
            th.bloat_ratio DESC NULLS LAST
        LIMIT p_max_tables
    LOOP
        -- Determine operation based on needs
        IF v_table.bloat_ratio > 50 AND v_table.table_size > 1024 * 1024 * 100 THEN
            v_operation := 'VACUUM FULL';
            v_reason := format('Extreme bloat: %s%%', v_table.bloat_ratio);
        ELSIF v_table.vacuum_needed AND v_table.analyze_needed THEN
            v_operation := 'VACUUM ANALYZE';
            v_reason := 'Both vacuum and analyze needed';
        ELSIF v_table.vacuum_needed THEN
            v_operation := 'VACUUM';
            v_reason := format('Bloat ratio: %s%%', v_table.bloat_ratio);
        ELSE
            v_operation := 'ANALYZE';
            v_reason := 'Statistics update needed';
        END IF;

        -- Execute or report
        IF p_dry_run THEN
            RETURN QUERY SELECT
                v_table.schema_name || '.' || v_table.table_name,
                v_operation,
                v_table.maintenance_priority,
                v_reason,
                FALSE,
                'Dry run - not executed';
        ELSE
            -- Execute maintenance
            SELECT * INTO v_result
            FROM maintenance.perform_maintenance(
                v_table.schema_name,
                v_table.table_name,
                v_operation,
                TRUE
            );

            RETURN QUERY SELECT
                v_table.schema_name || '.' || v_table.table_name,
                v_operation,
                v_table.maintenance_priority,
                v_reason,
                TRUE,
                v_result.message;
        END IF;
    END LOOP;
END;
$$;

-- Function to get maintenance history and statistics
CREATE OR REPLACE FUNCTION maintenance.get_maintenance_stats(
    p_days_back INT DEFAULT 30
)
RETURNS TABLE (
    table_name TEXT,
    total_operations INT,
    successful_operations INT,
    failed_operations INT,
    avg_duration_ms NUMERIC,
    total_space_saved BIGINT,
    total_space_saved_pretty TEXT,
    last_vacuum TIMESTAMPTZ,
    last_analyze TIMESTAMPTZ,
    most_recent_operation TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = maintenance, pg_catalog, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ol.table_name,
        COUNT(*)::INT AS total_operations,
        COUNT(*) FILTER (WHERE ol.success = TRUE)::INT AS successful_operations,
        COUNT(*) FILTER (WHERE ol.success = FALSE)::INT AS failed_operations,
        ROUND(AVG(ol.duration_ms), 2) AS avg_duration_ms,
        COALESCE(SUM(ol.space_saved_bytes), 0) AS total_space_saved,
        pg_size_pretty(COALESCE(SUM(ol.space_saved_bytes), 0)) AS total_space_saved_pretty,
        MAX(ol.completed_at) FILTER (WHERE ol.operation_type LIKE '%VACUUM%') AS last_vacuum,
        MAX(ol.completed_at) FILTER (WHERE ol.operation_type LIKE '%ANALYZE%') AS last_analyze,
        MAX(ol.completed_at) AS most_recent_operation
    FROM maintenance.operation_log ol
    WHERE ol.started_at > NOW() - (p_days_back || ' days')::INTERVAL
    GROUP BY ol.table_name
    ORDER BY COUNT(*) DESC, ol.table_name;
END;
$$;

-- Create a view for current maintenance recommendations
CREATE OR REPLACE VIEW maintenance.current_recommendations AS
SELECT 
    th.schema_name || '.' || th.table_name AS full_table_name,
    th.table_size_pretty,
    th.bloat_ratio,
    th.maintenance_priority,
    th.vacuum_needed,
    th.analyze_needed,
    jsonb_array_elements(th.recommendations) AS recommendation,
    th.last_vacuum,
    th.last_analyze,
    th.checked_at
FROM maintenance.table_health th
WHERE th.checked_at = (
    SELECT MAX(checked_at) 
    FROM maintenance.table_health
)
AND (th.vacuum_needed = TRUE OR th.analyze_needed = TRUE)
ORDER BY 
    CASE th.maintenance_priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
    END,
    th.bloat_ratio DESC NULLS LAST;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON maintenance.current_recommendations TO authenticated;

-- Create indexes on frequently queried tables for better performance
CREATE INDEX IF NOT EXISTS idx_listings_status_updated ON public.listings(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC) WHERE read = FALSE;

-- Create a function to configure autovacuum settings for specific tables
CREATE OR REPLACE FUNCTION maintenance.configure_table_autovacuum(
    p_schema_name TEXT,
    p_table_name TEXT,
    p_autovacuum_vacuum_scale_factor NUMERIC DEFAULT NULL,
    p_autovacuum_analyze_scale_factor NUMERIC DEFAULT NULL,
    p_autovacuum_vacuum_threshold INT DEFAULT NULL,
    p_autovacuum_analyze_threshold INT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = maintenance, pg_catalog, public
AS $$
DECLARE
    v_full_table_name TEXT;
    v_commands TEXT[] := ARRAY[]::TEXT[];
    v_command TEXT;
BEGIN
    v_full_table_name := quote_ident(p_schema_name) || '.' || quote_ident(p_table_name);
    
    -- Build ALTER TABLE commands for each parameter
    IF p_autovacuum_vacuum_scale_factor IS NOT NULL THEN
        v_commands := array_append(v_commands, 
            format('ALTER TABLE %s SET (autovacuum_vacuum_scale_factor = %s)',
                v_full_table_name, p_autovacuum_vacuum_scale_factor));
    END IF;
    
    IF p_autovacuum_analyze_scale_factor IS NOT NULL THEN
        v_commands := array_append(v_commands,
            format('ALTER TABLE %s SET (autovacuum_analyze_scale_factor = %s)',
                v_full_table_name, p_autovacuum_analyze_scale_factor));
    END IF;
    
    IF p_autovacuum_vacuum_threshold IS NOT NULL THEN
        v_commands := array_append(v_commands,
            format('ALTER TABLE %s SET (autovacuum_vacuum_threshold = %s)',
                v_full_table_name, p_autovacuum_vacuum_threshold));
    END IF;
    
    IF p_autovacuum_analyze_threshold IS NOT NULL THEN
        v_commands := array_append(v_commands,
            format('ALTER TABLE %s SET (autovacuum_analyze_threshold = %s)',
                v_full_table_name, p_autovacuum_analyze_threshold));
    END IF;
    
    -- Execute all commands
    FOREACH v_command IN ARRAY v_commands
    LOOP
        EXECUTE v_command;
    END LOOP;
    
    RETURN format('Configured autovacuum settings for %s. Commands executed: %s', 
        v_full_table_name, array_length(v_commands, 1));
END;
$$;

-- Configure aggressive autovacuum for high-traffic tables
SELECT maintenance.configure_table_autovacuum('public', 'listings', 0.1, 0.05, 100, 50);
SELECT maintenance.configure_table_autovacuum('public', 'orders', 0.1, 0.05, 100, 50);
SELECT maintenance.configure_table_autovacuum('public', 'messages', 0.15, 0.07, 150, 75);
SELECT maintenance.configure_table_autovacuum('public', 'notifications', 0.15, 0.07, 150, 75);
SELECT maintenance.configure_table_autovacuum('public', 'views', 0.2, 0.1, 200, 100);

-- Create initial table health check
SELECT * FROM maintenance.check_table_health('public');

-- Add comment
COMMENT ON SCHEMA maintenance IS 'Database maintenance functions for VACUUM, ANALYZE, and monitoring table health';
COMMENT ON FUNCTION maintenance.check_table_health IS 'Analyzes table health metrics including bloat, dead tuples, and maintenance needs';
COMMENT ON FUNCTION maintenance.perform_maintenance IS 'Executes maintenance operations (VACUUM, ANALYZE, REINDEX) on specific tables with logging';
COMMENT ON FUNCTION maintenance.run_automated_maintenance IS 'Automatically runs maintenance on tables based on priority and health metrics';
COMMENT ON FUNCTION maintenance.get_maintenance_stats IS 'Returns maintenance operation statistics for the specified time period';
COMMENT ON FUNCTION maintenance.configure_table_autovacuum IS 'Configures custom autovacuum settings for specific tables';