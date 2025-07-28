-- Create rate_limits table for database-backed rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGSERIAL PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP address or user ID
  action TEXT NOT NULL, -- Action being rate limited (auth, api, payment, etc.)
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create composite index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
ON rate_limits(identifier, action, window_end);

-- Create index for cleanup operations
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end 
ON rate_limits(window_end);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_max_requests INTEGER,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INTEGER,
  reset_at TIMESTAMPTZ,
  retry_after_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
  v_current_count INTEGER;
  v_rate_limit_id BIGINT;
BEGIN
  -- Calculate window boundaries
  v_window_start := NOW();
  v_window_end := v_window_start + (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Lock the row for this identifier/action combination to prevent race conditions
  SELECT id, request_count, window_end
  INTO v_rate_limit_id, v_current_count, v_window_end
  FROM rate_limits
  WHERE identifier = p_identifier
    AND action = p_action
    AND window_end > NOW()
  FOR UPDATE;
  
  -- If no active window exists, create one
  IF v_rate_limit_id IS NULL THEN
    INSERT INTO rate_limits (identifier, action, request_count, window_start, window_end)
    VALUES (p_identifier, p_action, 1, v_window_start, v_window_end)
    RETURNING id INTO v_rate_limit_id;
    
    RETURN QUERY
    SELECT 
      TRUE AS allowed,
      1 AS current_count,
      v_window_end AS reset_at,
      0 AS retry_after_seconds;
    RETURN;
  END IF;
  
  -- If request count is below limit, increment and allow
  IF v_current_count < p_max_requests THEN
    UPDATE rate_limits
    SET 
      request_count = request_count + 1,
      updated_at = NOW()
    WHERE id = v_rate_limit_id;
    
    RETURN QUERY
    SELECT 
      TRUE AS allowed,
      v_current_count + 1 AS current_count,
      v_window_end AS reset_at,
      0 AS retry_after_seconds;
  ELSE
    -- Rate limit exceeded
    RETURN QUERY
    SELECT 
      FALSE AS allowed,
      v_current_count AS current_count,
      v_window_end AS reset_at,
      EXTRACT(EPOCH FROM (v_window_end - NOW()))::INTEGER AS retry_after_seconds;
  END IF;
END;
$$;

-- Create function to clean up expired rate limit entries
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limits
  WHERE window_end <= NOW() - INTERVAL '1 hour'
  RETURNING COUNT(*) INTO v_deleted_count;
  
  RETURN v_deleted_count;
END;
$$;

-- Create function for bulk rate limit checking (useful for webhooks)
CREATE OR REPLACE FUNCTION check_bulk_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_request_count INTEGER, -- Number of requests to add
  p_max_requests INTEGER,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INTEGER,
  reset_at TIMESTAMPTZ,
  retry_after_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
  v_current_count INTEGER;
  v_rate_limit_id BIGINT;
  v_new_count INTEGER;
BEGIN
  -- Calculate window boundaries
  v_window_start := NOW();
  v_window_end := v_window_start + (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Lock the row for this identifier/action combination
  SELECT id, request_count, window_end
  INTO v_rate_limit_id, v_current_count, v_window_end
  FROM rate_limits
  WHERE identifier = p_identifier
    AND action = p_action
    AND window_end > NOW()
  FOR UPDATE;
  
  -- If no active window exists, create one
  IF v_rate_limit_id IS NULL THEN
    -- Check if the new request count would exceed the limit
    IF p_request_count > p_max_requests THEN
      RETURN QUERY
      SELECT 
        FALSE AS allowed,
        0 AS current_count,
        v_window_end AS reset_at,
        p_window_minutes * 60 AS retry_after_seconds;
      RETURN;
    END IF;
    
    INSERT INTO rate_limits (identifier, action, request_count, window_start, window_end)
    VALUES (p_identifier, p_action, p_request_count, v_window_start, v_window_end)
    RETURNING id INTO v_rate_limit_id;
    
    RETURN QUERY
    SELECT 
      TRUE AS allowed,
      p_request_count AS current_count,
      v_window_end AS reset_at,
      0 AS retry_after_seconds;
    RETURN;
  END IF;
  
  -- Calculate new count
  v_new_count := v_current_count + p_request_count;
  
  -- If new count would exceed limit, deny
  IF v_new_count > p_max_requests THEN
    RETURN QUERY
    SELECT 
      FALSE AS allowed,
      v_current_count AS current_count,
      v_window_end AS reset_at,
      EXTRACT(EPOCH FROM (v_window_end - NOW()))::INTEGER AS retry_after_seconds;
  ELSE
    -- Update count and allow
    UPDATE rate_limits
    SET 
      request_count = v_new_count,
      updated_at = NOW()
    WHERE id = v_rate_limit_id;
    
    RETURN QUERY
    SELECT 
      TRUE AS allowed,
      v_new_count AS current_count,
      v_window_end AS reset_at,
      0 AS retry_after_seconds;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_bulk_rate_limit TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cleanup_expired_rate_limits TO service_role;

-- Create scheduled job to clean up expired entries (requires pg_cron extension)
-- This should be run by a separate cron job or scheduled function
COMMENT ON FUNCTION cleanup_expired_rate_limits IS 
'Run this function periodically (e.g., every hour) to clean up expired rate limit entries';

-- Add comment to table
COMMENT ON TABLE rate_limits IS 'Database-backed rate limiting to replace in-memory store';