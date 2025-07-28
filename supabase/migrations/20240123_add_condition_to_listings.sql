-- Add condition column to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS condition text;

-- Add check constraint to ensure valid conditions
ALTER TABLE listings
ADD CONSTRAINT valid_condition CHECK (
  condition IN ('new_with_tags', 'new_without_tags', 'very_good', 'good', 'fair')
  OR condition IS NULL
);

-- Create index for condition filtering
CREATE INDEX IF NOT EXISTS idx_listings_condition ON listings(condition);

-- Update existing listings to have a default condition (optional)
-- You can comment this out if you want existing listings to have NULL condition
UPDATE listings 
SET condition = 'good' 
WHERE condition IS NULL 
  AND status = 'active';