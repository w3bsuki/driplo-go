-- Add fashion categories as top-level categories
-- This migration creates the categories needed for the category routes
-- (women, men, kids, bags, shoes, designer)

-- These need to be top-level categories (parent_id = NULL) because the routes
-- expect them at the top level (e.g., /women, /men, etc.)

-- Insert fashion categories as top-level categories
INSERT INTO categories (name, slug, icon, parent_id, is_active, sort_order, description, meta_title, meta_description)
VALUES 
    ('Women', 'women', '👚', NULL, true, 11, 
     'Discover women''s fashion including dresses, tops, bottoms, and more', 
     'Women''s Fashion | Driplo Marketplace',
     'Shop women''s clothing, accessories, and fashion items on Driplo. Find unique styles from local and international brands.'),
    
    ('Men', 'men', '👔', NULL, true, 12, 
     'Explore men''s fashion including shirts, pants, suits, and more',
     'Men''s Fashion | Driplo Marketplace', 
     'Shop men''s clothing, accessories, and fashion items on Driplo. Discover quality menswear from trusted sellers.'),
    
    ('Kids', 'kids', '👶', NULL, true, 13, 
     'Shop kids'' clothing and accessories for all ages',
     'Kids Fashion | Driplo Marketplace',
     'Find children''s clothing, shoes, and accessories on Driplo. Quality kids fashion at great prices.'),
    
    ('Bags', 'bags', '👜', NULL, true, 14, 
     'Browse handbags, backpacks, wallets, and more',
     'Bags & Accessories | Driplo Marketplace',
     'Shop designer bags, handbags, backpacks, and wallets on Driplo. Authentic luxury and contemporary brands.'),
    
    ('Shoes', 'shoes', '👟', NULL, true, 15, 
     'Find footwear for every occasion and style',
     'Shoes & Footwear | Driplo Marketplace',
     'Discover shoes, sneakers, boots, and more on Driplo. Shop footwear from top brands and independent designers.'),
    
    ('Designer', 'designer', '💎', NULL, true, 16, 
     'Luxury and designer fashion from top brands',
     'Designer Fashion | Driplo Marketplace',
     'Shop authenticated designer clothing and accessories on Driplo. Luxury fashion from world-renowned brands.')
ON CONFLICT (slug) DO UPDATE
SET 
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    description = EXCLUDED.description,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description,
    parent_id = EXCLUDED.parent_id,  -- Ensure they remain top-level
    updated_at = now();

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_slug_parent 
ON categories(slug, parent_id);

-- Update statistics
ANALYZE categories;