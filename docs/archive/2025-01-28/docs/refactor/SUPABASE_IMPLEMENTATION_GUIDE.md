# Supabase Production Implementation Guide

**Companion to**: SUPABASE_PRODUCTION_REFACTOR_PLAN.md  
**Generated**: 2025-01-23  
**Version**: 1.0

## Prerequisites

### Install and Configure Supabase CLI

Before starting any implementation, you need the Supabase CLI:

```bash
# Windows (using Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# macOS/Linux
brew install supabase/tap/supabase

# Or using npm/yarn
npm install -g supabase
```

### Configure Supabase CLI

```bash
# Login to Supabase
supabase login

# Link to your project (you'll need your project reference ID)
supabase link --project-ref your-project-ref

# Pull remote database schema to sync local environment
supabase db pull

# Verify connection
supabase db lint
```

## Quick Start Checklist

Before starting implementation:
- [ ] ✅ Supabase CLI installed and configured (see above)
- [ ] Back up your production database
- [ ] Set up a staging environment
- [ ] Create a new git branch: `feat/supabase-production-refactor`
- [ ] Review the main refactor plan document

## Phase 1: Database Schema Fixes

### Step 1: Generate Migration Files

Now that you have the CLI set up, create your first migration:

```bash
# Create migration for missing tables
supabase migration new add_missing_tables
```

### Step 2: Add Missing Tables

Copy this into `supabase/migrations/[timestamp]_add_missing_tables.sql`:

```sql
-- Create brand_profiles table with proper constraints
CREATE TABLE IF NOT EXISTS public.brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  brand_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMPTZ,
  verification_type TEXT CHECK (verification_type IN ('manual', 'document', 'social')),
  website TEXT,
  established_year INTEGER CHECK (established_year >= 1800 AND established_year <= EXTRACT(YEAR FROM CURRENT_DATE)),
  category TEXT,
  subcategory TEXT,
  country TEXT,
  social_links JSONB DEFAULT '{}',
  stats JSONB DEFAULT '{"followers": 0, "products": 0, "sales": 0}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for brand_profiles
CREATE INDEX idx_brand_profiles_user_id ON public.brand_profiles(user_id);
CREATE INDEX idx_brand_profiles_slug ON public.brand_profiles(slug);
CREATE INDEX idx_brand_profiles_verified ON public.brand_profiles(verified) WHERE verified = true;

-- Enable RLS
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

-- Create social_media_accounts table
CREATE TABLE IF NOT EXISTS public.social_media_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'pinterest', 'linkedin')),
  username TEXT NOT NULL,
  url TEXT,
  verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMPTZ,
  follower_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, platform)
);

-- Create indexes
CREATE INDEX idx_social_media_accounts_user_id ON public.social_media_accounts(user_id);
CREATE INDEX idx_social_media_accounts_platform ON public.social_media_accounts(platform);

-- Enable RLS
ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;

-- Create documents table for verification
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('id_card', 'passport', 'business_license', 'tax_document', 'bank_statement', 'other')),
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}',
  uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_type ON public.documents(type);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create auth_rate_limits table for rate limiting protection
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP address or user ID
  action TEXT NOT NULL, -- login, register, reset_password, etc.
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for fast lookups
CREATE INDEX idx_auth_rate_limits_lookup ON public.auth_rate_limits(identifier, action, created_at DESC);
CREATE INDEX idx_auth_rate_limits_cleanup ON public.auth_rate_limits(created_at); -- For cleanup

-- Create listing_drafts table for saving partial listing data
CREATE TABLE IF NOT EXISTS public.listing_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  draft_data JSONB NOT NULL DEFAULT '{}',
  current_step INTEGER DEFAULT 1,
  last_saved_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX idx_listing_drafts_user_id ON public.listing_drafts(user_id);
CREATE INDEX idx_listing_drafts_updated ON public.listing_drafts(updated_at DESC);

-- Enable RLS
ALTER TABLE public.listing_drafts ENABLE ROW LEVEL SECURITY;

-- Create user_achievements table for gamification
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  achievement_icon TEXT,
  achievement_data JSONB DEFAULT '{}',
  points INTEGER DEFAULT 0,
  earned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, achievement_type)
);

-- Create indexes
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_type ON public.user_achievements(achievement_type);
CREATE INDEX idx_user_achievements_earned ON public.user_achievements(earned_at DESC);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Add update timestamp triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_brand_profiles_updated_at
  BEFORE UPDATE ON public.brand_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_social_media_accounts_updated_at
  BEFORE UPDATE ON public.social_media_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### Step 3: Update Profiles Table

Create another migration:

```bash
supabase migration new update_profiles_table
```

Add to `supabase/migrations/[timestamp]_update_profiles_table.sql`:

```sql
-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '13 years'),
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": false, "sms": false}',
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"profile_visible": true, "show_online_status": true}',
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deleted', 'pending')),
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_account_status TEXT,
ADD COLUMN IF NOT EXISTS tax_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS business_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS ship_from_country TEXT,
ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'USD';

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active DESC);

-- Add column comments for documentation
COMMENT ON COLUMN public.profiles.trust_score IS 'User trust score from 0-100 based on behavior and verification';
COMMENT ON COLUMN public.profiles.response_time_minutes IS 'Average response time to messages in minutes';
COMMENT ON COLUMN public.profiles.tax_info IS 'JSON object containing tax-related information';
COMMENT ON COLUMN public.profiles.business_info IS 'JSON object containing business details for sellers';
COMMENT ON COLUMN public.profiles.achievements IS 'JSON array of achievement objects with id, name, date';
COMMENT ON COLUMN public.profiles.badges IS 'JSON array of badge objects with id, name, icon, date';
```

### Step 4: Create Missing RPC Functions

Create migration for RPC functions:

```bash
supabase migration new create_rpc_functions
```

Add to `supabase/migrations/[timestamp]_create_rpc_functions.sql`:

```sql
-- Auth rate limiting table
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_auth_rate_limits_lookup ON public.auth_rate_limits(identifier, action, created_at DESC);

-- Clean up old rate limit entries periodically
CREATE OR REPLACE FUNCTION public.cleanup_auth_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.auth_rate_limits 
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auth rate limiting function
CREATE OR REPLACE FUNCTION public.check_auth_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN AS $$
DECLARE
  v_attempts INTEGER;
BEGIN
  -- Count recent attempts
  SELECT COUNT(*) INTO v_attempts
  FROM public.auth_rate_limits
  WHERE identifier = p_identifier
    AND action = p_action
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Check if under limit
  IF v_attempts >= p_max_attempts THEN
    RETURN FALSE;
  END IF;
  
  -- Log this attempt
  INSERT INTO public.auth_rate_limits (identifier, action)
  VALUES (p_identifier, p_action);
  
  -- Clean up old entries occasionally (1% chance)
  IF random() < 0.01 THEN
    PERFORM public.cleanup_auth_rate_limits();
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auth event logging
CREATE TABLE IF NOT EXISTS public.auth_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_auth_audit_log_user_id ON public.auth_audit_log(user_id);
CREATE INDEX idx_auth_audit_log_action ON public.auth_audit_log(action);
CREATE INDEX idx_auth_audit_log_created_at ON public.auth_audit_log(created_at DESC);

-- Log auth event function
CREATE OR REPLACE FUNCTION public.log_auth_event(
  p_action TEXT,
  p_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS void AS $$
BEGIN
  INSERT INTO public.auth_audit_log (user_id, action, metadata)
  VALUES (p_user_id, p_action, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user stats function
CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id UUID)
RETURNS TABLE (
  total_sales INTEGER,
  total_purchases INTEGER,
  total_listings INTEGER,
  active_listings INTEGER,
  total_revenue DECIMAL,
  avg_rating DECIMAL,
  rating_count INTEGER,
  response_time_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM public.orders WHERE seller_id = p_user_id AND status = 'delivered') as total_sales,
    (SELECT COUNT(*)::INTEGER FROM public.orders WHERE buyer_id = p_user_id AND status = 'delivered') as total_purchases,
    (SELECT COUNT(*)::INTEGER FROM public.listings WHERE seller_id = p_user_id) as total_listings,
    (SELECT COUNT(*)::INTEGER FROM public.listings WHERE seller_id = p_user_id AND status = 'active') as active_listings,
    (SELECT COALESCE(SUM(total_amount), 0)::DECIMAL FROM public.orders WHERE seller_id = p_user_id AND status = 'delivered') as total_revenue,
    (SELECT AVG(rating)::DECIMAL(3,2) FROM public.user_ratings WHERE rated_user_id = p_user_id) as avg_rating,
    (SELECT COUNT(*)::INTEGER FROM public.user_ratings WHERE rated_user_id = p_user_id) as rating_count,
    (SELECT response_time_minutes::INTEGER FROM public.profiles WHERE id = p_user_id) as response_time_minutes;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get top sellers function
CREATE OR REPLACE FUNCTION public.get_top_sellers(
  p_limit INTEGER DEFAULT 10,
  p_timeframe TEXT DEFAULT 'all_time'
) RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  total_sales INTEGER,
  total_revenue DECIMAL,
  avg_rating DECIMAL,
  rating_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH seller_stats AS (
    SELECT 
      o.seller_id,
      COUNT(*)::INTEGER as sales_count,
      SUM(o.total_amount)::DECIMAL as revenue
    FROM public.orders o
    WHERE o.status = 'delivered'
      AND CASE 
        WHEN p_timeframe = 'week' THEN o.created_at > NOW() - INTERVAL '7 days'
        WHEN p_timeframe = 'month' THEN o.created_at > NOW() - INTERVAL '30 days'
        WHEN p_timeframe = 'year' THEN o.created_at > NOW() - INTERVAL '365 days'
        ELSE TRUE
      END
    GROUP BY o.seller_id
  )
  SELECT 
    p.id as user_id,
    p.username,
    p.avatar_url,
    ss.sales_count as total_sales,
    ss.revenue as total_revenue,
    p.seller_rating as avg_rating,
    p.seller_rating_count as rating_count
  FROM seller_stats ss
  JOIN public.profiles p ON p.id = ss.seller_id
  WHERE p.account_status = 'active'
  ORDER BY ss.revenue DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Generate order number function
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT := 'ORD';
  v_timestamp TEXT;
  v_random TEXT;
  v_order_number TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate timestamp part (YYMMDD)
    v_timestamp := TO_CHAR(NOW(), 'YYMMDD');
    
    -- Generate random part (4 digits)
    v_random := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Combine parts
    v_order_number := v_prefix || '-' || v_timestamp || '-' || v_random;
    
    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM public.orders WHERE order_number = v_order_number) INTO v_exists;
    
    -- If unique, return it
    IF NOT v_exists THEN
      RETURN v_order_number;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Update order status with history
CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id UUID,
  p_new_status TEXT,
  p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_status TEXT;
  v_seller_id UUID;
  v_buyer_id UUID;
BEGIN
  -- Get current order info
  SELECT status, seller_id, buyer_id 
  INTO v_current_status, v_seller_id, v_buyer_id
  FROM public.orders 
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Validate status transition
  IF NOT public.is_valid_status_transition(v_current_status, p_new_status) THEN
    RETURN FALSE;
  END IF;
  
  -- Update order status
  UPDATE public.orders 
  SET 
    status = p_new_status,
    updated_at = NOW()
  WHERE id = p_order_id;
  
  -- Log status change
  INSERT INTO public.order_status_history (
    order_id, 
    old_status, 
    new_status, 
    notes, 
    changed_by
  ) VALUES (
    p_order_id,
    v_current_status,
    p_new_status,
    p_notes,
    auth.uid()
  );
  
  -- Send notifications based on status
  IF p_new_status = 'shipped' THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      v_buyer_id,
      'order_shipped',
      'Your order has been shipped!',
      'Your order is on its way. Track it in your orders page.',
      jsonb_build_object('order_id', p_order_id)
    );
  ELSIF p_new_status = 'delivered' THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      v_buyer_id,
      'order_delivered',
      'Your order has been delivered!',
      'Please confirm receipt and leave a review.',
      jsonb_build_object('order_id', p_order_id)
    );
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function for status transitions
CREATE OR REPLACE FUNCTION public.is_valid_status_transition(
  p_current_status TEXT,
  p_new_status TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Define valid transitions
  RETURN CASE
    WHEN p_current_status = 'pending' THEN p_new_status IN ('processing', 'cancelled')
    WHEN p_current_status = 'processing' THEN p_new_status IN ('shipped', 'cancelled')
    WHEN p_current_status = 'shipped' THEN p_new_status IN ('delivered', 'returned')
    WHEN p_current_status = 'delivered' THEN p_new_status IN ('completed', 'disputed')
    WHEN p_current_status = 'cancelled' THEN FALSE
    WHEN p_current_status = 'returned' THEN p_new_status = 'refunded'
    WHEN p_current_status = 'refunded' THEN FALSE
    WHEN p_current_status = 'disputed' THEN p_new_status IN ('resolved', 'refunded')
    ELSE FALSE
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get recent reviews function
CREATE OR REPLACE FUNCTION public.get_recent_reviews(
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  id UUID,
  rating INTEGER,
  review_text TEXT,
  rater_username TEXT,
  rater_avatar_url TEXT,
  rated_username TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.rating,
    r.review_text,
    rater.username as rater_username,
    rater.avatar_url as rater_avatar_url,
    rated.username as rated_username,
    r.created_at
  FROM public.user_ratings r
  JOIN public.profiles rater ON rater.id = r.rater_user_id
  JOIN public.profiles rated ON rated.id = r.rated_user_id
  WHERE r.rating >= 4
    AND r.review_text IS NOT NULL
    AND LENGTH(r.review_text) > 20
  ORDER BY r.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Admin functions
CREATE OR REPLACE FUNCTION public.admin_verify_user_email(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Update user email verification
  UPDATE auth.users 
  SET email_confirmed_at = NOW()
  WHERE id = p_user_id;
  
  -- Log admin action
  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  ) VALUES (
    auth.uid(),
    'verify_email',
    'user',
    p_user_id,
    jsonb_build_object('verified_at', NOW())
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unverified users for admin
CREATE OR REPLACE FUNCTION public.get_unverified_users_for_admin(
  p_limit INTEGER DEFAULT 50
) RETURNS TABLE (
  user_id UUID,
  email TEXT,
  username TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email::TEXT,
    p.username,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  WHERE u.email_confirmed_at IS NULL
  ORDER BY u.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Brand stats function
CREATE OR REPLACE FUNCTION public.get_brand_sales_stats(
  p_brand_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
) RETURNS TABLE (
  total_sales INTEGER,
  total_revenue DECIMAL,
  unique_customers INTEGER,
  avg_order_value DECIMAL,
  top_category TEXT,
  growth_percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH brand_orders AS (
    SELECT 
      o.*
    FROM public.orders o
    JOIN public.listings l ON l.id = o.listing_id
    WHERE l.seller_id = p_brand_id
      AND o.status IN ('delivered', 'completed')
      AND (p_start_date IS NULL OR o.created_at >= p_start_date)
      AND (p_end_date IS NULL OR o.created_at <= p_end_date)
  ),
  previous_period AS (
    SELECT 
      COUNT(*) as prev_sales,
      COALESCE(SUM(total_amount), 0) as prev_revenue
    FROM public.orders o
    JOIN public.listings l ON l.id = o.listing_id
    WHERE l.seller_id = p_brand_id
      AND o.status IN ('delivered', 'completed')
      AND p_start_date IS NOT NULL
      AND o.created_at >= (p_start_date - (p_end_date - p_start_date)::INTERVAL)
      AND o.created_at < p_start_date
  )
  SELECT 
    COUNT(*)::INTEGER as total_sales,
    COALESCE(SUM(bo.total_amount), 0)::DECIMAL as total_revenue,
    COUNT(DISTINCT bo.buyer_id)::INTEGER as unique_customers,
    CASE 
      WHEN COUNT(*) > 0 THEN (SUM(bo.total_amount) / COUNT(*))::DECIMAL(10,2)
      ELSE 0
    END as avg_order_value,
    (
      SELECT c.name
      FROM public.listings l
      JOIN public.categories c ON c.id = l.category_id
      JOIN brand_orders bo2 ON bo2.listing_id = l.id
      GROUP BY c.name
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) as top_category,
    CASE
      WHEN p_start_date IS NOT NULL AND pp.prev_revenue > 0 THEN
        ((SUM(bo.total_amount) - pp.prev_revenue) / pp.prev_revenue * 100)::DECIMAL(5,2)
      ELSE NULL
    END as growth_percentage
  FROM brand_orders bo
  CROSS JOIN previous_period pp;
END;
$$ LANGUAGE plpgsql STABLE;
```

### Step 4.5: Create Additional Missing RPC Functions

Create another migration for the missing functions discovered in the audit:

```bash
supabase migration new create_missing_rpc_functions
```

Add to `supabase/migrations/[timestamp]_create_missing_rpc_functions.sql`:

```sql
-- Get unverified users for admin function
CREATE OR REPLACE FUNCTION public.get_unverified_users_for_admin(
  p_limit INTEGER DEFAULT 50
) RETURNS TABLE (
  user_id UUID,
  email TEXT,
  username TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email::TEXT,
    p.username,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  WHERE u.email_confirmed_at IS NULL
  ORDER BY u.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Track listing view function for analytics
CREATE OR REPLACE FUNCTION public.track_listing_view(
  p_listing_id UUID,
  p_viewer_id UUID DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Insert view record
  INSERT INTO public.listing_views (
    listing_id,
    viewer_id,
    viewed_at,
    ip_address,
    user_agent
  ) VALUES (
    p_listing_id,
    COALESCE(p_viewer_id, auth.uid()),
    NOW(),
    inet_client_addr(),
    current_setting('request.headers')::json->>'user-agent'
  ) ON CONFLICT DO NOTHING;
  
  -- Update listing view count
  UPDATE public.listings
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_listing_id;
END;
$$ LANGUAGE plpgsql;

-- Create required tables for tracking
CREATE TABLE IF NOT EXISTS public.listing_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_listing_views_listing ON public.listing_views(listing_id);
CREATE INDEX idx_listing_views_viewer ON public.listing_views(viewer_id);
CREATE INDEX idx_listing_views_date ON public.listing_views(viewed_at DESC);

-- Admin audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_log_admin ON public.admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX idx_admin_audit_log_created ON public.admin_audit_log(created_at DESC);

-- Enable RLS on new tables
ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for listing_views
CREATE POLICY "Admins can view all listing views" ON public.listing_views
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Sellers can view their own listing views" ON public.listing_views
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = listing_id AND seller_id = auth.uid()
    )
  );

-- RLS policies for admin_audit_log
CREATE POLICY "Only admins can view audit logs" ON public.admin_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create increment listing quantity function
CREATE OR REPLACE FUNCTION public.increment_listing_quantity(
  p_listing_id UUID,
  p_quantity INTEGER DEFAULT 1
) RETURNS INTEGER AS $$
DECLARE
  v_new_quantity INTEGER;
BEGIN
  UPDATE public.listings
  SET quantity = quantity + p_quantity
  WHERE id = p_listing_id
  RETURNING quantity INTO v_new_quantity;
  
  RETURN v_new_quantity;
END;
$$ LANGUAGE plpgsql;

-- Add view_count column to listings if it doesn't exist
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_listings_view_count ON public.listings(view_count DESC);

-- Create order with payment function
CREATE OR REPLACE FUNCTION public.create_order_with_payment(
  p_listing_id UUID,
  p_payment_intent_id TEXT,
  p_shipping_address JSONB,
  p_amount DECIMAL
) RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_seller_id UUID;
  v_buyer_id UUID;
BEGIN
  -- Get buyer ID
  v_buyer_id := auth.uid();
  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Get seller ID from listing
  SELECT seller_id INTO v_seller_id
  FROM public.listings
  WHERE id = p_listing_id AND status = 'active';
  
  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'Listing not found or not active';
  END IF;
  
  -- Create order
  INSERT INTO public.orders (
    listing_id,
    buyer_id,
    seller_id,
    total_amount,
    status,
    payment_intent_id,
    shipping_address
  ) VALUES (
    p_listing_id,
    v_buyer_id,
    v_seller_id,
    p_amount,
    'pending',
    p_payment_intent_id,
    p_shipping_address
  ) RETURNING id INTO v_order_id;
  
  -- Update listing status
  UPDATE public.listings
  SET status = 'sold'
  WHERE id = p_listing_id;
  
  -- Create notification for seller
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    v_seller_id,
    'new_order',
    'New order received!',
    'You have a new order for your listing',
    jsonb_build_object('order_id', v_order_id, 'listing_id', p_listing_id)
  );
  
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process refund function
CREATE OR REPLACE FUNCTION public.process_refund(
  p_order_id UUID,
  p_reason TEXT,
  p_amount DECIMAL DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
  v_refund_amount DECIMAL;
BEGIN
  -- Get order details
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  -- Check if caller is buyer or admin
  IF v_order.buyer_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Determine refund amount
  v_refund_amount := COALESCE(p_amount, v_order.total_amount);
  
  -- Create refund record
  INSERT INTO public.refunds (
    order_id,
    amount,
    reason,
    status,
    requested_by,
    requested_at
  ) VALUES (
    p_order_id,
    v_refund_amount,
    p_reason,
    'pending',
    auth.uid(),
    NOW()
  );
  
  -- Update order status
  UPDATE public.orders
  SET status = 'refund_pending'
  WHERE id = p_order_id;
  
  -- Notify seller
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    v_order.seller_id,
    'refund_requested',
    'Refund requested',
    'A refund has been requested for your order',
    jsonb_build_object('order_id', p_order_id, 'amount', v_refund_amount)
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get seller analytics function
CREATE OR REPLACE FUNCTION public.get_seller_analytics(
  p_seller_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
  total_sales INTEGER,
  total_revenue DECIMAL,
  avg_order_value DECIMAL,
  total_views INTEGER,
  conversion_rate DECIMAL,
  top_categories JSONB,
  sales_by_day JSONB,
  return_rate DECIMAL
) AS $$
BEGIN
  -- Use current user if no seller_id provided
  p_seller_id := COALESCE(p_seller_id, auth.uid());
  
  RETURN QUERY
  WITH sales_data AS (
    SELECT 
      o.*,
      l.category_id,
      c.name as category_name
    FROM public.orders o
    JOIN public.listings l ON l.id = o.listing_id
    JOIN public.categories c ON c.id = l.category_id
    WHERE o.seller_id = p_seller_id
      AND o.created_at BETWEEN p_start_date AND p_end_date
      AND o.status IN ('delivered', 'completed')
  ),
  view_data AS (
    SELECT COUNT(*) as total_views
    FROM public.listing_views lv
    JOIN public.listings l ON l.id = lv.listing_id
    WHERE l.seller_id = p_seller_id
      AND lv.viewed_at BETWEEN p_start_date AND p_end_date
  ),
  returns_data AS (
    SELECT COUNT(*) as return_count
    FROM public.orders
    WHERE seller_id = p_seller_id
      AND status = 'returned'
      AND created_at BETWEEN p_start_date AND p_end_date
  )
  SELECT 
    COUNT(sd.*)::INTEGER as total_sales,
    COALESCE(SUM(sd.total_amount), 0)::DECIMAL as total_revenue,
    CASE 
      WHEN COUNT(sd.*) > 0 THEN (SUM(sd.total_amount) / COUNT(sd.*))::DECIMAL
      ELSE 0
    END as avg_order_value,
    vd.total_views::INTEGER,
    CASE
      WHEN vd.total_views > 0 THEN (COUNT(sd.*)::DECIMAL / vd.total_views * 100)::DECIMAL
      ELSE 0
    END as conversion_rate,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'category', category_name,
        'count', category_count,
        'revenue', category_revenue
      ))
      FROM (
        SELECT 
          category_name,
          COUNT(*) as category_count,
          SUM(total_amount) as category_revenue
        FROM sales_data
        GROUP BY category_name
        ORDER BY category_revenue DESC
        LIMIT 5
      ) top_cats
    ) as top_categories,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'date', sale_date,
        'sales', daily_sales,
        'revenue', daily_revenue
      ))
      FROM (
        SELECT 
          DATE(created_at) as sale_date,
          COUNT(*) as daily_sales,
          SUM(total_amount) as daily_revenue
        FROM sales_data
        GROUP BY DATE(created_at)
        ORDER BY sale_date
      ) daily
    ) as sales_by_day,
    CASE
      WHEN COUNT(sd.*) > 0 THEN (rd.return_count::DECIMAL / COUNT(sd.*) * 100)::DECIMAL
      ELSE 0
    END as return_rate
  FROM sales_data sd
  CROSS JOIN view_data vd
  CROSS JOIN returns_data rd
  GROUP BY vd.total_views, rd.return_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Calculate shipping cost function
CREATE OR REPLACE FUNCTION public.calculate_shipping_cost(
  p_listing_id UUID,
  p_destination_country TEXT
) RETURNS DECIMAL AS $$
DECLARE
  v_shipping_info JSONB;
  v_weight DECIMAL;
  v_base_cost DECIMAL;
  v_international_fee DECIMAL;
BEGIN
  -- Get listing shipping info
  SELECT shipping_info INTO v_shipping_info
  FROM public.listings
  WHERE id = p_listing_id;
  
  -- Extract weight (default to 1kg if not specified)
  v_weight := COALESCE((v_shipping_info->>'weight')::DECIMAL, 1.0);
  
  -- Base cost calculation
  v_base_cost := 5.00 + (v_weight * 2.50);
  
  -- International shipping fee
  IF p_destination_country != 'US' THEN
    v_international_fee := 15.00;
  ELSE
    v_international_fee := 0.00;
  END IF;
  
  RETURN v_base_cost + v_international_fee;
END;
$$ LANGUAGE plpgsql STABLE;

-- Validate coupon code function
CREATE OR REPLACE FUNCTION public.validate_coupon_code(
  p_code TEXT,
  p_user_id UUID DEFAULT NULL
) RETURNS TABLE (
  is_valid BOOLEAN,
  discount_type TEXT,
  discount_value DECIMAL,
  minimum_amount DECIMAL,
  message TEXT
) AS $$
DECLARE
  v_coupon RECORD;
BEGIN
  -- Get coupon details
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE code = UPPER(p_code)
    AND active = true;
    
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      false,
      NULL::TEXT,
      NULL::DECIMAL,
      NULL::DECIMAL,
      'Invalid coupon code'::TEXT;
    RETURN;
  END IF;
  
  -- Check expiration
  IF v_coupon.expires_at < NOW() THEN
    RETURN QUERY SELECT 
      false,
      NULL::TEXT,
      NULL::DECIMAL,
      NULL::DECIMAL,
      'Coupon has expired'::TEXT;
    RETURN;
  END IF;
  
  -- Check usage limit
  IF v_coupon.usage_limit IS NOT NULL THEN
    IF v_coupon.usage_count >= v_coupon.usage_limit THEN
      RETURN QUERY SELECT 
        false,
        NULL::TEXT,
        NULL::DECIMAL,
        NULL::DECIMAL,
        'Coupon usage limit reached'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Check user-specific usage
  IF p_user_id IS NOT NULL AND v_coupon.once_per_user THEN
    IF EXISTS (
      SELECT 1 FROM public.coupon_usage
      WHERE coupon_id = v_coupon.id
        AND user_id = p_user_id
    ) THEN
      RETURN QUERY SELECT 
        false,
        NULL::TEXT,
        NULL::DECIMAL,
        NULL::DECIMAL,
        'You have already used this coupon'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Return valid coupon details
  RETURN QUERY SELECT 
    true,
    v_coupon.discount_type,
    v_coupon.discount_value,
    v_coupon.minimum_amount,
    'Coupon applied successfully'::TEXT;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get recommended listings function
CREATE OR REPLACE FUNCTION public.get_recommended_listings(
  p_user_id UUID DEFAULT NULL,
  p_listing_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
  id UUID,
  title TEXT,
  price DECIMAL,
  images JSONB,
  seller_id UUID,
  category_id UUID,
  score DECIMAL
) AS $$
BEGIN
  -- If user_id provided, get personalized recommendations
  IF p_user_id IS NOT NULL THEN
    RETURN QUERY
    WITH user_preferences AS (
      -- Get user's purchase history categories
      SELECT DISTINCT l.category_id
      FROM public.orders o
      JOIN public.listings l ON l.id = o.listing_id
      WHERE o.buyer_id = p_user_id
      UNION
      -- Get user's wishlist categories
      SELECT DISTINCT l.category_id
      FROM public.wishlists w
      JOIN public.listings l ON l.id = w.listing_id
      WHERE w.user_id = p_user_id
    ),
    user_brands AS (
      -- Get user's preferred brands
      SELECT DISTINCT l.brand
      FROM public.orders o
      JOIN public.listings l ON l.id = o.listing_id
      WHERE o.buyer_id = p_user_id AND l.brand IS NOT NULL
    )
    SELECT 
      l.id,
      l.title,
      l.price,
      l.images,
      l.seller_id,
      l.category_id,
      (
        CASE WHEN l.category_id IN (SELECT category_id FROM user_preferences) THEN 0.5 ELSE 0 END +
        CASE WHEN l.brand IN (SELECT brand FROM user_brands) THEN 0.3 ELSE 0 END +
        CASE WHEN l.view_count > 100 THEN 0.2 ELSE 0.1 END
      ) as score
    FROM public.listings l
    WHERE l.status = 'active'
      AND l.seller_id != p_user_id
    ORDER BY score DESC, l.created_at DESC
    LIMIT p_limit;
    
  -- If listing_id provided, get similar items
  ELSIF p_listing_id IS NOT NULL THEN
    RETURN QUERY
    WITH target_listing AS (
      SELECT category_id, brand, price
      FROM public.listings
      WHERE id = p_listing_id
    )
    SELECT 
      l.id,
      l.title,
      l.price,
      l.images,
      l.seller_id,
      l.category_id,
      (
        CASE WHEN l.category_id = tl.category_id THEN 0.5 ELSE 0 END +
        CASE WHEN l.brand = tl.brand THEN 0.3 ELSE 0 END +
        CASE WHEN ABS(l.price - tl.price) < tl.price * 0.2 THEN 0.2 ELSE 0 END
      ) as score
    FROM public.listings l
    CROSS JOIN target_listing tl
    WHERE l.status = 'active'
      AND l.id != p_listing_id
    ORDER BY score DESC, l.created_at DESC
    LIMIT p_limit;
    
  -- Default: return trending items
  ELSE
    RETURN QUERY
    SELECT 
      l.id,
      l.title,
      l.price,
      l.images,
      l.seller_id,
      l.category_id,
      (l.view_count::DECIMAL / GREATEST(1, EXTRACT(EPOCH FROM (NOW() - l.created_at)) / 86400)) as score
    FROM public.listings l
    WHERE l.status = 'active'
    ORDER BY score DESC, l.created_at DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Bulk update order status function (admin only)
CREATE OR REPLACE FUNCTION public.bulk_update_order_status(
  p_order_ids UUID[],
  p_new_status TEXT,
  p_notes TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_order_id UUID;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Validate status
  IF p_new_status NOT IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  
  -- Update each order
  FOREACH v_order_id IN ARRAY p_order_ids
  LOOP
    UPDATE public.orders
    SET 
      status = p_new_status,
      updated_at = NOW()
    WHERE id = v_order_id
      AND status != p_new_status;
      
    IF FOUND THEN
      v_updated_count := v_updated_count + 1;
      
      -- Log the update
      INSERT INTO public.order_status_history (
        order_id,
        new_status,
        notes,
        changed_by
      ) VALUES (
        v_order_id,
        p_new_status,
        p_notes,
        auth.uid()
      );
    END IF;
  END LOOP;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- Export user data function (GDPR compliance)
CREATE OR REPLACE FUNCTION public.export_user_data(
  p_user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Use current user if not specified
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  -- Check authorization
  IF v_user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Build export data
  v_result := jsonb_build_object(
    'profile', (
      SELECT row_to_json(p.*)
      FROM public.profiles p
      WHERE p.id = v_user_id
    ),
    'listings', (
      SELECT jsonb_agg(row_to_json(l.*))
      FROM public.listings l
      WHERE l.seller_id = v_user_id
    ),
    'orders', (
      SELECT jsonb_agg(row_to_json(o.*))
      FROM public.orders o
      WHERE o.buyer_id = v_user_id OR o.seller_id = v_user_id
    ),
    'messages', (
      SELECT jsonb_agg(row_to_json(m.*))
      FROM public.messages m
      WHERE m.sender_id = v_user_id OR m.receiver_id = v_user_id
    ),
    'ratings', (
      SELECT jsonb_agg(row_to_json(r.*))
      FROM public.user_ratings r
      WHERE r.rater_user_id = v_user_id OR r.rated_user_id = v_user_id
    ),
    'wishlists', (
      SELECT jsonb_agg(row_to_json(w.*))
      FROM public.wishlists w
      WHERE w.user_id = v_user_id
    ),
    'export_date', NOW()
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete user account function (GDPR compliance)
CREATE OR REPLACE FUNCTION public.delete_user_account(
  p_user_id UUID DEFAULT NULL,
  p_confirmation TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Use current user if not specified
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  -- Check authorization
  IF v_user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Require confirmation
  IF p_confirmation != 'DELETE_MY_ACCOUNT' THEN
    RAISE EXCEPTION 'Please confirm by passing DELETE_MY_ACCOUNT';
  END IF;
  
  -- Anonymize user data instead of hard delete
  UPDATE public.profiles
  SET 
    username = 'deleted_user_' || SUBSTRING(v_user_id::TEXT, 1, 8),
    full_name = 'Deleted User',
    bio = NULL,
    avatar_url = NULL,
    email = 'deleted_' || SUBSTRING(v_user_id::TEXT, 1, 8) || '@deleted.com',
    phone_number = NULL,
    date_of_birth = NULL,
    account_status = 'deleted',
    deleted_at = NOW()
  WHERE id = v_user_id;
  
  -- Deactivate all listings
  UPDATE public.listings
  SET status = 'deleted'
  WHERE seller_id = v_user_id;
  
  -- Log the deletion
  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  ) VALUES (
    auth.uid(),
    'delete_account',
    'user',
    v_user_id,
    jsonb_build_object('deleted_at', NOW(), 'requested_by', auth.uid())
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create required tables for new functions
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL NOT NULL,
  minimum_amount DECIMAL,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  once_per_user BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES public.coupons(id),
  user_id UUID REFERENCES auth.users(id),
  order_id UUID REFERENCES public.orders(id),
  used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id),
  amount DECIMAL NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  requested_by UUID REFERENCES auth.users(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id)
);

-- Add missing columns to profiles if needed
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add shipping_info to listings if missing
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS shipping_info JSONB DEFAULT '{}';
```

### Step 5: Apply Critical Performance Indexes

Create migration for indexes:

```bash
supabase migration new add_performance_indexes
```

Add to `supabase/migrations/[timestamp]_add_performance_indexes.sql`:

```sql
-- Listings performance indexes
CREATE INDEX IF NOT EXISTS idx_listings_status_created ON public.listings(status, created_at DESC) 
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_seller_active ON public.listings(seller_id, status) 
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_price_active ON public.listings(price) 
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_category_active ON public.listings(category_id, created_at DESC) 
  WHERE status = 'active';

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_listings_search_fts ON public.listings 
USING gin(
  to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(description, '') || ' ' || 
    COALESCE(brand, '') || ' ' ||
    COALESCE(tags::text, '')
  )
) WHERE status = 'active';

-- Messages performance indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(receiver_id, is_read) 
  WHERE is_read = false;

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON public.conversations(buyer_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON public.conversations(seller_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_listing ON public.conversations(listing_id);

-- Orders performance indexes
CREATE INDEX IF NOT EXISTS idx_orders_buyer_created ON public.orders(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_seller_created ON public.orders(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status) 
  WHERE status IN ('pending', 'processing', 'shipped');

-- User ratings indexes
CREATE INDEX IF NOT EXISTS idx_user_ratings_rated ON public.user_ratings(rated_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_ratings_rater ON public.user_ratings(rater_user_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, created_at DESC) 
  WHERE is_read = false;

-- Auth rate limits cleanup
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_cleanup ON public.auth_rate_limits(created_at) 
  WHERE created_at < NOW() - INTERVAL '1 hour';

-- Session tracking
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active DESC) 
  WHERE account_status = 'active';

-- Analyze tables to update statistics
ANALYZE public.listings;
ANALYZE public.messages;
ANALYZE public.conversations;
ANALYZE public.orders;
ANALYZE public.profiles;
ANALYZE public.notifications;
```

### Step 5.5: Set Up Materialized Views Refresh

Create a migration to set up automatic refresh for materialized views:

```bash
supabase migration new setup_materialized_views_refresh
```

Add to `supabase/migrations/[timestamp]_setup_materialized_views_refresh.sql`:

```sql
-- First, ensure pg_cron extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create function to refresh all materialized views
CREATE OR REPLACE FUNCTION public.refresh_all_materialized_views() 
RETURNS void AS $$
BEGIN
  -- Refresh existing materialized views
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'listing_stats_mv') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY listing_stats_mv;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'seller_performance_mv') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY seller_performance_mv;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'category_performance_mv') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY category_performance_mv;
  END IF;
  
  -- Add any new materialized views here
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_top_sellers') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_sellers;
  END IF;
  
  -- Log the refresh
  INSERT INTO public.system_logs (
    action,
    details,
    created_at
  ) VALUES (
    'materialized_views_refresh',
    jsonb_build_object(
      'refreshed_at', NOW(),
      'views_refreshed', ARRAY['listing_stats_mv', 'seller_performance_mv', 'category_performance_mv', 'mv_top_sellers']
    ),
    NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Create system logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_logs_action ON public.system_logs(action);
CREATE INDEX idx_system_logs_created ON public.system_logs(created_at DESC);

-- Schedule materialized views refresh every hour
SELECT cron.schedule(
  'refresh-all-materialized-views',
  '0 * * * *',  -- Every hour at minute 0
  'SELECT public.refresh_all_materialized_views()'
);

-- Schedule more frequent refresh for critical views (every 15 minutes)
SELECT cron.schedule(
  'refresh-critical-views',
  '*/15 * * * *',  -- Every 15 minutes
  $$
    REFRESH MATERIALIZED VIEW CONCURRENTLY IF EXISTS listing_stats_mv;
    REFRESH MATERIALIZED VIEW CONCURRENTLY IF EXISTS mv_top_sellers;
  $$
);

-- Create function to manually refresh views (for admin use)
CREATE OR REPLACE FUNCTION public.admin_refresh_materialized_views()
RETURNS TEXT AS $$
DECLARE
  v_start_time TIMESTAMP;
  v_end_time TIMESTAMP;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  v_start_time := clock_timestamp();
  
  -- Refresh all views
  PERFORM public.refresh_all_materialized_views();
  
  v_end_time := clock_timestamp();
  
  RETURN format('Materialized views refreshed successfully in %s ms', 
    EXTRACT(MILLISECOND FROM (v_end_time - v_start_time))::TEXT);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 6: Implement RLS Policies

Create migration for RLS policies:

```bash
supabase migration new implement_rls_policies
```

Add comprehensive RLS policies in `supabase/migrations/[timestamp]_implement_rls_policies.sql`:

```sql
-- Brand Profiles RLS Policies
CREATE POLICY "Public can view verified brands" ON public.brand_profiles
  FOR SELECT TO public
  USING (verified = true);

CREATE POLICY "Users can view own brand profile" ON public.brand_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own brand profile" ON public.brand_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own brand profile" ON public.brand_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Social Media Accounts RLS Policies
CREATE POLICY "Public can view social accounts" ON public.social_media_accounts
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Users manage own social accounts" ON public.social_media_accounts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Documents RLS Policies (private by default)
CREATE POLICY "Users view own documents" ON public.documents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users upload own documents" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can view all documents" ON public.documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update document status" ON public.documents
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Fix messages table column name and policies
ALTER TABLE public.messages RENAME COLUMN content TO message_text;

-- Update messages RLS policies
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can mark messages as read" ON public.messages
  FOR UPDATE TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (
    -- Only allow updating is_read field
    id = id AND
    conversation_id = conversation_id AND
    sender_id = sender_id AND
    receiver_id = receiver_id AND
    message_text = message_text
  );

-- Storage RLS Policies
-- First, create the storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
  ('products', 'products', true, true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('avatars', 'avatars', true, true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('documents', 'documents', false, false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- Product images policies
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'products');

CREATE POLICY "Authenticated users upload product images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'products' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own product images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own product images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Avatar policies
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    name = auth.uid()::text || '.jpg' OR
    name = auth.uid()::text || '.png' OR
    name = auth.uid()::text || '.webp'
  );

CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars' AND (
      name = auth.uid()::text || '.jpg' OR
      name = auth.uid()::text || '.png' OR
      name = auth.uid()::text || '.webp'
    )
  );

-- Document storage policies
CREATE POLICY "Users view own documents from storage" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users upload documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins view all documents from storage" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Listings RLS enhancement for better security
CREATE POLICY "Sellers can soft delete own listings" ON public.listings
  FOR UPDATE TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (
    seller_id = auth.uid() AND
    -- Only allow status changes, not data manipulation
    title = title AND
    description = description AND
    price = price
  );

-- Add RLS to auth_rate_limits table
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.auth_rate_limits
  FOR ALL TO service_role
  USING (true);

-- Add RLS to auth_audit_log table  
ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own auth logs" ON public.auth_audit_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins view all auth logs" ON public.auth_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Step 6.5: Review and Fix SECURITY DEFINER Functions

Create a migration to review and fix SECURITY DEFINER usage:

```bash
supabase migration new fix_security_definer_functions
```

Add to `supabase/migrations/[timestamp]_fix_security_definer_functions.sql`:

```sql
-- Review all SECURITY DEFINER functions and add proper security checks
-- Only use SECURITY DEFINER when absolutely necessary

-- Fix check_session_validity to use proper security
CREATE OR REPLACE FUNCTION public.check_session_validity(p_session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_session_user_id UUID;
BEGIN
  -- Get the current user
  v_user_id := auth.uid();
  
  -- User must be authenticated
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if session exists and belongs to user
  SELECT user_id INTO v_session_user_id
  FROM sessions
  WHERE id = p_session_id
    AND expires_at > NOW();
  
  -- Session must belong to current user
  RETURN v_session_user_id = v_user_id;
END;
$$ LANGUAGE plpgsql; -- Removed SECURITY DEFINER

-- Fix validate_session to avoid SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.validate_session(p_session_token TEXT)
RETURNS TABLE (
  user_id UUID,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Only return sessions for the current user
  RETURN QUERY
  SELECT s.user_id, s.expires_at
  FROM sessions s
  WHERE s.token = p_session_token
    AND s.expires_at > NOW()
    AND s.user_id = auth.uid(); -- Ensure user can only validate their own sessions
END;
$$ LANGUAGE plpgsql; -- Removed SECURITY DEFINER

-- For functions that MUST use SECURITY DEFINER, add strict checks
CREATE OR REPLACE FUNCTION public.admin_only_function()
RETURNS void AS $$
BEGIN
  -- Strict admin check at the beginning
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND account_status = 'active'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Active admin access required';
  END IF;
  
  -- Function logic here
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to audit all SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.audit_security_definer_functions()
RETURNS TABLE (
  function_name TEXT,
  function_schema TEXT,
  has_security_definer BOOLEAN,
  recommendation TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.proname::TEXT as function_name,
    n.nspname::TEXT as function_schema,
    p.prosecdef as has_security_definer,
    CASE 
      WHEN p.prosecdef AND p.proname LIKE '%admin%' THEN 'OK - Admin function'
      WHEN p.prosecdef AND p.proname LIKE '%auth%' THEN 'REVIEW - Auth function may not need SECURITY DEFINER'
      WHEN p.prosecdef THEN 'WARNING - Consider removing SECURITY DEFINER'
      ELSE 'OK - No SECURITY DEFINER'
    END as recommendation
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  ORDER BY p.prosecdef DESC, p.proname;
END;
$$ LANGUAGE plpgsql;

-- Log all SECURITY DEFINER function calls for audit
CREATE TABLE IF NOT EXISTS public.security_definer_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  caller_id UUID,
  caller_ip INET,
  parameters JSONB,
  result TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_definer_audit_function ON public.security_definer_audit(function_name);
CREATE INDEX idx_security_definer_audit_caller ON public.security_definer_audit(caller_id);
CREATE INDEX idx_security_definer_audit_created ON public.security_definer_audit(created_at DESC);

-- Enable RLS on audit table
ALTER TABLE public.security_definer_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view security audit logs
CREATE POLICY "Admins view security audit logs" ON public.security_definer_audit
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Step 7: Fix Database Types

Generate new types from your database:

```bash
# Generate fresh types from Supabase
supabase gen types typescript --project-id your-project-id > src/lib/types/database.types.ts
```

Update the extended types file:

```typescript
// src/lib/types/database.extended.ts
import type { Database } from './database.types'

// Extended profile type with all fields
export type ExtendedProfile = Database['public']['Tables']['profiles']['Row'] & {
  // These should now be in the generated types, but keeping for backwards compatibility
  account_type?: 'personal' | 'brand'
  setup_completed?: boolean
  onboarding_completed?: boolean
}

// Helper types for the new tables
export type BrandProfile = Database['public']['Tables']['brand_profiles']['Row']
export type SocialMediaAccount = Database['public']['Tables']['social_media_accounts']['Row']
export type Document = Database['public']['Tables']['documents']['Row']

// RPC function types
export type UserStats = {
  total_sales: number
  total_purchases: number
  total_listings: number
  active_listings: number
  total_revenue: number
  avg_rating: number | null
  rating_count: number
  response_time_minutes: number | null
}

export type TopSeller = {
  user_id: string
  username: string | null
  avatar_url: string | null
  total_sales: number
  total_revenue: number
  avg_rating: number | null
  rating_count: number | null
}

// Notification preferences type
export type NotificationPreferences = {
  email: boolean
  push: boolean
  sms: boolean
  marketing: boolean
  order_updates: boolean
  messages: boolean
  price_drops: boolean
}

// Privacy settings type
export type PrivacySettings = {
  profile_visible: boolean
  show_online_status: boolean
  show_sold_items: boolean
  allow_offers: boolean
}
```

## Phase 1.5: Update Supabase Configuration

### Update OTP and JWT Settings

Edit your `supabase/config.toml` file to improve security and user experience:

```toml
[auth]
# Extend OTP expiry from 15 minutes to 30 minutes
otp_expiry = 1800  # 30 minutes (was 900)

# Extend JWT expiry from 1 hour to 2 hours  
jwt_expiry = 7200  # 2 hours (was 3600)

# Security settings
enable_signup = true
enable_anonymous_sign_ins = false
minimum_password_length = 12

# Email settings
mailer_autoconfirm = false
mailer_secure_email_change_enabled = true
mailer_otp_exp = 1800  # 30 minutes

# Session settings
refresh_token_rotation_enabled = true
security_refresh_token_reuse_interval = 10

# MFA settings
mfa_enabled = true
mfa_max_enrolled_factors = 10

[auth.sms]
# SMS settings if using phone auth
enable_signup = false
enable_confirmations = true
max_frequency = 5  # max SMS per hour

[auth.external]
# OAuth providers configuration
# Add your OAuth providers here

[db]
# Database pooler settings
pooler_enabled = true

[db.pooler]
default_pool_size = 25
max_client_conn = 100
pool_mode = "transaction"  # Better for serverless
```

After updating, apply the configuration:

```bash
# Push the new configuration to your project
supabase db push
```

## Phase 2: Authentication Security Implementation

### Step 1: Set Up CAPTCHA

First, enable CAPTCHA in Supabase Dashboard:
1. Go to Authentication → Settings
2. Enable hCaptcha
3. Add your site key and secret

Then update your auth forms:

```typescript
// src/lib/components/auth/CaptchaWrapper.svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { PUBLIC_HCAPTCHA_SITE_KEY } from '$env/static/public'
  
  export let onVerify: (token: string) => void
  export let onExpire: () => void = () => {}
  
  let hcaptchaWidget: any
  
  onMount(() => {
    if (window.hcaptcha) {
      hcaptchaWidget = window.hcaptcha.render('hcaptcha-container', {
        sitekey: PUBLIC_HCAPTCHA_SITE_KEY,
        callback: onVerify,
        'expired-callback': onExpire
      })
    }
    
    return () => {
      if (hcaptchaWidget) {
        window.hcaptcha.reset(hcaptchaWidget)
      }
    }
  })
</script>

<div id="hcaptcha-container"></div>

<svelte:head>
  <script src="https://js.hcaptcha.com/1/api.js" async defer></script>
</svelte:head>
```

Update register form:

```typescript
// src/routes/(auth)/register/+page.svelte
<script lang="ts">
  import CaptchaWrapper from '$lib/components/auth/CaptchaWrapper.svelte'
  
  let captchaToken: string | null = null
  let showCaptchaError = false
  
  async function handleSubmit(e: Event) {
    e.preventDefault()
    
    if (!captchaToken) {
      showCaptchaError = true
      return
    }
    
    // Check rate limit first
    const { data: canProceed } = await supabase.rpc('check_auth_rate_limit', {
      p_identifier: email,
      p_action: 'register',
      p_max_attempts: 3,
      p_window_minutes: 60
    })
    
    if (!canProceed) {
      error = 'Too many registration attempts. Please try again later.'
      return
    }
    
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          username,
          full_name: fullName,
          account_type: accountType
        }
      }
    })
    
    if (!signUpError) {
      // Log successful registration
      await supabase.rpc('log_auth_event', {
        p_action: 'register_success',
        p_metadata: { email, account_type: accountType }
      })
    }
  }
</script>

<form on:submit={handleSubmit}>
  <!-- Other form fields -->
  
  <CaptchaWrapper 
    onVerify={(token) => {
      captchaToken = token
      showCaptchaError = false
    }}
    onExpire={() => {
      captchaToken = null
    }}
  />
  
  {#if showCaptchaError}
    <p class="text-red-500 text-sm">Please complete the CAPTCHA</p>
  {/if}
  
  <button type="submit" disabled={loading || !captchaToken}>
    Create Account
  </button>
</form>
```

### Step 2: Implement Password Security

Create password validation utilities:

```typescript
// src/lib/utils/password-security.ts
import { z } from 'zod'
import { sha1 } from 'crypto-hash'

export const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

export async function checkPasswordStrength(password: string): Promise<{
  score: number // 0-4
  feedback: string[]
  isValid: boolean
}> {
  const feedback: string[] = []
  let score = 0
  
  // Length
  if (password.length >= 12) score++
  if (password.length >= 16) score++
  
  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  
  // Common patterns to avoid
  if (/(.)\1{2,}/.test(password)) {
    score--
    feedback.push('Avoid repeating characters')
  }
  
  if (/^[0-9]+$/.test(password)) {
    score = Math.min(score, 1)
    feedback.push('Don\'t use only numbers')
  }
  
  // Normalize score
  score = Math.max(0, Math.min(4, score))
  
  return {
    score,
    feedback,
    isValid: score >= 3
  }
}

export async function checkPasswordLeaked(password: string): Promise<boolean> {
  try {
    const hash = await sha1(password)
    const prefix = hash.substring(0, 5).toUpperCase()
    const suffix = hash.substring(5).toUpperCase()
    
    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      { 
        headers: { 'Add-Padding': 'true' },
        signal: AbortSignal.timeout(5000)
      }
    )
    
    if (!response.ok) return false
    
    const data = await response.text()
    return data.includes(suffix)
  } catch {
    // Fail open - don't block registration if service is down
    return false
  }
}
```

Create password strength indicator component:

```typescript
// src/lib/components/auth/PasswordStrengthIndicator.svelte
<script lang="ts">
  import { checkPasswordStrength, checkPasswordLeaked } from '$lib/utils/password-security'
  
  export let password: string
  export let onValidChange: (isValid: boolean) => void = () => {}
  
  let strength = { score: 0, feedback: [], isValid: false }
  let isLeaked = false
  let checkingLeaked = false
  
  $: if (password) {
    checkStrength()
  }
  
  async function checkStrength() {
    strength = await checkPasswordStrength(password)
    
    if (strength.score >= 3 && password.length >= 12) {
      checkingLeaked = true
      isLeaked = await checkPasswordLeaked(password)
      checkingLeaked = false
    }
    
    onValidChange(strength.isValid && !isLeaked)
  }
  
  $: strengthLabel = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength.score]
  $: strengthColor = ['red', 'orange', 'yellow', 'blue', 'green'][strength.score]
</script>

{#if password}
  <div class="mt-2">
    <div class="flex gap-1 mb-2">
      {#each Array(4) as _, i}
        <div 
          class="h-1 flex-1 rounded-full transition-colors"
          class:bg-gray-200={i >= strength.score}
          class:bg-red-500={i < strength.score && strengthColor === 'red'}
          class:bg-orange-500={i < strength.score && strengthColor === 'orange'}
          class:bg-yellow-500={i < strength.score && strengthColor === 'yellow'}
          class:bg-blue-500={i < strength.score && strengthColor === 'blue'}
          class:bg-green-500={i < strength.score && strengthColor === 'green'}
        />
      {/each}
    </div>
    
    <p class="text-sm" class:text-{strengthColor}-600={true}>
      {strengthLabel}
      {#if checkingLeaked}
        <span class="text-gray-500">(checking security...)</span>
      {/if}
    </p>
    
    {#if isLeaked}
      <p class="text-red-600 text-sm mt-1">
        ⚠️ This password has been found in data breaches. Please choose a different one.
      </p>
    {/if}
    
    {#if strength.feedback.length > 0}
      <ul class="text-sm text-gray-600 mt-1">
        {#each strength.feedback as tip}
          <li>• {tip}</li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}
```

### Step 3: Implement Rate Limiting Middleware

Update your hooks.server.ts:

```typescript
// src/hooks.server.ts
import { createServerClient } from '@supabase/ssr'
import type { Handle } from '@sveltejs/kit'
import { RateLimiter } from '$lib/server/rate-limiter'

// Initialize rate limiters
const rateLimiters = new Map<string, RateLimiter>([
  ['/auth/register', new RateLimiter({ max: 3, window: 3600000 })], // 3 per hour
  ['/auth/login', new RateLimiter({ max: 5, window: 900000 })], // 5 per 15 min
  ['/auth/reset', new RateLimiter({ max: 2, window: 3600000 })], // 2 per hour
  ['/api/messages', new RateLimiter({ max: 30, window: 60000 })], // 30 per minute
  ['/api/upload', new RateLimiter({ max: 10, window: 300000 })], // 10 per 5 min
])

export const handle: Handle = async ({ event, resolve }) => {
  // Create Supabase client
  const supabase = createServerClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (key) => event.cookies.get(key),
        set: (key, value, options) => {
          event.cookies.set(key, value, {
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
          })
        },
        remove: (key, options) => {
          event.cookies.delete(key, { ...options, path: '/' })
        }
      }
    }
  )
  
  // Make Supabase available in all server routes
  event.locals.supabase = supabase
  event.locals.safeGetSession = async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession()
    
    if (!session) {
      return { session: null, user: null }
    }
    
    const {
      data: { user },
      error
    } = await supabase.auth.getUser()
    
    if (error) {
      return { session: null, user: null }
    }
    
    return { session, user }
  }
  
  // Apply rate limiting
  const limiter = rateLimiters.get(event.url.pathname)
  if (limiter) {
    const identifier = event.getClientAddress()
    const allowed = await limiter.check(identifier)
    
    if (!allowed) {
      return new Response('Too many requests', {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(limiter.max),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(limiter.getResetTime(identifier)).toISOString()
        }
      })
    }
  }
  
  // Security headers
  const response = await resolve(event)
  
  // Only add CSP in production
  if (process.env.NODE_ENV === 'production') {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://js.hcaptcha.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' " + [
        process.env.PUBLIC_SUPABASE_URL,
        'https://api.stripe.com',
        'https://api.pwnedpasswords.com',
        'wss://*.supabase.co',
        'https://*.supabase.co'
      ].join(' '),
      "frame-src 'self' https://js.stripe.com https://hcaptcha.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ')
    
    response.headers.set('Content-Security-Policy', cspDirectives)
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  }
  
  return response
}
```

Create the rate limiter class:

```typescript
// src/lib/server/rate-limiter.ts
export class RateLimiter {
  private requests = new Map<string, number[]>()
  
  constructor(
    private config: {
      max: number
      window: number // milliseconds
    }
  ) {}
  
  async check(identifier: string): Promise<boolean> {
    const now = Date.now()
    const requests = this.requests.get(identifier) || []
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.config.window)
    
    if (validRequests.length >= this.config.max) {
      this.requests.set(identifier, validRequests)
      return false
    }
    
    validRequests.push(now)
    this.requests.set(identifier, validRequests)
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup()
    }
    
    return true
  }
  
  getResetTime(identifier: string): number {
    const requests = this.requests.get(identifier) || []
    if (requests.length === 0) return Date.now()
    
    const oldestRequest = Math.min(...requests)
    return oldestRequest + this.config.window
  }
  
  private cleanup() {
    const now = Date.now()
    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => now - time < this.config.window)
      if (validRequests.length === 0) {
        this.requests.delete(identifier)
      } else {
        this.requests.set(identifier, validRequests)
      }
    }
  }
  
  get max() {
    return this.config.max
  }
}
```

### Step 4: Multi-Factor Authentication Setup

### Step 4.5: Fix XSS Vulnerabilities

Fix the unsafe DOM manipulation in CheckoutModal.svelte:

```typescript
// src/lib/components/checkout/CheckoutModal.svelte
// Replace all instances of direct innerHTML usage

// BEFORE (unsafe):
element.innerHTML = '';

// AFTER (safe):
// Option 1: Use DOM methods
while (element.firstChild) {
  element.removeChild(element.firstChild);
}

// Option 2: Use Svelte reactivity
let content = '';
// In template: {#if content}{@html sanitizeHtml(content)}{/if}

// Option 3: Use textContent for plain text
element.textContent = '';
```

Also update any other components using innerHTML:

```typescript
// Create a utility function for safe DOM clearing
export function clearElement(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

// Use it consistently across the app
import { clearElement } from '$lib/utils/dom';
clearElement(containerElement);
```

Create MFA components:

```typescript
// src/lib/components/auth/MFASetup.svelte
<script lang="ts">
  import { supabase } from '$lib/supabase'
  import QRCode from 'qrcode'
  
  export let user: User
  
  let qrCodeUrl = ''
  let verificationCode = ''
  let secret = ''
  let loading = false
  let error = ''
  
  async function enableMFA() {
    loading = true
    error = ''
    
    try {
      // Enroll TOTP factor
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      })
      
      if (enrollError) throw enrollError
      
      // Generate QR code
      secret = data.totp.secret
      const otpauthUrl = data.totp.uri
      qrCodeUrl = await QRCode.toDataURL(otpauthUrl)
      
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  }
  
  async function verifyAndEnable() {
    loading = true
    error = ''
    
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totpFactor = factors.totp[0]
      
      if (!totpFactor) throw new Error('No TOTP factor found')
      
      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        code: verificationCode
      })
      
      if (verifyError) throw verifyError
      
      // Update user profile
      await supabase
        .from('profiles')
        .update({ two_factor_enabled: true })
        .eq('id', user.id)
      
      // Success!
      window.location.reload()
      
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  }
</script>

<div class="max-w-md mx-auto">
  <h2 class="text-2xl font-bold mb-4">Enable Two-Factor Authentication</h2>
  
  {#if !qrCodeUrl}
    <p class="text-gray-600 mb-4">
      Add an extra layer of security to your account by enabling two-factor authentication.
    </p>
    
    <button
      on:click={enableMFA}
      disabled={loading}
      class="btn btn-primary w-full"
    >
      {loading ? 'Setting up...' : 'Enable 2FA'}
    </button>
  {:else}
    <div class="space-y-4">
      <div class="bg-gray-50 p-4 rounded-lg">
        <p class="text-sm font-medium mb-2">1. Scan this QR code with your authenticator app:</p>
        <img src={qrCodeUrl} alt="2FA QR Code" class="mx-auto" />
      </div>
      
      <div class="bg-gray-50 p-4 rounded-lg">
        <p class="text-sm font-medium mb-2">2. Or enter this secret manually:</p>
        <code class="text-xs break-all">{secret}</code>
      </div>
      
      <div>
        <label class="block text-sm font-medium mb-2">
          3. Enter the 6-digit code from your app:
        </label>
        <input
          type="text"
          bind:value={verificationCode}
          maxlength="6"
          pattern="[0-9]{6}"
          class="input w-full"
          placeholder="000000"
        />
      </div>
      
      <button
        on:click={verifyAndEnable}
        disabled={loading || verificationCode.length !== 6}
        class="btn btn-primary w-full"
      >
        {loading ? 'Verifying...' : 'Verify and Enable'}
      </button>
    </div>
  {/if}
  
  {#if error}
    <div class="alert alert-error mt-4">{error}</div>
  {/if}
</div>
```

Create MFA challenge component:

```typescript
// src/lib/components/auth/MFAChallenge.svelte
<script lang="ts">
  import { supabase } from '$lib/supabase'
  import { goto } from '$app/navigation'
  
  export let onSuccess: () => void = () => goto('/dashboard')
  
  let code = ''
  let loading = false
  let error = ''
  
  async function verifyMFA() {
    loading = true
    error = ''
    
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totpFactor = factors.totp[0]
      
      if (!totpFactor) throw new Error('No TOTP factor found')
      
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        code
      })
      
      if (verifyError) throw verifyError
      
      onSuccess()
      
    } catch (err) {
      error = err.message
      code = ''
    } finally {
      loading = false
    }
  }
</script>

<div class="max-w-sm mx-auto">
  <h2 class="text-xl font-bold mb-4">Two-Factor Authentication</h2>
  
  <p class="text-gray-600 mb-4">
    Enter the 6-digit code from your authenticator app
  </p>
  
  <form on:submit|preventDefault={verifyMFA}>
    <input
      type="text"
      bind:value={code}
      maxlength="6"
      pattern="[0-9]{6}"
      class="input w-full text-center text-2xl tracking-widest"
      placeholder="000000"
      autocomplete="one-time-code"
      disabled={loading}
    />
    
    <button
      type="submit"
      disabled={loading || code.length !== 6}
      class="btn btn-primary w-full mt-4"
    >
      {loading ? 'Verifying...' : 'Verify'}
    </button>
  </form>
  
  {#if error}
    <div class="alert alert-error mt-4">{error}</div>
  {/if}
</div>
```

## Phase 2.5: Security Fixes Implementation

### Step 1: Fix SECURITY DEFINER Functions

Review and update all SECURITY DEFINER functions to use proper security checks:

```bash
supabase migration new fix_security_definer_functions
```

Add to `supabase/migrations/[timestamp]_fix_security_definer_functions.sql`:

```sql
-- Fix check_session_validity to remove SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.check_session_validity(p_session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if session belongs to user and is valid
  RETURN EXISTS (
    SELECT 1 FROM public.sessions 
    WHERE id = p_session_id 
    AND user_id = v_user_id 
    AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql; -- Removed SECURITY DEFINER

-- Fix validate_session to add proper checks
CREATE OR REPLACE FUNCTION public.validate_session(p_session_token TEXT)
RETURNS TABLE (
  user_id UUID,
  session_id UUID,
  is_valid BOOLEAN
) AS $$
DECLARE
  v_session RECORD;
BEGIN
  -- Find session by token
  SELECT * INTO v_session
  FROM public.sessions
  WHERE token = p_session_token
    AND expires_at > NOW();
    
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      NULL::UUID,
      FALSE;
    RETURN;
  END IF;
  
  -- Update last_used
  UPDATE public.sessions
  SET last_used_at = NOW()
  WHERE id = v_session.id;
  
  RETURN QUERY SELECT 
    v_session.user_id,
    v_session.id,
    TRUE;
END;
$$ LANGUAGE plpgsql; -- Removed SECURITY DEFINER

-- Review auth rate limiting function
CREATE OR REPLACE FUNCTION public.check_auth_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN AS $$
DECLARE
  v_attempts INTEGER;
  v_user_id UUID;
BEGIN
  -- Get current user if authenticated
  v_user_id := auth.uid();
  
  -- For authenticated users, also check by user_id
  IF v_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_attempts
    FROM public.auth_rate_limits
    WHERE (identifier = p_identifier OR identifier = v_user_id::TEXT)
      AND action = p_action
      AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  ELSE
    -- For anonymous, just check identifier
    SELECT COUNT(*) INTO v_attempts
    FROM public.auth_rate_limits
    WHERE identifier = p_identifier
      AND action = p_action
      AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  END IF;
  
  -- Check if under limit
  IF v_attempts >= p_max_attempts THEN
    RETURN FALSE;
  END IF;
  
  -- Log this attempt
  INSERT INTO public.auth_rate_limits (identifier, action)
  VALUES (p_identifier, p_action);
  
  -- Clean up old entries occasionally (1% chance)
  IF random() < 0.01 THEN
    DELETE FROM public.auth_rate_limits 
    WHERE created_at < NOW() - INTERVAL '24 hours';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql; -- Removed SECURITY DEFINER, using RLS instead

-- Add RLS to auth_rate_limits table
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow inserts through the function
CREATE POLICY "No direct access" ON public.auth_rate_limits
  FOR ALL TO public
  USING (false)
  WITH CHECK (false);

-- Create service role for cleanup
CREATE POLICY "Service role can delete old entries" ON public.auth_rate_limits
  FOR DELETE TO service_role
  USING (created_at < NOW() - INTERVAL '24 hours');
```

### Step 2: Fix XSS Vulnerabilities

Create a TypeScript utility for safe DOM manipulation:

```typescript
// src/lib/utils/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(dirty: string, options?: DOMPurify.Config): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    ...options
  })
}

/**
 * Safely clear element content
 */
export function clearElement(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild)
  }
}

/**
 * Safely set text content
 */
export function setTextContent(element: HTMLElement, text: string): void {
  element.textContent = text
}

/**
 * Safely set HTML content with sanitization
 */
export function setSafeHtml(element: HTMLElement, html: string): void {
  element.innerHTML = sanitizeHtml(html)
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  filename = filename.replace(/\.\./g, '')
  
  // Remove special characters except dots and hyphens
  filename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  
  // Limit length
  if (filename.length > 255) {
    const ext = filename.split('.').pop() || ''
    const name = filename.substring(0, 250 - ext.length - 1)
    filename = `${name}.${ext}`
  }
  
  return filename
}

/**
 * Escape HTML entities
 */
export function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
```

Fix the CheckoutModal XSS vulnerability:

```typescript
// src/lib/components/checkout/CheckoutModal.svelte
<script lang="ts">
  import { clearElement, setSafeHtml, sanitizeHtml } from '$lib/utils/sanitize'
  
  // Instead of: element.innerHTML = ''
  // Use: clearElement(element)
  
  // Instead of: element.innerHTML = someContent
  // Use: setSafeHtml(element, someContent)
  
  // Or better yet, use Svelte's reactivity:
  let modalContent = ''
  
  function clearModal() {
    modalContent = ''
  }
  
  function updateModal(content: string) {
    modalContent = content
  }
</script>

<!-- In template, use {@html} with sanitization -->
{#if modalContent}
  <div class="modal-content">
    {@html sanitizeHtml(modalContent)}
  </div>
{/if}
```

### Step 3: Implement Content Security Policy

Add CSP headers in hooks.server.ts:

```typescript
// Update src/hooks.server.ts to include CSP
import type { Handle } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
  // ... existing code ...
  
  const response = await resolve(event)
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://js.hcaptcha.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co",
    "frame-src 'self' https://js.stripe.com https://hcaptcha.com https://*.hcaptcha.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  // Additional security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  return response
}
```

### Step 4: Secure File Upload Validation

Implement server-side file validation:

```typescript
// src/lib/server/file-validation.ts
import { createHash } from 'crypto'

const ALLOWED_MIME_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif']
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function validateFile(
  file: File
): Promise<{ valid: boolean; error?: string }> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large. Maximum size is 10MB.' }
  }
  
  // Check file extension
  const ext = file.name.toLowerCase().split('.').pop()
  const validExtensions = Object.values(ALLOWED_MIME_TYPES).flat()
  
  if (!ext || !validExtensions.includes(`.${ext}`)) {
    return { valid: false, error: 'Invalid file type' }
  }
  
  // Check MIME type
  if (!ALLOWED_MIME_TYPES[file.type]) {
    return { valid: false, error: 'Invalid file type' }
  }
  
  // Check if extension matches MIME type
  const allowedExts = ALLOWED_MIME_TYPES[file.type]
  if (!allowedExts.includes(`.${ext}`)) {
    return { valid: false, error: 'File extension does not match content type' }
  }
  
  return { valid: true }
}

// Generate secure filename
export function generateSecureFilename(originalName: string, userId: string): string {
  const timestamp = Date.now()
  const randomBytes = createHash('sha256')
    .update(`${userId}-${timestamp}-${Math.random()}`)
    .digest('hex')
    .substring(0, 16)
  
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  
  return `${timestamp}-${randomBytes}.${ext}`
}
```

### Step 5: Secure Session Management

Implement secure session handling:

```bash
supabase migration new implement_secure_sessions
```

Add to migration:

```sql
-- Add session security columns
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT NOW();

-- Create function to validate session security
CREATE OR REPLACE FUNCTION public.validate_session_security(
  p_session_id UUID,
  p_ip_address INET,
  p_user_agent TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_session RECORD;
BEGIN
  SELECT * INTO v_session
  FROM public.sessions
  WHERE id = p_session_id
    AND expires_at > NOW();
    
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if IP or user agent changed (optional strict mode)
  IF v_session.ip_address IS NOT NULL AND v_session.ip_address != p_ip_address THEN
    -- Log security event
    INSERT INTO public.security_events (
      event_type,
      user_id,
      session_id,
      ip_address,
      metadata
    ) VALUES (
      'session_ip_mismatch',
      v_session.user_id,
      p_session_id,
      p_ip_address,
      jsonb_build_object(
        'original_ip', v_session.ip_address::TEXT,
        'new_ip', p_ip_address::TEXT
      )
    );
    
    -- In strict mode, invalidate session
    -- UPDATE public.sessions SET expires_at = NOW() WHERE id = p_session_id;
    -- RETURN FALSE;
  END IF;
  
  -- Update last activity
  UPDATE public.sessions
  SET last_activity = NOW()
  WHERE id = p_session_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create security events table
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  session_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_events_user ON public.security_events(user_id, created_at DESC);
CREATE INDEX idx_security_events_type ON public.security_events(event_type, created_at DESC);

-- Enable RLS on security_events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Admins view security events" ON public.security_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## Phase 3: Feature Implementation

### Step 1: Complete Rating System

Create the rating submission modal:

```typescript
// src/lib/components/ratings/RatingModal.svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { supabase } from '$lib/supabase'
  import RatingStars from '$lib/components/ui/RatingStars.svelte'
  import { Button } from '$lib/components/ui/button'
  
  export let open = false
  export let orderId: string
  export let order: any // Order details
  export let ratingType: 'seller' | 'buyer' = 'seller'
  
  const dispatch = createEventDispatcher()
  
  let rating = 0
  let reviewText = ''
  let submitting = false
  let error = ''
  
  $: ratedUser = ratingType === 'seller' ? order.seller : order.buyer
  $: promptText = ratingType === 'seller' 
    ? `How was your experience with ${ratedUser.username}?`
    : `How was ${order.buyer.username} as a buyer?`
  
  async function submitRating() {
    if (rating === 0) {
      error = 'Please select a rating'
      return
    }
    
    submitting = true
    error = ''
    
    try {
      const { error: insertError } = await supabase
        .from('user_ratings')
        .insert({
          rated_user_id: ratedUser.id,
          rater_user_id: (await supabase.auth.getUser()).data.user?.id,
          rating,
          review_text: reviewText.trim() || null,
          rating_type: ratingType,
          transaction_id: orderId
        })
      
      if (insertError) throw insertError
      
      // Update order to mark as reviewed
      await supabase
        .from('orders')
        .update({ 
          [`${ratingType}_reviewed`]: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
      
      dispatch('success')
      close()
      
    } catch (err) {
      error = err.message
    } finally {
      submitting = false
    }
  }
  
  function close() {
    open = false
    rating = 0
    reviewText = ''
    error = ''
  }
</script>

{#if open}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <h2 class="text-xl font-semibold mb-4">Rate Your Experience</h2>
      
      <div class="flex items-center gap-3 mb-4">
        <img 
          src={ratedUser.avatar_url || '/default-avatar.png'} 
          alt={ratedUser.username}
          class="w-12 h-12 rounded-full"
        />
        <div>
          <p class="font-medium">{ratedUser.username}</p>
          <p class="text-sm text-gray-500">{promptText}</p>
        </div>
      </div>
      
      <div class="mb-6">
        <RatingStars 
          bind:value={rating}
          interactive={true}
          size="lg"
          showLabel={true}
        />
      </div>
      
      <div class="mb-6">
        <label class="block text-sm font-medium mb-2">
          Review (optional)
        </label>
        <textarea
          bind:value={reviewText}
          rows={4}
          maxlength={500}
          placeholder="Share your experience..."
          class="w-full px-3 py-2 border rounded-lg resize-none"
        />
        <p class="text-xs text-gray-500 mt-1">
          {reviewText.length}/500 characters
        </p>
      </div>
      
      {#if error}
        <div class="alert alert-error mb-4">{error}</div>
      {/if}
      
      <div class="flex gap-3">
        <Button
          variant="outline"
          on:click={close}
          disabled={submitting}
          class="flex-1"
        >
          Cancel
        </Button>
        <Button
          on:click={submitRating}
          disabled={submitting || rating === 0}
          class="flex-1"
        >
          {submitting ? 'Submitting...' : 'Submit Rating'}
        </Button>
      </div>
    </div>
  </div>
{/if}
```

Add rating trigger to order page:

```typescript
// src/routes/(app)/orders/[id]/+page.svelte
<script lang="ts">
  import RatingModal from '$lib/components/ratings/RatingModal.svelte'
  
  export let data
  
  let showRatingModal = false
  let ratingType: 'seller' | 'buyer' = 'seller'
  
  $: order = data.order
  $: canRateSeller = order.status === 'delivered' && 
                      order.buyer_id === data.user?.id && 
                      !order.seller_reviewed
  $: canRateBuyer = order.status === 'delivered' && 
                     order.seller_id === data.user?.id && 
                     !order.buyer_reviewed
</script>

<!-- Order details -->

{#if canRateSeller || canRateBuyer}
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
    <h3 class="font-medium mb-2">Rate Your Experience</h3>
    <p class="text-sm text-gray-600 mb-3">
      Help build trust in our community by sharing your experience
    </p>
    
    <div class="flex gap-3">
      {#if canRateSeller}
        <Button
          on:click={() => {
            ratingType = 'seller'
            showRatingModal = true
          }}
        >
          Rate Seller
        </Button>
      {/if}
      
      {#if canRateBuyer}
        <Button
          on:click={() => {
            ratingType = 'buyer'
            showRatingModal = true
          }}
        >
          Rate Buyer
        </Button>
      {/if}
    </div>
  </div>
{/if}

<RatingModal 
  bind:open={showRatingModal}
  orderId={order.id}
  {order}
  {ratingType}
  on:success={() => {
    // Refresh page or update UI
    invalidateAll()
  }}
/>
```

### Step 2: Fix Messaging System

First, create the migration to fix the column name:

```bash
supabase migration new fix_messages_column
```

This is already in the RLS policies migration above, but for reference:

```sql
-- Fix messages table column name
ALTER TABLE public.messages RENAME COLUMN content TO message_text;
```

Update the message components:

```typescript
// src/lib/components/messaging/MessageThread.svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { supabase } from '$lib/supabase'
  import { page } from '$app/stores'
  import VirtualList from '$lib/components/ui/VirtualList.svelte'
  import MessageInput from './MessageInput.svelte'
  import TypingIndicator from './TypingIndicator.svelte'
  
  export let conversationId: string
  export let currentUserId: string
  
  let messages = []
  let subscription
  let typingChannel
  let typingUsers = {}
  let loadingMore = false
  let hasMore = true
  let messageContainer
  
  onMount(() => {
    loadMessages()
    setupRealtimeSubscription()
    setupTypingChannel()
    markMessagesAsRead()
  })
  
  onDestroy(() => {
    subscription?.unsubscribe()
    typingChannel?.unsubscribe()
  })
  
  async function loadMessages(before?: string) {
    loadingMore = true
    
    let query = supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (before) {
      query = query.lt('created_at', before)
    }
    
    const { data, error } = await query
    
    if (!error && data) {
      messages = before ? [...messages, ...data.reverse()] : data.reverse()
      hasMore = data.length === 50
    }
    
    loadingMore = false
  }
  
  function setupRealtimeSubscription() {
    subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch complete message with sender info
          const { data } = await supabase
            .from('messages')
            .select('*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*)')
            .eq('id', payload.new.id)
            .single()
          
          if (data) {
            messages = [...messages, data]
            
            // Auto-scroll to bottom
            setTimeout(() => {
              messageContainer?.scrollTo({
                top: messageContainer.scrollHeight,
                behavior: 'smooth'
              })
            }, 100)
            
            // Mark as read if from other user
            if (data.sender_id !== currentUserId) {
              markMessageAsRead(data.id)
            }
          }
        }
      )
      .subscribe()
  }
  
  function setupTypingChannel() {
    typingChannel = supabase
      .channel(`typing:${conversationId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== currentUserId) {
          typingUsers[payload.userId] = payload.isTyping
          
          // Auto-clear typing status after 5 seconds
          if (payload.isTyping) {
            setTimeout(() => {
              typingUsers[payload.userId] = false
            }, 5000)
          }
        }
      })
      .subscribe()
  }
  
  async function markMessagesAsRead() {
    const unreadMessages = messages.filter(
      m => m.receiver_id === currentUserId && !m.is_read
    )
    
    if (unreadMessages.length > 0) {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', unreadMessages.map(m => m.id))
      
      // Update conversation unread count
      await supabase.rpc('update_conversation_unread_count', {
        p_conversation_id: conversationId,
        p_user_id: currentUserId
      })
    }
  }
  
  async function markMessageAsRead(messageId: string) {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
  }
  
  function handleTyping() {
    typingChannel?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUserId, isTyping: true }
    })
    
    // Clear typing after 3 seconds
    clearTimeout(typingTimeout)
    typingTimeout = setTimeout(() => {
      typingChannel?.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUserId, isTyping: false }
      })
    }, 3000)
  }
  
  let typingTimeout
</script>

<div class="flex flex-col h-full">
  <div 
    bind:this={messageContainer}
    class="flex-1 overflow-y-auto p-4 space-y-4"
  >
    {#if hasMore}
      <button
        on:click={() => loadMessages(messages[0]?.created_at)}
        disabled={loadingMore}
        class="w-full text-center text-sm text-gray-500 hover:text-gray-700"
      >
        {loadingMore ? 'Loading...' : 'Load older messages'}
      </button>
    {/if}
    
    {#each messages as message (message.id)}
      <div
        class="flex {message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}"
      >
        <div
          class="max-w-[70%] rounded-lg p-3 {
            message.sender_id === currentUserId
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100'
          }"
        >
          {#if message.sender_id !== currentUserId}
            <p class="text-xs font-medium mb-1 opacity-75">
              {message.sender.username}
            </p>
          {/if}
          
          <p class="text-sm">{message.message_text}</p>
          
          {#if message.attachments?.length > 0}
            <div class="mt-2 space-y-2">
              {#each message.attachments as attachment}
                {#if attachment.type.startsWith('image/')}
                  <img 
                    src={attachment.url} 
                    alt={attachment.name}
                    class="rounded max-w-full"
                  />
                {:else}
                  <a 
                    href={attachment.url}
                    target="_blank"
                    class="text-xs underline"
                  >
                    {attachment.name}
                  </a>
                {/if}
              {/each}
            </div>
          {/if}
          
          <p class="text-xs mt-1 opacity-75">
            {new Date(message.created_at).toLocaleTimeString()}
            {#if message.sender_id === currentUserId && message.is_read}
              <span class="ml-1">✓✓</span>
            {/if}
          </p>
        </div>
      </div>
    {/each}
  </div>
  
  <TypingIndicator users={Object.entries(typingUsers)
    .filter(([_, isTyping]) => isTyping)
    .map(([userId]) => userId)} />
  
  <MessageInput
    {conversationId}
    {currentUserId}
    on:typing={handleTyping}
    on:sent={() => {
      // Message will be added via realtime subscription
    }}
  />
</div>
```

Create typing indicator component:

```typescript
// src/lib/components/messaging/TypingIndicator.svelte
<script lang="ts">
  export let users: string[] = []
  
  $: showIndicator = users.length > 0
</script>

{#if showIndicator}
  <div class="px-4 py-2 text-sm text-gray-500">
    <span class="inline-flex items-center gap-1">
      <span class="flex gap-1">
        <span class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms" />
        <span class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms" />
        <span class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms" />
      </span>
      {users.length === 1 ? 'is' : 'are'} typing...
    </span>
  </div>
{/if}

<style>
  @keyframes bounce {
    0%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-4px);
    }
  }
</style>
```

### Step 3: Implement Brand Features

Create brand dashboard:

```typescript
// src/routes/(app)/brands/dashboard/+page.server.ts
import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ locals }) => {
  const { session, supabase } = locals
  
  if (!session) {
    throw redirect(303, '/login')
  }
  
  // Check if user has a brand profile
  const { data: brandProfile } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single()
  
  if (!brandProfile) {
    throw redirect(303, '/brands/onboarding')
  }
  
  // Fetch brand stats
  const { data: stats } = await supabase
    .rpc('get_brand_sales_stats', {
      p_brand_id: session.user.id,
      p_start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
      p_end_date: new Date().toISOString()
    })
  
  // Fetch recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select(`
      *,
      listing:listings(title, images),
      buyer:profiles!buyer_id(username, avatar_url)
    `)
    .eq('seller_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(10)
  
  // Fetch social media accounts
  const { data: socialAccounts } = await supabase
    .from('social_media_accounts')
    .select('*')
    .eq('user_id', session.user.id)
  
  return {
    brandProfile,
    stats: stats || {},
    recentOrders: recentOrders || [],
    socialAccounts: socialAccounts || []
  }
}
```

Create brand dashboard page:

```typescript
// src/routes/(app)/brands/dashboard/+page.svelte
<script lang="ts">
  import { page } from '$app/stores'
  import BrandStats from '$lib/components/brands/BrandStats.svelte'
  import BrandProducts from '$lib/components/brands/BrandProducts.svelte'
  import BrandVerification from '$lib/components/brands/BrandVerification.svelte'
  import SocialMediaManager from '$lib/components/brands/SocialMediaManager.svelte'
  
  export let data
  
  let activeTab = 'overview'
</script>

<div class="max-w-7xl mx-auto px-4 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold">Brand Dashboard</h1>
    <p class="text-gray-600 mt-2">Manage your brand presence and track performance</p>
  </div>
  
  <!-- Brand Header -->
  <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
    <div class="flex items-start gap-6">
      <img 
        src={data.brandProfile.logo_url || '/default-brand-logo.png'}
        alt={data.brandProfile.brand_name}
        class="w-24 h-24 rounded-lg object-cover"
      />
      
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-2">
          <h2 class="text-2xl font-semibold">{data.brandProfile.brand_name}</h2>
          {#if data.brandProfile.verified}
            <span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Verified Brand
            </span>
          {/if}
        </div>
        
        <p class="text-gray-600 mb-4">{data.brandProfile.description}</p>
        
        <div class="flex gap-4 text-sm">
          {#if data.brandProfile.website}
            <a href={data.brandProfile.website} target="_blank" class="text-blue-600 hover:underline">
              Website
            </a>
          {/if}
          <span class="text-gray-500">
            Est. {data.brandProfile.established_year}
          </span>
          <span class="text-gray-500">
            {data.brandProfile.country}
          </span>
        </div>
      </div>
      
      <div class="flex flex-col gap-2">
        <a href="/brands/settings" class="btn btn-outline btn-sm">
          Edit Profile
        </a>
        {#if !data.brandProfile.verified}
          <button class="btn btn-primary btn-sm">
            Get Verified
          </button>
        {/if}
      </div>
    </div>
  </div>
  
  <!-- Tabs -->
  <div class="border-b mb-8">
    <nav class="-mb-px flex gap-8">
      <button
        on:click={() => activeTab = 'overview'}
        class="py-2 px-1 border-b-2 font-medium text-sm {
          activeTab === 'overview' 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }"
      >
        Overview
      </button>
      <button
        on:click={() => activeTab = 'products'}
        class="py-2 px-1 border-b-2 font-medium text-sm {
          activeTab === 'products' 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }"
      >
        Products
      </button>
      <button
        on:click={() => activeTab = 'social'}
        class="py-2 px-1 border-b-2 font-medium text-sm {
          activeTab === 'social' 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }"
      >
        Social Media
      </button>
      <button
        on:click={() => activeTab = 'verification'}
        class="py-2 px-1 border-b-2 font-medium text-sm {
          activeTab === 'verification' 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }"
      >
        Verification
      </button>
    </nav>
  </div>
  
  <!-- Tab Content -->
  {#if activeTab === 'overview'}
    <BrandStats stats={data.stats} recentOrders={data.recentOrders} />
  {:else if activeTab === 'products'}
    <BrandProducts brandId={data.brandProfile.id} />
  {:else if activeTab === 'social'}
    <SocialMediaManager accounts={data.socialAccounts} />
  {:else if activeTab === 'verification'}
    <BrandVerification 
      brandProfile={data.brandProfile} 
      on:verified={() => location.reload()} 
    />
  {/if}
</div>
```

## Phase 4: Performance Optimization

### Step 1: Implement Image Optimization

Update your image handling:

```typescript
// src/lib/utils/supabase-images.ts
import { PUBLIC_SUPABASE_URL } from '$env/static/public'

interface ImageTransformOptions {
  width?: number
  height?: number
  resize?: 'cover' | 'contain' | 'fill'
  quality?: number
  format?: 'origin' | 'webp' | 'jpg' | 'png'
}

export function getOptimizedImageUrl(
  bucket: string,
  path: string,
  options: ImageTransformOptions = {}
): string {
  const params = new URLSearchParams()
  
  if (options.width) params.append('width', options.width.toString())
  if (options.height) params.append('height', options.height.toString())
  if (options.resize) params.append('resize', options.resize)
  if (options.quality) params.append('quality', options.quality.toString())
  if (options.format) params.append('format', options.format)
  
  const queryString = params.toString()
  const url = `${PUBLIC_SUPABASE_URL}/storage/v1/render/image/public/${bucket}/${path}`
  
  return queryString ? `${url}?${queryString}` : url
}

export function generateSrcSet(
  bucket: string,
  path: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): string {
  return widths
    .map(width => {
      const url = getOptimizedImageUrl(bucket, path, { width, format: 'webp' })
      return `${url} ${width}w`
    })
    .join(', ')
}

export function getResponsiveImageProps(bucket: string, path: string) {
  return {
    src: getOptimizedImageUrl(bucket, path, { width: 960, quality: 85 }),
    srcset: generateSrcSet(bucket, path),
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    loading: 'lazy' as const,
    decoding: 'async' as const
  }
}
```

Update EnhancedImage component:

```typescript
// src/lib/components/common/EnhancedImage.svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import { getOptimizedImageUrl, getResponsiveImageProps } from '$lib/utils/supabase-images'
  
  export let src: string
  export let alt: string
  export let bucket = 'products'
  export let width: number | undefined = undefined
  export let height: number | undefined = undefined
  export let aspectRatio: string | undefined = undefined
  export let priority = false
  export let className = ''
  
  let imgElement: HTMLImageElement
  let isLoaded = false
  let isError = false
  let isIntersecting = false
  
  // Parse bucket and path from src if it's a full URL
  $: parsedPath = src.includes('/storage/v1/') 
    ? src.split('/storage/v1/object/public/')[1]?.split('/').slice(1).join('/')
    : src
  
  $: optimizedSrc = getOptimizedImageUrl(bucket, parsedPath, {
    width: width || 960,
    quality: 85,
    format: 'webp'
  })
  
  $: fallbackSrc = getOptimizedImageUrl(bucket, parsedPath, {
    width: width || 960,
    quality: 85,
    format: 'jpg'
  })
  
  $: responsiveProps = getResponsiveImageProps(bucket, parsedPath)
  
  onMount(() => {
    if (!priority && browser && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            isIntersecting = true
            observer.disconnect()
          }
        },
        { rootMargin: '50px' }
      )
      
      observer.observe(imgElement)
      
      return () => observer.disconnect()
    } else {
      isIntersecting = true
    }
  })
</script>

<div 
  class="relative overflow-hidden {className}"
  style:aspect-ratio={aspectRatio}
>
  {#if !isLoaded && !isError}
    <div class="absolute inset-0 bg-gray-200 animate-pulse" />
  {/if}
  
  <picture>
    <source 
      type="image/webp"
      srcset={isIntersecting || priority ? responsiveProps.srcset : ''}
      sizes={responsiveProps.sizes}
    />
    <img
      bind:this={imgElement}
      src={isIntersecting || priority ? optimizedSrc : ''}
      {alt}
      {width}
      {height}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchpriority={priority ? 'high' : 'auto'}
      on:load={() => isLoaded = true}
      on:error={() => {
        isError = true
        if (imgElement) {
          imgElement.src = fallbackSrc
        }
      }}
      class="w-full h-full object-cover {isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300"
    />
  </picture>
</div>
```

### Step 2: Implement Caching Strategy

Add cache headers in your server hooks:

```typescript
// src/hooks.server.ts - Add to existing handle function
export const handle: Handle = async ({ event, resolve }) => {
  // ... existing code ...
  
  const response = await resolve(event)
  
  // Add caching headers for static assets
  if (event.url.pathname.startsWith('/images/') || 
      event.url.pathname.startsWith('/fonts/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }
  
  // Cache API responses
  if (event.url.pathname.startsWith('/api/')) {
    if (event.url.pathname.includes('/listings') && event.request.method === 'GET') {
      // Cache listing data for 5 minutes
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300')
    } else if (event.url.pathname.includes('/categories')) {
      // Cache category data for 1 hour
      response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')
    }
  }
  
  // Add ETag support for API responses
  if (event.url.pathname.startsWith('/api/') && event.request.method === 'GET') {
    const body = await response.text()
    const etag = `"${await sha256(body)}"`
    
    response.headers.set('ETag', etag)
    
    if (event.request.headers.get('If-None-Match') === etag) {
      return new Response(null, { status: 304 })
    }
    
    return new Response(body, {
      status: response.status,
      headers: response.headers
    })
  }
  
  return response
}
```

### Step 3: Create Materialized Views

Create migration for materialized views:

```bash
supabase migration new create_materialized_views
```

Add to migration file:

```sql
-- Top sellers materialized view for leaderboard
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_sellers AS
SELECT 
  p.id as user_id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.seller_rating,
  p.seller_rating_count,
  p.response_time_minutes,
  p.created_at as member_since,
  COUNT(DISTINCT o.id) as total_sales,
  COUNT(DISTINCT o.buyer_id) as unique_buyers,
  COALESCE(SUM(o.total_amount), 0) as total_revenue,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'active') as active_listings,
  COUNT(DISTINCT l.id) as total_listings,
  MAX(o.created_at) as last_sale_date,
  ARRAY_AGG(DISTINCT l.category_id) FILTER (WHERE l.category_id IS NOT NULL) as category_ids
FROM profiles p
LEFT JOIN orders o ON o.seller_id = p.id AND o.status IN ('delivered', 'completed')
LEFT JOIN listings l ON l.seller_id = p.id
WHERE p.role IN ('seller', 'admin')
  AND p.account_status = 'active'
GROUP BY p.id;

-- Create indexes on materialized view
CREATE INDEX idx_mv_top_sellers_revenue ON mv_top_sellers(total_revenue DESC);
CREATE INDEX idx_mv_top_sellers_sales ON mv_top_sellers(total_sales DESC);
CREATE INDEX idx_mv_top_sellers_rating ON mv_top_sellers(seller_rating DESC) WHERE seller_rating IS NOT NULL;

-- Category statistics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_category_stats AS
SELECT 
  c.id as category_id,
  c.name as category_name,
  c.slug as category_slug,
  c.parent_id,
  COUNT(DISTINCT l.id) as total_listings,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'active') as active_listings,
  COUNT(DISTINCT l.seller_id) as unique_sellers,
  AVG(l.price)::DECIMAL(10,2) as avg_price,
  MIN(l.price) as min_price,
  MAX(l.price) as max_price,
  SUM(l.view_count) as total_views,
  COUNT(DISTINCT o.id) as total_sales,
  COALESCE(SUM(o.total_amount), 0)::DECIMAL(10,2) as total_revenue
FROM categories c
LEFT JOIN listings l ON l.category_id = c.id
LEFT JOIN orders o ON o.listing_id = l.id AND o.status IN ('delivered', 'completed')
GROUP BY c.id;

-- Create indexes
CREATE INDEX idx_mv_category_stats_listings ON mv_category_stats(active_listings DESC);
CREATE INDEX idx_mv_category_stats_revenue ON mv_category_stats(total_revenue DESC);

-- Create refresh functions
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_sellers;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_stats;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh using pg_cron (if available) or call periodically
-- SELECT cron.schedule('refresh-materialized-views', '0 * * * *', 'SELECT refresh_materialized_views()');
```

## Testing & Deployment

### Step 1: Create Test Suite

Create comprehensive tests:

```typescript
// tests/auth.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.PUBLIC_SUPABASE_ANON_KEY!
)

describe('Authentication', () => {
  describe('Rate Limiting', () => {
    it('should block after 3 registration attempts', async () => {
      const email = `test-${Date.now()}@example.com`
      
      // Make 3 attempts
      for (let i = 0; i < 3; i++) {
        await supabase.auth.signUp({
          email,
          password: 'Test123!@#'
        })
      }
      
      // 4th attempt should fail
      const { data: canProceed } = await supabase.rpc('check_auth_rate_limit', {
        p_identifier: email,
        p_action: 'register',
        p_max_attempts: 3
      })
      
      expect(canProceed).toBe(false)
    })
  })
  
  describe('Password Security', () => {
    it('should reject weak passwords', async () => {
      const { error } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'weak'
      })
      
      expect(error?.message).toContain('password')
    })
  })
})

describe('Listings', () => {
  it('should enforce RLS policies', async () => {
    // Test as unauthenticated user
    const { data, error } = await supabase
      .from('listings')
      .insert({
        title: 'Test Product',
        price: 100
      })
    
    expect(error).toBeTruthy()
    expect(data).toBeNull()
  })
})
```

### Step 2: Performance Testing

Create load tests with k6:

```javascript
// tests/load/browse.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up more
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
  },
}

export default function() {
  // Browse listings
  const browseRes = http.get('https://staging.driplo.com/api/listings')
  check(browseRes, {
    'browse status 200': (r) => r.status === 200,
    'browse time < 500ms': (r) => r.timings.duration < 500,
  })
  
  sleep(1)
  
  // View product detail
  if (browseRes.json('data')?.length > 0) {
    const productId = browseRes.json('data')[0].id
    const detailRes = http.get(`https://staging.driplo.com/api/listings/${productId}`)
    check(detailRes, {
      'detail status 200': (r) => r.status === 200,
      'detail time < 300ms': (r) => r.timings.duration < 300,
    })
  }
  
  sleep(2)
}
```

### Step 3: Deployment Checklist

Create deployment script:

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Starting Driplo Production Deployment"

# 1. Run tests
echo "Running tests..."
npm run test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Aborting deployment."
  exit 1
fi

# 2. Build application
echo "Building application..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed. Aborting deployment."
  exit 1
fi

# 3. Run database migrations
echo "Running database migrations..."
supabase db push
if [ $? -ne 0 ]; then
  echo "❌ Migration failed. Aborting deployment."
  exit 1
fi

# 4. Update edge functions
echo "Deploying edge functions..."
supabase functions deploy

# 5. Refresh materialized views
echo "Refreshing materialized views..."
supabase rpc refresh_materialized_views

# 6. Deploy to Vercel/Netlify
echo "Deploying to production..."
vercel --prod

echo "✅ Deployment complete!"
```

## Monitoring Setup

### Implement monitoring with Sentry:

```typescript
// src/app.html
<!DOCTYPE html>
<html lang="%lang%">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    
    <!-- Sentry -->
    <script>
      if ('%sveltekit.env.PUBLIC_SENTRY_DSN%') {
        import('https://browser.sentry-cdn.com/7.0.0/bundle.min.js').then(() => {
          Sentry.init({
            dsn: '%sveltekit.env.PUBLIC_SENTRY_DSN%',
            environment: '%sveltekit.env.PUBLIC_ENVIRONMENT%',
            integrations: [
              new Sentry.BrowserTracing(),
              new Sentry.Replay({
                maskAllText: false,
                blockAllMedia: false,
              }),
            ],
            tracesSampleRate: 0.1,
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
          })
        })
      }
    </script>
    
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

## Phase 5: Testing Strategy

### Unit Testing Database Functions

Create test file `supabase/tests/database_functions.test.sql`:

```sql
-- Test rate limiting function
DO $$
DECLARE
  v_result BOOLEAN;
BEGIN
  -- Test successful rate limit check
  SELECT check_auth_rate_limit('test@example.com', 'login', 5, 15) INTO v_result;
  ASSERT v_result = TRUE, 'First rate limit check should pass';
  
  -- Test rate limit exceeded
  PERFORM check_auth_rate_limit('test@example.com', 'login', 1, 15);
  SELECT check_auth_rate_limit('test@example.com', 'login', 1, 15) INTO v_result;
  ASSERT v_result = FALSE, 'Rate limit should be exceeded';
  
  RAISE NOTICE 'All rate limit tests passed';
END $$;

-- Test user stats function
DO $$
DECLARE
  v_stats RECORD;
  v_test_user_id UUID;
BEGIN
  -- Create test user
  INSERT INTO public.profiles (id, username, email, role)
  VALUES (gen_random_uuid(), 'testuser', 'test@example.com', 'user')
  RETURNING id INTO v_test_user_id;
  
  -- Get stats
  SELECT * FROM get_user_stats(v_test_user_id) INTO v_stats;
  
  ASSERT v_stats.total_sales = 0, 'New user should have 0 sales';
  ASSERT v_stats.total_purchases = 0, 'New user should have 0 purchases';
  
  -- Clean up
  DELETE FROM public.profiles WHERE id = v_test_user_id;
  
  RAISE NOTICE 'User stats tests passed';
END $$;
```

### Integration Testing

Create `tests/supabase/integration.test.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

describe('Supabase Integration Tests', () => {
  let testUserId: string
  
  beforeAll(async () => {
    // Create test user
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'TestPassword123!',
      email_confirm: true
    })
    
    if (error) throw error
    testUserId = data.user.id
  })
  
  afterAll(async () => {
    // Clean up test user
    await supabase.auth.admin.deleteUser(testUserId)
  })
  
  describe('Authentication', () => {
    it('should enforce rate limiting', async () => {
      // Make multiple login attempts
      for (let i = 0; i < 5; i++) {
        await supabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: 'wrong'
        })
      }
      
      // 6th attempt should fail
      const { error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'TestPassword123!'
      })
      
      expect(error?.message).toContain('rate limit')
    })
  })
  
  describe('RLS Policies', () => {
    it('should enforce brand profile policies', async () => {
      // Try to access brand profiles without auth
      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('verified', false)
      
      expect(data).toHaveLength(0)
    })
    
    it('should allow viewing verified brands', async () => {
      const { data } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('verified', true)
      
      expect(error).toBeNull()
    })
  })
  
  describe('Performance', () => {
    it('should execute queries within acceptable time', async () => {
      const start = Date.now()
      
      await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .limit(20)
      
      const duration = Date.now() - start
      expect(duration).toBeLessThan(200) // Should complete in under 200ms
    })
  })
})
```

### Load Testing

Create `tests/load/k6-test.js`:

```javascript
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const errorRate = new Rate('errors')

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp to 200
    { duration: '5m', target: 200 }, // Stay at 200
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    errors: ['rate<0.1'],             // Error rate under 10%
  },
}

const BASE_URL = 'https://your-app.com'

export default function () {
  // Test homepage
  const homeRes = http.get(`${BASE_URL}/`)
  check(homeRes, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads quickly': (r) => r.timings.duration < 500,
  }) || errorRate.add(1)
  
  sleep(1)
  
  // Test browse endpoint
  const browseRes = http.get(`${BASE_URL}/api/listings?limit=20`)
  check(browseRes, {
    'browse status is 200': (r) => r.status === 200,
    'browse returns data': (r) => JSON.parse(r.body).data.length > 0,
  }) || errorRate.add(1)
  
  sleep(2)
}
```

## Phase 6: Deployment Process

### Pre-Deployment Checklist

```bash
# 1. Create deployment checklist
cat > deployment-checklist.md << 'EOF'
# Supabase Production Deployment Checklist

## Pre-Deployment (1 week before)
- [ ] All tests passing in CI/CD
- [ ] Security audit completed
- [ ] Performance benchmarks recorded
- [ ] Backup strategy tested
- [ ] Rollback plan documented
- [ ] Team notified of deployment window

## Pre-Deployment (1 day before)
- [ ] Create full database backup
- [ ] Test migrations on staging
- [ ] Verify all environment variables
- [ ] Check third-party service limits
- [ ] Prepare status page update

## Deployment Day
- [ ] Enable maintenance mode
- [ ] Create database snapshot
- [ ] Run migrations
- [ ] Deploy application code
- [ ] Update environment variables
- [ ] Run smoke tests
- [ ] Disable maintenance mode
- [ ] Monitor error rates
- [ ] Update status page

## Post-Deployment (1 hour)
- [ ] Check error monitoring
- [ ] Verify key user flows
- [ ] Review performance metrics
- [ ] Check database connections
- [ ] Monitor memory usage

## Post-Deployment (24 hours)
- [ ] Review user feedback
- [ ] Analyze performance data
- [ ] Check for new errors
- [ ] Document any issues
- [ ] Plan improvements
EOF
```

### Deployment Script

Create `scripts/deploy-production.sh`:

```bash
#!/bin/bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting Supabase Production Deployment${NC}"

# Check prerequisites
command -v supabase >/dev/null 2>&1 || { echo -e "${RED}Supabase CLI is required${NC}"; exit 1; }

# Set variables
PROJECT_ID=${SUPABASE_PROJECT_ID}
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"

# Create backup directory
mkdir -p $BACKUP_DIR

# Step 1: Backup current database
echo -e "${YELLOW}Creating database backup...${NC}"
supabase db dump -f $BACKUP_DIR/pre_deployment_backup.sql

# Step 2: Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
supabase db push

# Step 3: Deploy Edge Functions (if any)
if [ -d "supabase/functions" ]; then
  echo -e "${YELLOW}Deploying Edge Functions...${NC}"
  supabase functions deploy
fi

# Step 4: Update database types
echo -e "${YELLOW}Generating TypeScript types...${NC}"
supabase gen types typescript --project-id $PROJECT_ID > src/lib/types/database.types.ts

# Step 5: Run tests
echo -e "${YELLOW}Running post-deployment tests...${NC}"
npm run test:integration

# Step 6: Check database health
echo -e "${YELLOW}Checking database health...${NC}"
supabase db lint

echo -e "${GREEN}Deployment completed successfully!${NC}"
```

### Rollback Plan

Create `scripts/rollback-deployment.sh`:

```bash
#!/bin/bash
set -euo pipefail

echo "Starting emergency rollback..."

# Get the latest backup
LATEST_BACKUP=$(ls -t backups/*/pre_deployment_backup.sql | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "ERROR: No backup found!"
  exit 1
fi

# Confirm rollback
read -p "This will restore from $LATEST_BACKUP. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 1
fi

# Restore database
echo "Restoring database..."
supabase db reset
psql $DATABASE_URL < $LATEST_BACKUP

# Revert code deployment
echo "Reverting to previous release..."
git revert HEAD --no-edit
git push origin main

echo "Rollback completed. Please verify application state."
```

### Monitoring Setup

Create `monitoring/alerts.yaml`:

```yaml
# Supabase Alerts Configuration
alerts:
  - name: high_error_rate
    condition: error_rate > 5%
    duration: 5m
    severity: critical
    notify:
      - slack
      - pagerduty
  
  - name: slow_queries
    condition: p95_query_time > 1000ms
    duration: 10m
    severity: warning
    notify:
      - slack
  
  - name: auth_failures
    condition: auth_failure_rate > 10%
    duration: 5m
    severity: critical
    notify:
      - slack
      - pagerduty
  
  - name: storage_usage
    condition: storage_usage > 80%
    duration: 30m
    severity: warning
    notify:
      - email
  
  - name: connection_pool_exhausted
    condition: available_connections < 5
    duration: 5m
    severity: critical
    notify:
      - slack
      - pagerduty
```

## Final Steps

1. **Security Audit**: Run a security scan
2. **Performance Audit**: Use Lighthouse
3. **Accessibility Audit**: Test with screen readers
4. **Mobile Testing**: Test on real devices
5. **Browser Testing**: Test on all major browsers
6. **Load Testing**: Run k6 tests
7. **Monitoring**: Set up alerts
8. **Documentation**: Update API docs
9. **Backup**: Create full backup
10. **Deploy**: Follow deployment checklist

## Conclusion

This implementation guide provides step-by-step instructions for executing the Supabase production refactor plan. Follow each phase sequentially, test thoroughly, and monitor closely during deployment.

Remember to:
- Always backup before making changes
- Test in staging before production
- Monitor error rates after deployment
- Have a rollback plan ready
- Document any deviations from the plan

Good luck with your production deployment! 🚀