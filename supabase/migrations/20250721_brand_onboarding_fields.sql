-- Add brand onboarding and additional brand fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS brand_onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS brand_story TEXT,
ADD COLUMN IF NOT EXISTS brand_values TEXT,
ADD COLUMN IF NOT EXISTS brand_mission TEXT;

-- Add additional fields to brand_profiles table
ALTER TABLE brand_profiles
ADD COLUMN IF NOT EXISTS brand_story TEXT,
ADD COLUMN IF NOT EXISTS brand_values TEXT,
ADD COLUMN IF NOT EXISTS brand_mission TEXT,
ADD COLUMN IF NOT EXISTS brand_logo_url TEXT,
ADD COLUMN IF NOT EXISTS brand_cover_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT;

-- Create storage buckets for brand assets if they don't exist
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES ('brand-assets', 'brand-assets', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for brand-assets bucket
CREATE POLICY "Anyone can view brand assets" ON storage.objects
FOR SELECT USING (bucket_id = 'brand-assets');

CREATE POLICY "Users can upload their own brand assets" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'brand-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own brand assets" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'brand-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
) WITH CHECK (
    bucket_id = 'brand-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own brand assets" ON storage.objects
FOR DELETE USING (
    bucket_id = 'brand-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
);