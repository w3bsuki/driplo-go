-- Fix production auth issues
-- This migration ensures the handle_new_user trigger exists and works properly

-- First, ensure the handle_new_user function exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert profile with username from metadata or email
    INSERT INTO public.profiles (id, email, username, account_type, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'username',
            LOWER(SPLIT_PART(NEW.email, '@', 1))
        ),
        COALESCE(NEW.raw_user_meta_data->>'account_type', 'personal'),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        username = COALESCE(profiles.username, EXCLUDED.username),
        updated_at = NOW();
    
    -- Handle brand-specific data if account_type is 'brand'
    IF NEW.raw_user_meta_data->>'account_type' = 'brand' THEN
        UPDATE public.profiles
        SET 
            brand_name = NEW.raw_user_meta_data->>'brand_name',
            brand_category = NEW.raw_user_meta_data->>'brand_category',
            brand_website = NEW.raw_user_meta_data->>'brand_website'
        WHERE id = NEW.id;
    END IF;
    
    -- Create shopping cart for new user if not exists
    INSERT INTO public.shopping_carts (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create user stats if not exists
    INSERT INTO public.user_stats_summary (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create onboarding status for new user
    INSERT INTO public.onboarding_status (user_id, is_complete, current_step)
    VALUES (NEW.id, false, 'profile_setup')
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Also ensure the login tracking works
CREATE OR REPLACE FUNCTION public.track_user_login()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if last_sign_in_at has changed
  IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
    -- Update profile with login tracking
    UPDATE public.profiles
    SET 
      last_login_at = NOW(),
      login_count = COALESCE(login_count, 0) + 1,
      first_login_at = COALESCE(first_login_at, NOW())
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop and recreate login trigger
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;

CREATE TRIGGER on_auth_user_login
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.track_user_login();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Ensure RLS is enabled on critical tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_status ENABLE ROW LEVEL SECURITY;

-- Add a helpful comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile and related records when a new auth user signs up';