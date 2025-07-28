-- Migration: Add 2FA columns to profiles table if they don't exist
-- Generated: 2025-01-27
-- Purpose: Support Two-Factor Authentication

-- Add 2FA columns only if they don't exist
DO $$
BEGIN
  -- Add two_factor_enabled column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'two_factor_enabled') THEN
    ALTER TABLE public.profiles ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false;
    COMMENT ON COLUMN public.profiles.two_factor_enabled IS 'Whether 2FA is enabled for this account';
  END IF;

  -- Add two_factor_secret column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'two_factor_secret') THEN
    ALTER TABLE public.profiles ADD COLUMN two_factor_secret TEXT;
    COMMENT ON COLUMN public.profiles.two_factor_secret IS 'Encrypted TOTP secret for 2FA';
  END IF;

  -- Add backup_codes column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'backup_codes') THEN
    ALTER TABLE public.profiles ADD COLUMN backup_codes TEXT[];
    COMMENT ON COLUMN public.profiles.backup_codes IS 'Array of backup codes for 2FA recovery';
  END IF;
END $$;

-- Create index for 2FA enabled users if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_profiles_two_factor ON public.profiles(two_factor_enabled) WHERE two_factor_enabled = true;

-- Create RLS policies for 2FA columns
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own 2FA status" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update their own 2FA settings" ON public.profiles;
  
  -- Create new policies
  CREATE POLICY "Users can view their own 2FA status" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
    
  CREATE POLICY "Users can update their own 2FA settings" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
END $$;

-- Grant permissions on the columns
GRANT SELECT (two_factor_enabled, backup_codes) ON public.profiles TO authenticated;
GRANT UPDATE (two_factor_enabled, two_factor_secret, backup_codes) ON public.profiles TO authenticated;