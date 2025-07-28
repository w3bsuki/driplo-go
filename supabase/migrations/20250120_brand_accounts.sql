-- Migration: Add Brand Account Support
-- Description: Adds support for brand accounts (professional accounts for local brands)

-- Add account type to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'personal' CHECK (account_type IN ('personal', 'brand'));

-- Add brand-specific fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS brand_name TEXT,
ADD COLUMN IF NOT EXISTS brand_description TEXT,
ADD COLUMN IF NOT EXISTS brand_established_date DATE,
ADD COLUMN IF NOT EXISTS brand_category TEXT,
ADD COLUMN IF NOT EXISTS is_local_brand BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS brand_story TEXT,
ADD COLUMN IF NOT EXISTS brand_values TEXT[],
ADD COLUMN IF NOT EXISTS brand_certifications JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS brand_logo_url TEXT,
ADD COLUMN IF NOT EXISTS brand_cover_url TEXT,
ADD COLUMN IF NOT EXISTS brand_contact_email TEXT,
ADD COLUMN IF NOT EXISTS brand_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS brand_instagram TEXT,
ADD COLUMN IF NOT EXISTS brand_facebook TEXT,
ADD COLUMN IF NOT EXISTS brand_website TEXT;

-- Create index for account type
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON public.profiles(account_type);

-- Create index for brand accounts
CREATE INDEX IF NOT EXISTS idx_profiles_brand_accounts ON public.profiles(account_type) WHERE account_type = 'brand';

-- Add onboarding tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Create onboarding_progress table
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    has_seen_welcome BOOLEAN DEFAULT false,
    has_completed_profile BOOLEAN DEFAULT false,
    has_created_first_listing BOOLEAN DEFAULT false,
    has_made_first_purchase BOOLEAN DEFAULT false,
    welcome_seen_at TIMESTAMPTZ,
    profile_completed_at TIMESTAMPTZ,
    first_listing_at TIMESTAMPTZ,
    first_purchase_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add RLS policies for onboarding_progress
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own onboarding progress
CREATE POLICY "Users can view own onboarding progress" ON public.onboarding_progress
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own onboarding progress
CREATE POLICY "Users can update own onboarding progress" ON public.onboarding_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own onboarding progress
CREATE POLICY "Users can insert own onboarding progress" ON public.onboarding_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update onboarding step
CREATE OR REPLACE FUNCTION update_onboarding_step(step_name TEXT)
RETURNS void AS $$
BEGIN
    CASE step_name
        WHEN 'welcome' THEN
            INSERT INTO public.onboarding_progress (user_id, has_seen_welcome, welcome_seen_at)
            VALUES (auth.uid(), true, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                has_seen_welcome = true,
                welcome_seen_at = NOW(),
                updated_at = NOW();
        
        WHEN 'profile' THEN
            INSERT INTO public.onboarding_progress (user_id, has_completed_profile, profile_completed_at)
            VALUES (auth.uid(), true, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                has_completed_profile = true,
                profile_completed_at = NOW(),
                updated_at = NOW();
            
            -- Also update profile completion status
            UPDATE public.profiles 
            SET has_completed_onboarding = true,
                onboarding_completed_at = NOW()
            WHERE id = auth.uid();
        
        WHEN 'first_listing' THEN
            INSERT INTO public.onboarding_progress (user_id, has_created_first_listing, first_listing_at)
            VALUES (auth.uid(), true, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                has_created_first_listing = true,
                first_listing_at = NOW(),
                updated_at = NOW();
        
        WHEN 'first_purchase' THEN
            INSERT INTO public.onboarding_progress (user_id, has_made_first_purchase, first_purchase_at)
            VALUES (auth.uid(), true, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                has_made_first_purchase = true,
                first_purchase_at = NOW(),
                updated_at = NOW();
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get featured brand accounts
CREATE OR REPLACE FUNCTION get_featured_brands(limit_count INT DEFAULT 12)
RETURNS TABLE (
    id UUID,
    username TEXT,
    brand_name TEXT,
    brand_logo_url TEXT,
    brand_description TEXT,
    brand_category TEXT,
    total_sales INT,
    seller_rating NUMERIC,
    is_verified BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.brand_name,
        p.brand_logo_url,
        p.brand_description,
        p.brand_category,
        p.total_sales::INT,
        p.seller_rating,
        p.is_verified
    FROM public.profiles p
    WHERE 
        p.account_type = 'brand'
        AND p.is_verified = true
        AND p.brand_name IS NOT NULL
    ORDER BY 
        p.total_sales DESC NULLS LAST,
        p.seller_rating DESC NULLS LAST
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to initialize onboarding progress for new users
CREATE OR REPLACE FUNCTION init_onboarding_progress()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.onboarding_progress (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new profiles
CREATE TRIGGER on_profile_created_init_onboarding
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION init_onboarding_progress();

-- Add some helpful comments
COMMENT ON COLUMN public.profiles.account_type IS 'Type of account: personal or brand';
COMMENT ON COLUMN public.profiles.brand_name IS 'Official brand name for brand accounts';
COMMENT ON COLUMN public.profiles.brand_description IS 'Short description of the brand';
COMMENT ON COLUMN public.profiles.brand_story IS 'Detailed brand story and history';
COMMENT ON COLUMN public.profiles.brand_values IS 'Array of brand values (e.g., sustainable, handmade, local)';
COMMENT ON COLUMN public.profiles.brand_certifications IS 'JSON array of certifications with details';
COMMENT ON TABLE public.onboarding_progress IS 'Tracks user onboarding progress through the platform';