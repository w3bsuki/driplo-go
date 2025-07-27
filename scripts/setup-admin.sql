-- Setup Admin Accounts Script
-- Run this in your Supabase SQL editor after creating admin users

-- Option 1: Update existing users to admin by email
UPDATE profiles 
SET role = 'admin' 
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email IN (
        -- Add your admin email addresses here
        'admin@driplo.com',
        'your-email@example.com'
    )
);

-- Option 2: Update a specific user by username
-- UPDATE profiles SET role = 'admin' WHERE username = 'your-username';

-- Option 3: Update by user ID (get from Supabase dashboard)
-- UPDATE profiles SET role = 'admin' WHERE id = 'user-uuid-here';

-- Verify admin users
SELECT 
    p.id,
    p.username,
    p.full_name,
    u.email,
    p.role,
    p.created_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'admin'
ORDER BY p.created_at;