-- Add needs_username_setup field to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS needs_username_setup boolean DEFAULT false;

-- Update existing users to not need username setup (they already have usernames)
UPDATE public.profiles
SET needs_username_setup = false
WHERE username IS NOT NULL AND username != '';

-- For any users stuck with temp usernames (containing numbers at end), mark them as needing setup
UPDATE public.profiles
SET needs_username_setup = true
WHERE username ~ '[0-9]+$' AND length(username) < 20;