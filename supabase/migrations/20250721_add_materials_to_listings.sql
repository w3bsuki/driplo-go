-- Add materials column to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS materials text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN listings.materials IS 'Array of materials used in the item (e.g., cotton, polyester, wool)';