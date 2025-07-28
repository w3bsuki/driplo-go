-- Add responsive image URLs to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_urls jsonb,
ADD COLUMN IF NOT EXISTS cover_urls jsonb;

-- Add responsive image URLs to listings table
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS image_urls jsonb DEFAULT '[]'::jsonb;

-- Add indexes for JSONB columns for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_urls ON profiles USING gin(avatar_urls);
CREATE INDEX IF NOT EXISTS idx_profiles_cover_urls ON profiles USING gin(cover_urls);
CREATE INDEX IF NOT EXISTS idx_listings_image_urls ON listings USING gin(image_urls);

-- Function to get optimized image URL
CREATE OR REPLACE FUNCTION get_optimized_image_url(
    base_url text,
    size text DEFAULT 'medium'
) RETURNS text AS $$
BEGIN
    -- If already a WebP with size suffix, return as is
    IF base_url LIKE '%_thumb.webp' OR 
       base_url LIKE '%_small.webp' OR 
       base_url LIKE '%_medium.webp' OR 
       base_url LIKE '%_large.webp' THEN
        RETURN base_url;
    END IF;
    
    -- If WebP without size suffix, add the size
    IF base_url LIKE '%.webp' THEN
        RETURN REPLACE(base_url, '.webp', '_' || size || '.webp');
    END IF;
    
    -- Return original URL if not WebP
    RETURN base_url;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create index on function for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_optimized 
ON profiles (get_optimized_image_url(avatar_url, 'medium'))
WHERE avatar_url IS NOT NULL;