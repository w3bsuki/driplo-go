-- Migration: Add missing columns to profiles table
-- Generated: 2025-07-24
-- Purpose: Add missing columns identified in SUPABASE_PRODUCTION_REFACTOR_PLAN.md

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
  -- Language and localization
  ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en',
  
  -- Notification preferences (using JSONB for flexibility)
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": false, "sms": false}',
  
  -- Privacy settings
  ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"profile_visible": true, "show_purchases": false, "show_sales": true}',
  
  -- Referral system
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id),
  
  -- Account status management
  ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned', 'deleted')),
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspension_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_lifted_date TIMESTAMPTZ,
  
  -- Activity tracking
  ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT now(),
  
  -- Notification toggles (redundant with notification_preferences but kept for backward compatibility)
  ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT false,
  
  -- Security features
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
  ADD COLUMN IF NOT EXISTS backup_codes TEXT[],
  ADD COLUMN IF NOT EXISTS security_questions JSONB DEFAULT '[]',
  
  -- Business information
  ADD COLUMN IF NOT EXISTS tax_info JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS business_info JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS vat_number TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS company_registration_number TEXT,
  
  -- Additional fields for user experience
  ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_time_hours NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS buyer_rating NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS buyer_rating_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seller_level INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_earnings NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- Create index for referral code lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code) WHERE referral_code IS NOT NULL;

-- Create index for account status filtering
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status) WHERE account_status != 'active';

-- Create index for two-factor authentication
CREATE INDEX IF NOT EXISTS idx_profiles_two_factor ON public.profiles(two_factor_enabled) WHERE two_factor_enabled = true;

-- Create composite index for user activity
CREATE INDEX IF NOT EXISTS idx_profiles_activity ON public.profiles(last_active DESC, account_status);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric code
    v_code := upper(substr(md5(random()::text), 1, 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = v_code) INTO v_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code on profile creation
CREATE OR REPLACE FUNCTION set_referral_code() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_referral_code_trigger' 
    AND tgrelid = 'public.profiles'::regclass
  ) THEN
    CREATE TRIGGER set_referral_code_trigger
      BEFORE INSERT ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION set_referral_code();
  END IF;
END;
$$;

-- Function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_last_active() RETURNS TRIGGER AS $$
BEGIN
  -- Update last_active on any update to the profile
  NEW.last_active := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_active
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_last_active_trigger' 
    AND tgrelid = 'public.profiles'::regclass
  ) THEN
    CREATE TRIGGER update_last_active_trigger
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_last_active();
  END IF;
END;
$$;

-- Add comments to new columns
COMMENT ON COLUMN public.profiles.language_preference IS 'User preferred language for UI and communications';
COMMENT ON COLUMN public.profiles.notification_preferences IS 'JSON object with notification channel preferences';
COMMENT ON COLUMN public.profiles.privacy_settings IS 'JSON object with privacy preferences';
COMMENT ON COLUMN public.profiles.referral_code IS 'Unique code for user referrals';
COMMENT ON COLUMN public.profiles.referred_by IS 'User ID who referred this user';
COMMENT ON COLUMN public.profiles.account_status IS 'Current status of the user account';
COMMENT ON COLUMN public.profiles.suspension_reason IS 'Reason for account suspension if applicable';
COMMENT ON COLUMN public.profiles.two_factor_enabled IS 'Whether 2FA is enabled for this account';
COMMENT ON COLUMN public.profiles.tax_info IS 'Tax information for business accounts';
COMMENT ON COLUMN public.profiles.business_info IS 'Business registration and details';
COMMENT ON COLUMN public.profiles.achievements IS 'Array of achievement objects earned by user';

-- Backfill referral codes for existing users
UPDATE public.profiles 
SET referral_code = generate_referral_code() 
WHERE referral_code IS NULL;