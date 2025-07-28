-- Add responsive image URL columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_urls jsonb,
ADD COLUMN IF NOT EXISTS cover_urls jsonb;

-- Add responsive image URLs to listings table
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS image_urls jsonb;

-- Create an index on the new columns for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_urls ON public.profiles USING gin (avatar_urls);
CREATE INDEX IF NOT EXISTS idx_profiles_cover_urls ON public.profiles USING gin (cover_urls);
CREATE INDEX IF NOT EXISTS idx_listings_image_urls ON public.listings USING gin (image_urls);

-- Update existing data to have responsive URLs structure (optional, for backwards compatibility)
-- This will be handled by the application when images are re-uploaded