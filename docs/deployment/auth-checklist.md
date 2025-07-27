# Production Auth Quick Fix Checklist

## The Issue
Your signup works but login fails because the profile isn't being created properly in the database when users sign up.

## Immediate Actions Required

### 1. Run the Migration in Production
```bash
# Push the new migration to fix the trigger
supabase db push

# Or manually run in SQL Editor:
# Copy contents of supabase/migrations/20250722_fix_production_auth.sql
```

### 2. Check Supabase Dashboard Settings

#### Authentication > Providers > Email
- ✅ **Enable Email Signups**: Should be ON
- ✅ **Confirm Email**: Should be ON (for security)
- ✅ **Secure Email Change**: Optional
- ✅ **Secure Password Change**: Optional

#### Authentication > Email Templates
Make sure these templates have the correct URLs:

**Confirm Signup Template:**
```html
<h2>Confirm your email</h2>
<p>Follow this link to confirm your email:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your email address</a></p>
```

**Reset Password Template:**
```html
<h2>Reset Password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery">Reset Password</a></p>
```

### 3. Verify Email Sending Works
In Supabase Dashboard > Authentication > Logs:
- Check if emails are being sent
- Look for any email delivery errors

### 4. Quick Debug Steps

1. **Check if profile exists for your test user:**
```sql
-- Run in SQL Editor
SELECT * FROM auth.users WHERE email = 'your-test-email@example.com';
SELECT * FROM public.profiles WHERE email = 'your-test-email@example.com';
```

2. **If profile is missing, manually create it:**
```sql
-- Replace with actual user ID from auth.users
INSERT INTO public.profiles (id, email, username)
SELECT id, email, LOWER(SPLIT_PART(email, '@', 1))
FROM auth.users 
WHERE email = 'your-test-email@example.com'
ON CONFLICT (id) DO NOTHING;
```

3. **Check if trigger exists:**
```sql
-- Should return the trigger
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

## Default Email Behavior

Supabase sends emails from `noreply@mail.app.supabase.io` by default:
- **Free tier**: 4 emails/hour
- **Pro tier**: 100 emails/hour  
- **No SMTP needed** for basic functionality

You only need custom SMTP when you want:
- Custom "from" address (your domain)
- Higher sending limits
- Better deliverability
- Custom email design

## Common Issues & Quick Fixes

### "Invalid login credentials" but you know password is correct
**Cause**: Email not confirmed
**Fix**: Check email for confirmation link

### Signup works but profile not created
**Cause**: Missing trigger
**Fix**: Run the migration above

### Emails not arriving
**Causes**: 
- Rate limit hit (4/hour on free)
- Email in spam folder
- Wrong email address

### "Email not confirmed" error
**Fix**: User needs to click confirmation link in email

## Testing New Signups

1. Sign up with a new email
2. Check Inbucket locally: http://localhost:54324
3. Or check actual email inbox in production
4. Click confirmation link
5. Try logging in

## Note on Local Development

The `supabase/config.toml` changes (enable_confirmations = false) only affect LOCAL development. Your production Supabase uses dashboard settings, not this file.

For local testing without emails:
- Emails go to Inbucket at http://localhost:54324
- Or temporarily disable confirmations locally