-- Fix onboarding status for existing users
-- Mark all users with proper usernames who are older than 1 hour as onboarding completed

-- First, ensure all existing users with proper usernames are marked as onboarding completed
UPDATE public.profiles 
SET onboarding_completed = true,
    needs_username_setup = false
WHERE username IS NOT NULL 
  AND username != ''
  AND username !~ '^[a-zA-Z0-9]+[0-9]{3,}$'  -- Not a temp username pattern
  AND created_at < NOW() - INTERVAL '1 hour';

-- For users with temp usernames, mark them as needing username setup
UPDATE public.profiles
SET needs_username_setup = true,
    onboarding_completed = false
WHERE username ~ '^[a-zA-Z0-9]+[0-9]{3,}$'  -- Temp username pattern
  AND length(username) < 20;

-- Add comment to the column for documentation
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Indicates whether the user has completed the onboarding process';
COMMENT ON COLUMN public.profiles.needs_username_setup IS 'Indicates whether the user needs to set up a proper username (for users who registered with temp usernames)';