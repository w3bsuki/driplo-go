-- Add role enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update profiles table to use role enum (if column doesn't exist)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'user';
    ELSE
        -- If column exists but is text, convert it
        ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;
    END IF;
END $$;

-- Create index on role for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Function to promote user to admin (can only be called by existing admins or service role)
CREATE OR REPLACE FUNCTION promote_to_admin(user_email text)
RETURNS void AS $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Get user ID from email
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    -- Update user role to admin
    UPDATE profiles
    SET role = 'admin'
    WHERE id = target_user_id;
    
    -- Log the promotion
    INSERT INTO admin_approvals (
        request_type,
        request_id,
        admin_id,
        action,
        notes,
        metadata
    ) VALUES (
        'user_promotion',
        target_user_id,
        auth.uid(),
        'approve',
        'Promoted to admin role',
        jsonb_build_object('email', user_email, 'role', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policy to ensure only admins can call this function
CREATE POLICY "Only admins can promote users" ON profiles
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- IMPORTANT: After running this migration, you need to manually promote admin users
-- Connect to your Supabase SQL editor and run:
-- 
-- UPDATE profiles SET role = 'admin' WHERE id IN (
--     SELECT id FROM auth.users WHERE email IN (
--         'your-admin-email@example.com',
--         'another-admin@example.com'
--     )
-- );
--
-- Or use the Supabase dashboard to update the role field directly in the profiles table