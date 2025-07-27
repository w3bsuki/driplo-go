-- Make w3bsuki@gmail.com an admin
-- Run this script in your Supabase SQL Editor

-- Update the user's role to admin
UPDATE profiles 
SET role = 'admin'
WHERE id = 'b1d93401-733f-4b06-ab0b-e6bff3b373b3';

-- Verify the update
SELECT 
    u.id,
    u.email,
    p.username,
    p.role,
    p.full_name
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE u.email = 'w3bsuki@gmail.com';

-- Optional: Log this admin promotion
INSERT INTO admin_approvals (
    request_type,
    request_id,
    admin_id,
    action,
    notes,
    metadata
) VALUES (
    'user_promotion',
    'b1d93401-733f-4b06-ab0b-e6bff3b373b3',
    'b1d93401-733f-4b06-ab0b-e6bff3b373b3', -- self-promotion for initial setup
    'approve',
    'Initial admin setup',
    jsonb_build_object('email', 'w3bsuki@gmail.com', 'role', 'admin')
);