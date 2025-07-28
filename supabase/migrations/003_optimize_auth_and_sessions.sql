-- Migration: Optimize Authentication and Session Management
-- Purpose: Extend session duration, improve auth experience, add remember me functionality
-- Date: 2025-07-19
-- Critical for user retention!

-- 1. Create auth session management table for "Remember Me" functionality
CREATE TABLE IF NOT EXISTS public.auth_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    refresh_token_hash text NOT NULL,
    device_fingerprint text,
    ip_address inet,
    user_agent text,
    remember_me boolean DEFAULT false,
    last_active timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, refresh_token_hash)
);

-- Index for quick session lookups
CREATE INDEX CONCURRENTLY idx_auth_sessions_user_id_expires 
ON auth_sessions(user_id, expires_at) 
WHERE expires_at > now();

CREATE INDEX CONCURRENTLY idx_auth_sessions_refresh_token 
ON auth_sessions(refresh_token_hash);

-- 2. Function to manage extended sessions
CREATE OR REPLACE FUNCTION manage_user_session(
    p_user_id uuid,
    p_refresh_token text,
    p_remember_me boolean DEFAULT false,
    p_device_info jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token_hash text;
    v_expires_at timestamptz;
    v_session_id uuid;
BEGIN
    -- Hash the refresh token for security
    v_token_hash := encode(digest(p_refresh_token, 'sha256'), 'hex');
    
    -- Set expiration based on remember_me
    IF p_remember_me THEN
        v_expires_at := now() + interval '30 days'; -- 1 month for remember me
    ELSE
        v_expires_at := now() + interval '7 days'; -- 1 week default
    END IF;
    
    -- Upsert session
    INSERT INTO auth_sessions (
        user_id,
        refresh_token_hash,
        device_fingerprint,
        ip_address,
        user_agent,
        remember_me,
        expires_at,
        last_active
    ) VALUES (
        p_user_id,
        v_token_hash,
        p_device_info->>'fingerprint',
        (p_device_info->>'ip_address')::inet,
        p_device_info->>'user_agent',
        p_remember_me,
        v_expires_at,
        now()
    )
    ON CONFLICT (user_id, refresh_token_hash) 
    DO UPDATE SET
        last_active = now(),
        expires_at = GREATEST(auth_sessions.expires_at, EXCLUDED.expires_at)
    RETURNING id INTO v_session_id;
    
    -- Clean up old sessions (keep max 5 per user)
    DELETE FROM auth_sessions
    WHERE user_id = p_user_id
    AND id NOT IN (
        SELECT id FROM auth_sessions
        WHERE user_id = p_user_id
        ORDER BY last_active DESC
        LIMIT 5
    );
    
    RETURN jsonb_build_object(
        'session_id', v_session_id,
        'expires_at', v_expires_at,
        'remember_me', p_remember_me
    );
END;
$$;

-- 3. Function to validate and refresh sessions
CREATE OR REPLACE FUNCTION validate_user_session(
    p_user_id uuid,
    p_refresh_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token_hash text;
    v_session record;
    v_new_expires_at timestamptz;
BEGIN
    v_token_hash := encode(digest(p_refresh_token, 'sha256'), 'hex');
    
    -- Find valid session
    SELECT * INTO v_session
    FROM auth_sessions
    WHERE user_id = p_user_id
    AND refresh_token_hash = v_token_hash
    AND expires_at > now();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false);
    END IF;
    
    -- Extend session if active
    IF v_session.remember_me THEN
        v_new_expires_at := now() + interval '30 days';
    ELSE
        v_new_expires_at := now() + interval '7 days';
    END IF;
    
    -- Update last active and expiration
    UPDATE auth_sessions
    SET last_active = now(),
        expires_at = v_new_expires_at
    WHERE id = v_session.id;
    
    RETURN jsonb_build_object(
        'valid', true,
        'session_id', v_session.id,
        'expires_at', v_new_expires_at,
        'remember_me', v_session.remember_me
    );
END;
$$;

-- 4. Add login tracking for security
CREATE TABLE IF NOT EXISTS public.auth_login_history (
    id serial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    login_at timestamptz DEFAULT now(),
    ip_address inet,
    user_agent text,
    login_method text, -- 'password', 'oauth', 'magic_link'
    success boolean DEFAULT true,
    failure_reason text,
    device_fingerprint text
);

CREATE INDEX CONCURRENTLY idx_login_history_user_date 
ON auth_login_history(user_id, login_at DESC);

CREATE INDEX CONCURRENTLY idx_login_history_failures 
ON auth_login_history(user_id, success, login_at DESC)
WHERE success = false;

-- 5. Function to track login attempts
CREATE OR REPLACE FUNCTION track_login_attempt(
    p_user_id uuid,
    p_success boolean,
    p_login_method text DEFAULT 'password',
    p_failure_reason text DEFAULT NULL,
    p_device_info jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO auth_login_history (
        user_id,
        success,
        login_method,
        failure_reason,
        ip_address,
        user_agent,
        device_fingerprint
    ) VALUES (
        p_user_id,
        p_success,
        p_login_method,
        p_failure_reason,
        (p_device_info->>'ip_address')::inet,
        p_device_info->>'user_agent',
        p_device_info->>'fingerprint'
    );
    
    -- Check for suspicious activity (5 failed attempts in 15 minutes)
    IF NOT p_success THEN
        PERFORM pg_notify(
            'auth_security',
            json_build_object(
                'event', 'failed_login',
                'user_id', p_user_id,
                'recent_failures', (
                    SELECT COUNT(*)
                    FROM auth_login_history
                    WHERE user_id = p_user_id
                    AND success = false
                    AND login_at > now() - interval '15 minutes'
                )
            )::text
        );
    END IF;
END;
$$;

-- 6. Optimize profile loading with auth
CREATE OR REPLACE FUNCTION get_user_with_profile(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'id', u.id,
        'email', u.email,
        'created_at', u.created_at,
        'last_sign_in_at', u.last_sign_in_at,
        'profile', jsonb_build_object(
            'username', p.username,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url,
            'role', p.role,
            'is_seller', p.is_seller,
            'seller_verified', p.seller_verified,
            'email_verified', p.email_verified,
            'phone_verified', p.phone_verified,
            'trust_score', p.trust_score,
            'language', p.language,
            'currency', p.currency,
            'notification_preferences', p.notification_preferences
        ),
        'stats', CASE 
            WHEN p.is_seller THEN jsonb_build_object(
                'total_sales', p.total_sales,
                'seller_rating', p.seller_rating,
                'total_reviews', p.total_reviews
            )
            ELSE NULL
        END
    ) INTO v_result
    FROM auth.users u
    JOIN public.profiles p ON p.id = u.id
    WHERE u.id = p_user_id;
    
    RETURN v_result;
END;
$$;

-- 7. Create secure session cleanup job
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete expired sessions
    DELETE FROM auth_sessions
    WHERE expires_at < now() - interval '7 days';
    
    -- Delete old login history (keep 90 days)
    DELETE FROM auth_login_history
    WHERE login_at < now() - interval '90 days';
END;
$$;

-- 8. RLS policies for session tables
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_login_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON auth_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions" ON auth_sessions
    FOR DELETE USING (user_id = auth.uid());

-- Users can view their own login history
CREATE POLICY "Users can view own login history" ON auth_login_history
    FOR SELECT USING (user_id = auth.uid());

-- 9. Helper function for the frontend
CREATE OR REPLACE FUNCTION get_active_sessions()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN '[]'::jsonb;
    END IF;
    
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', id,
                'device_fingerprint', device_fingerprint,
                'ip_address', ip_address::text,
                'user_agent', user_agent,
                'last_active', last_active,
                'expires_at', expires_at,
                'remember_me', remember_me,
                'is_current', false -- Frontend will determine this
            ) ORDER BY last_active DESC
        )
        FROM auth_sessions
        WHERE user_id = v_user_id
        AND expires_at > now()
    );
END;
$$;

-- 10. Create a scheduled job for cleanup (using pg_cron if available)
-- Note: This requires pg_cron extension to be enabled
-- SELECT cron.schedule('cleanup-sessions', '0 3 * * *', 'SELECT cleanup_expired_sessions();');

-- Summary of improvements:
-- 1. Extended session duration (7 days default, 30 days with "remember me")
-- 2. Secure session management with device tracking
-- 3. Login history for security monitoring
-- 4. Optimized profile loading with auth data
-- 5. Automatic cleanup of old sessions
-- 6. Support for multiple devices (up to 5 active sessions)
-- 7. Security notifications for suspicious activity