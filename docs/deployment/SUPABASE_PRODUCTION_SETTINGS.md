# Supabase Production Settings Guide

## Authentication Settings (REQUIRED)

### 1. JWT Expiry Settings
**Location**: Authentication > Settings > JWT Settings

**Current**: 3600 seconds (1 hour)  
**Recommended**: KEEP AT 3600 seconds (1 hour)

⚠️ **Important**: JWT should remain short-lived. Session persistence is handled by refresh tokens, not JWT expiry.

### 2. Session Management
**Location**: Authentication > Settings > Sessions

- ✅ Enable "Auto-refresh sessions before expiry"
- **Inactivity Timeout**: 2592000 seconds (30 days) - Sessions expire after 30 days of inactivity
- **Time-box Sessions**: 7776000 seconds (90 days) - Maximum session lifetime
- **Single Session Per User**: Optional (enable for higher security)

### 3. Email Confirmations
**Location**: Authentication > Settings > Email Auth

- ✅ Enable email confirmations for sign-ups
- ✅ Enable secure email change (requires confirmation on both emails)
- Set confirmation expiry: 86400 seconds (24 hours)

### 4. OAuth Providers
**Location**: Authentication > Providers

Configure redirect URLs for production domain:
- Google OAuth: Add `https://yourdomain.com/callback`
- GitHub OAuth: Add `https://yourdomain.com/callback`

### 5. Email Templates
**Location**: Authentication > Email Templates

Customize email templates for:
- Confirmation emails
- Password reset emails
- Email change confirmation

## Database Settings

### 1. Connection Pooling
**Location**: Settings > Database

- Enable connection pooling for production
- Pool mode: Session
- Pool size: 15 (adjust based on traffic)

### 2. Performance Settings
**Location**: Settings > Database > Performance

- Enable `pg_stat_statements` extension (already enabled via migration)
- Monitor slow queries regularly

## Security Settings

### 1. Row Level Security (RLS)
**Status**: ✅ Already enabled on all tables

### 2. API Settings
**Location**: Settings > API

- Rate limiting: Already configured in config
- Anon key permissions: Read-only for public data

### 3. CORS Settings
**Location**: Settings > API > CORS

Add your production domain:
```
https://yourdomain.com
https://www.yourdomain.com
```

## Storage Settings

### 1. Buckets Security
**Location**: Storage > Buckets

Verify policies for:
- `avatars`: Public read, authenticated write
- `listings`: Public read, authenticated write  
- `brand-logos`: Public read, brand accounts write

### 2. Image Transformation (Pro Feature)
**Location**: Storage > Settings

If on Pro plan, enable:
- Image resizing
- Format conversion
- Quality optimization

## Email/SMTP Configuration

### 1. Production Email Provider
**Location**: Settings > Email

Configure production SMTP:
```
Host: smtp.sendgrid.net (or your provider)
Port: 587
Username: apikey
Password: [Your SendGrid API Key]
Sender email: noreply@yourdomain.com
Sender name: Driplo
```

### 2. Email Rate Limits
Adjust based on your plan:
- Free tier: 2 per hour
- Pro tier: Unlimited (configure in settings)

## Monitoring & Logs

### 1. Enable Logging
**Location**: Settings > Logs

- Log retention: 7 days (Free) / 30 days (Pro)
- Enable query logs for debugging

### 2. Metrics & Monitoring
**Location**: Reports > Database

Monitor:
- Active connections
- Cache hit ratio (should be >95%)
- Index usage
- Slow queries

## Environment Variables

Ensure these are set in your deployment platform:

```env
PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
PUBLIC_APP_URL=https://yourdomain.com
SENDGRID_API_KEY=[your-sendgrid-key]
```

## Security Issues to Fix (From Supabase Advisors)

### 1. ⚠️ Auth OTP Long Expiry
**Current**: 3600 seconds (1 hour)  
**Recommended**: Less than 1 hour for security

**Fix**: Authentication > Settings > Email Auth
- Set OTP expiry: 900 seconds (15 minutes)

### 2. ⚠️ Leaked Password Protection Disabled
**Fix**: Authentication > Settings > Security
- ✅ Enable "Check passwords against HaveIBeenPwned"

### 3. 🔴 Security Definer Views
**Issue**: Views `listings_with_priority` and `cache_performance` use SECURITY DEFINER  
**Risk**: May bypass RLS policies

**Action Required**: Review these views to ensure they don't expose sensitive data

### 4. ⚠️ Function Search Path
**Issue**: `update_updated_at_column` function has mutable search_path  
**Already Fixed**: Migration includes proper search_path settings

### 5. ⚠️ Extension in Public Schema
**Issue**: `pg_trgm` extension in public schema  
**Low Priority**: Common practice, but can be moved if needed

## Pre-Launch Checklist

- [ ] Keep JWT expiry at 1 hour (default)
- [ ] Configure Inactivity Timeout (30 days recommended)
- [ ] Configure Time-box Sessions (90 days recommended)
- [ ] Enable session auto-refresh  
- [ ] Configure production OAuth redirect URLs
- [ ] Set up production SMTP
- [ ] Verify all RLS policies are enabled
- [ ] Configure CORS for production domain
- [ ] Enable appropriate logging
- [ ] Set OTP expiry to 15 minutes
- [ ] Enable leaked password protection
- [ ] Review SECURITY DEFINER views
- [ ] Test user registration flow
- [ ] Test password reset flow
- [ ] Test OAuth login flows
- [ ] Verify email templates
- [ ] Check storage bucket policies
- [ ] Monitor initial performance metrics

## Notes

- The "remember me" functionality now stores session preference locally
- Default session is 30 days, extended to 90 days with "remember me"
- Reviews/ratings system properly requires completed orders
- User profiles are automatically created via database trigger