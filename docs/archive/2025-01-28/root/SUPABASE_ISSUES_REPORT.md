# Supabase Issues Report

**Generated**: 2025-01-23  
**Updated**: 2025-01-23 (Enhanced with additional critical findings)
**Purpose**: Comprehensive analysis of Supabase-related issues not covered in refactor documentation

## Executive Summary

This report identifies critical Supabase issues that could cause production failures:
- **6 missing database tables** referenced in code (not 3 as originally thought)
- **30+ dropped indexes** that need recreation for performance
- **13+ missing RPC functions** that are actively called
- **Security vulnerabilities** with SECURITY DEFINER functions, XSS risks, and short OTP expiry (15 min)
- **Type safety issues** with 1386 TypeScript errors, many related to database types
- **Performance concerns** with missing indexes, unoptimized queries, and non-refreshing materialized views
- **Missing critical features**: File virus scanning, image optimization, real-time subscriptions

## 1. Missing Database Tables

### Critical Tables Not in Schema
1. **`brand_profiles`** - Used in 29 locations
   - Impact: All brand features broken
   - Files: BrandOnboardingWizard.svelte, profile routes

2. **`social_media_accounts`** - Used in 11 locations
   - Impact: Social media integration fails
   - Files: profile settings, dashboard

3. **`documents`** - Used in 2 locations
   - Impact: Document management broken

4. **`auth_rate_limits`** - Required for rate limiting
   - Impact: No protection against brute force attacks
   - Referenced in check_auth_rate_limit RPC function

5. **`listing_drafts`** - Referenced but may not exist properly
   - Impact: Cannot save draft listings
   - Files: CreateListingForm components

6. **`user_achievements`** - Referenced in profiles
   - Impact: Gamification features broken
   - Files: profile components, leaderboard

### Tables That Need Schema Updates
4. **`profiles`** - Missing 20+ fields used by ExtendedProfile interface
   - Missing: brand fields, onboarding fields, avatar customization
   - Workaround: database.extended.ts adds missing fields (type-only)

## 2. Missing RPC Functions

### Auth Functions (Commented Out - Need Implementation)
```typescript
// Currently commented out in auth-context.svelte.ts
- check_auth_rate_limit
- log_auth_event (used in 5+ places)
```

### Active Functions Not in Database
```typescript
// Called but not defined in migrations
- track_listing_view (analytics)
- get_user_stats (profile stats)
- get_unverified_users_for_admin (admin panel)
- admin_verify_user_email (admin actions)
- create_order_with_payment (checkout flow)
- process_refund (order management)
- get_seller_analytics (dashboard)
- calculate_shipping_cost (checkout)
- validate_coupon_code (discounts)
- get_recommended_listings (personalization)
- bulk_update_order_status (admin)
- export_user_data (GDPR compliance)
- delete_user_account (GDPR compliance)
```

### Functions That Exist But May Have Issues
```typescript
// These exist in migrations but check implementation
- get_top_sellers
- get_brand_sales_stats
- update_order_status
- increment_listing_quantity
```

## 3. Security Vulnerabilities

### 3.1 SECURITY DEFINER Functions
Multiple functions use SECURITY DEFINER which bypasses RLS:
```sql
-- From migrations
CREATE FUNCTION check_session_validity() SECURITY DEFINER
CREATE FUNCTION validate_session() SECURITY DEFINER
CREATE FUNCTION log_user_activity() SECURITY DEFINER
```
**Risk**: These functions run with elevated privileges

### 3.2 OTP Configuration Issues
```toml
# supabase/config.toml
otp_expiry = 900  # Only 15 minutes - may be too short
jwt_expiry = 3600 # 1 hour - consider extending
```

### 3.3 Unsafe DOM Manipulation
```javascript
// CheckoutModal.svelte - Direct innerHTML usage
element.innerHTML = '';  // Line 169, 241, 425
```
**Risk**: Potential XSS if element contains user data

### 3.4 Missing RLS Policies
Some tables may be missing Row Level Security:
- Check all new tables have RLS enabled
- Verify policies cover all CRUD operations

## 4. Performance Issues

### 4.1 Dropped Indexes Not Recreated
Migration 003 dropped 30+ indexes that are critical for performance:
```sql
-- Critical indexes that were dropped and need recreation:
DROP INDEX CONCURRENTLY IF EXISTS idx_listings_seller_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_orders_buyer_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_wishlists_user_listing;
DROP INDEX CONCURRENTLY IF EXISTS idx_reviews_product;
DROP INDEX CONCURRENTLY IF EXISTS idx_messages_conversation;
DROP INDEX CONCURRENTLY IF EXISTS idx_notifications_user_unread;
DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_username;
DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_email;
-- And 22+ more indexes critical for query performance
```

### 4.2 Unoptimized Queries
- No pagination limits on some queries
- Missing indexes for common WHERE clauses
- No query result caching

### 4.3 Materialized Views Not Refreshed
```sql
-- Materialized views exist but no automatic refresh
- listing_stats_mv
- seller_performance_mv  
- category_performance_mv
```

## 5. TypeScript Type Safety Issues

### 5.1 Database Type Mismatches
- 1386 TypeScript errors, many from database types
- Using outdated generated types
- ExtendedProfile interface patches missing fields

### 5.2 RPC Function Types
- rpc.types.ts defines types for non-existent functions
- No runtime validation of RPC responses
- Type assertions used to bypass checks

## 6. TODO Comments Related to Supabase

Found several unimplemented features:
```typescript
// onboarding.svelte.ts:119
// TODO: Implement this using the proper Supabase client from page data

// auth-context.svelte.ts:135
// TODO: Implement rate limiting when RPC function is available

// Multiple locations
// TODO: Implement auth event logging when RPC function is available
```

## 7. Recommendations

### Immediate Actions (Critical)
1. **Regenerate Database Types**
   ```bash
   npx supabase gen types typescript --project-id [ID] > src/lib/types/database.types.ts
   ```

2. **Create Missing Tables**
   ```sql
   CREATE TABLE brand_profiles (
     id UUID PRIMARY KEY REFERENCES profiles(id),
     brand_name TEXT,
     brand_description TEXT,
     -- Add all fields from ExtendedProfile
   );
   
   CREATE TABLE social_media_accounts (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id),
     platform TEXT,
     url TEXT
   );
   
   CREATE TABLE documents (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id),
     type TEXT,
     url TEXT
   );
   ```

3. **Implement Missing RPC Functions**
   - Priority: auth functions for rate limiting and logging
   - Add track_listing_view for analytics
   - Implement admin verification functions

4. **Fix Security Issues**
   - Review all SECURITY DEFINER functions
   - Increase OTP expiry to 30-60 minutes
   - Replace innerHTML with safe alternatives
   - Enable RLS on all tables

### Short-term (This Week)
1. **Optimize Database Performance**
   - Add indexes for common queries
   - Set up materialized view refresh
   - Implement query result caching

2. **Fix Type Safety**
   - Update all imports to use new generated types
   - Remove database.extended.ts
   - Add runtime validation for RPC calls

3. **Complete TODO Items**
   - Implement proper Supabase client usage
   - Add rate limiting
   - Enable auth event logging

### Long-term (This Month)
1. **Set Up Monitoring**
   - Database performance metrics
   - Error tracking for failed queries
   - Security audit logging

2. **Implement Testing**
   - Database migration tests
   - RPC function tests
   - Type safety tests

3. **Documentation**
   - Document all RPC functions
   - Create security guidelines
   - Performance optimization guide

## 8. Missing Production Features

### 8.1 File Upload System
- No virus scanning for uploaded files
- No file size validation on server
- Missing MIME type verification
- No image optimization pipeline
- Storage buckets not properly configured

### 8.2 Real-time Features
- Typing indicators not implemented
- Online presence not set up
- Real-time notifications missing
- Live order status updates not configured

### 8.3 Payment Integration
- Stripe webhooks not fully implemented
- No payment retry logic
- Missing refund automation
- No subscription management

### 8.4 Email System
- Resend integration commented out
- No email templates configured
- Missing transactional emails
- No email verification reminders

## 9. Risk Assessment

### High Risk Issues
1. **Missing tables** - Features completely broken in production
2. **Missing RPC functions** - Runtime errors on function calls
3. **Security vulnerabilities** - Potential data breaches

### Medium Risk Issues
1. **Performance problems** - Slow queries, poor UX
2. **Type safety** - Development friction, potential bugs
3. **OTP configuration** - User frustration with short expiry

### Low Risk Issues
1. **TODO comments** - Features not implemented but not breaking
2. **Deprecated indexes** - May impact performance marginally

## Conclusion

The codebase has significant Supabase-related issues that need immediate attention. The most critical are missing database tables and RPC functions that will cause runtime failures. Security vulnerabilities with SECURITY DEFINER functions and configuration issues also pose risks. A systematic approach starting with database schema updates and type regeneration will resolve many cascading issues.