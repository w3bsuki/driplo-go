-- Create admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX idx_admin_audit_log_resource ON admin_audit_log(resource_type, resource_id);
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);

-- Add RLS policies
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON admin_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- No one can update or delete audit logs (immutable)
CREATE POLICY "Audit logs are immutable" ON admin_audit_log
  FOR ALL
  USING (false);

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action VARCHAR,
  p_resource_type VARCHAR,
  p_resource_id VARCHAR DEFAULT NULL,
  p_details JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_admin_id UUID;
  v_log_id UUID;
BEGIN
  -- Get the current user ID
  v_admin_id := auth.uid();
  
  -- Verify user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_admin_id 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: User is not an admin';
  END IF;
  
  -- Insert audit log entry
  INSERT INTO admin_audit_log (
    admin_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    v_admin_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function to get payout statistics
CREATE OR REPLACE FUNCTION get_payout_statistics(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
) RETURNS TABLE (
  total_payouts BIGINT,
  total_amount NUMERIC,
  pending_count BIGINT,
  pending_amount NUMERIC,
  processing_count BIGINT,
  processing_amount NUMERIC,
  completed_count BIGINT,
  completed_amount NUMERIC,
  failed_count BIGINT,
  failed_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_payouts,
    COALESCE(SUM(amount), 0)::NUMERIC as total_amount,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_count,
    COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0)::NUMERIC as pending_amount,
    COUNT(*) FILTER (WHERE status = 'processing')::BIGINT as processing_count,
    COALESCE(SUM(amount) FILTER (WHERE status = 'processing'), 0)::NUMERIC as processing_amount,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_count,
    COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0)::NUMERIC as completed_amount,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_count,
    COALESCE(SUM(amount) FILTER (WHERE status = 'failed'), 0)::NUMERIC as failed_amount
  FROM seller_payouts
  WHERE created_at >= start_date 
    AND created_at <= end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;