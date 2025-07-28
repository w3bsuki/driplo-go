# Supabase Production Refactor Plan for Driplo Marketplace

**Generated**: 2025-01-23  
**Priority**: CRITICAL  
**Estimated Timeline**: 6 weeks (detailed breakdown included)  

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Critical Issues](#critical-issues)
4. [Supabase Best Practices 2025](#supabase-best-practices-2025)
5. [Database Refactoring Plan](#database-refactoring-plan)
6. [Authentication Security Hardening](#authentication-security-hardening)
7. [Feature Implementation Plan](#feature-implementation-plan)
8. [Performance Optimization](#performance-optimization)
9. [Security Enhancements](#security-enhancements)
10. [Implementation Timeline](#implementation-timeline)
11. [Testing Strategy](#testing-strategy)
12. [Migration Checklist](#migration-checklist)

## Executive Summary

This document outlines a comprehensive refactoring plan to make Driplo marketplace production-ready with Supabase. The audit revealed **critical database schema mismatches**, **security vulnerabilities**, and **incomplete feature implementations** that must be addressed before launch.

### Key Findings:
- ❌ **53 database tables** exist but **6 critical tables missing**
- ❌ **13+ RPC functions** referenced in code but don't exist
- ❌ **Auth system** lacks rate limiting on registration and CAPTCHA
- ❌ **Rating system** has no user-facing implementation
- ❌ **Messaging** has database column mismatches
- ❌ **No RLS policies** on several critical tables
- ❌ **Performance issues**: Missing indexes, no CDN, no image optimization
- ❌ **Security vulnerabilities**: SECURITY DEFINER functions, unsafe DOM manipulation
- ❌ **Type safety issues**: 1386 TypeScript errors from database mismatches
- ❌ **OTP configuration**: 15-minute expiry too short for production

### Goal:
Transform the current MVP into a secure, performant, production-ready marketplace following Supabase best practices for 2025.

## Current State Analysis

### Database Architecture
```
Current Tables: 53
Missing Tables: 6 (brand_profiles, social_media_accounts, documents, auth_rate_limits, listing_drafts, user_achievements)
Missing RPC Functions: 13+
Dropped Indexes: 30+ (need recreation)
Missing Indexes: ~15 new critical indexes
RLS Policies: Incomplete coverage
Materialized Views: 3 exist but not auto-refreshing
```

### Feature Completeness
- ✅ **Auth**: Basic implementation works
- ✅ **Products**: Create, display, search functional
- ⚠️ **Messaging**: Works but has bugs
- ❌ **Ratings**: Backend only, no UI
- ❌ **Voting**: Not implemented
- ❌ **Brand accounts**: Missing tables

### Security Status
- ⚠️ Basic RLS policies exist
- ❌ No CAPTCHA protection
- ❌ Registration not rate-limited
- ❌ Missing content moderation
- ❌ No virus scanning for uploads

## Critical Issues

### 1. Database Schema Mismatches
```typescript
// Code expects these but they don't exist:
- brand_profiles table (used in 29 files)
- social_media_accounts table (used in 11 files)  
- documents table (used in 2 files)
- auth_rate_limits table (for rate limiting)
- listing_drafts table (for draft saves)
- user_achievements table (for gamification)
- 13+ RPC functions missing (check_auth_rate_limit, log_auth_event, track_listing_view, etc.)
- profiles table missing 20+ columns used by ExtendedProfile interface
- Materialized views exist but lack automatic refresh (listing_stats_mv, seller_performance_mv)
- 30+ performance indexes were dropped and not recreated
```

### 2. Security Vulnerabilities
```typescript
// Critical security gaps:
- No rate limiting on /register endpoint
- No CAPTCHA on auth forms
- Direct file uploads without validation
- Missing RLS policies on multiple tables
- Commented out email service (Resend)
- SECURITY DEFINER functions bypass RLS (check_session_validity, validate_session)
- OTP expiry only 15 minutes (should be 30-60 for production)
- Direct innerHTML usage in CheckoutModal.svelte (potential XSS)
- JWT expiry only 1 hour (consider extending for better UX)
```

### 3. Performance Issues
```typescript
// Performance bottlenecks:
- No indexes on frequently queried columns
- No image CDN or transformations
- Full table scans in browse queries
- Missing composite indexes for messages
- No caching strategy
- 30+ indexes dropped in migration 003 but not recreated
- Materialized views not automatically refreshed
- No pagination limits on some queries
- Missing indexes for auth_rate_limits cleanup
```

## Supabase Best Practices 2025

Based on the latest Supabase documentation and patterns:

### 1. Authentication
- ✅ Use server-side auth with cookie-based sessions
- ✅ Implement `safeGetSession` for JWT validation
- ✅ Enable MFA with `aal2` checks for sensitive operations
- ✅ Use auth hooks for custom logic
- ✅ Implement PKCE for OAuth flows

### 2. Database Design
- ✅ Use RLS for all tables - no exceptions
- ✅ Create security definer functions for complex queries
- ✅ Implement audit logging with PGAudit
- ✅ Use proper indexes with `(select auth.uid())`
- ✅ Leverage `using` and `with check` clauses properly

### 3. Performance
- ✅ Use Supabase CDN with Smart CDN for images
- ✅ Implement image transformations on-the-fly
- ✅ Create materialized views for complex queries
- ✅ Use connection pooling (Supavisor)
- ✅ Implement proper pagination with cursors

### 4. Real-time
- ✅ Use broadcast for typing indicators
- ✅ Implement presence for online status
- ✅ Use Postgres changes for data sync
- ✅ Implement proper channel authorization

### 5. Storage
- ✅ Use resumable uploads for large files
- ✅ Implement S3 compatibility for tools
- ✅ Set proper cache-control headers
- ✅ Use RLS policies on storage.objects

## Database Refactoring Plan

### Phase 1: Schema Fixes (Week 1)

#### 1.1 Create Missing Tables
```sql
-- 1. Create brand_profiles table
CREATE TABLE brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMPTZ,
  website TEXT,
  established_year INTEGER,
  category TEXT,
  subcategory TEXT,
  country TEXT,
  social_links JSONB DEFAULT '{}',
  stats JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create social_media_accounts table  
CREATE TABLE social_media_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  username TEXT NOT NULL,
  url TEXT,
  verified BOOLEAN DEFAULT false,
  follower_count INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- 3. Create documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id)
);

-- 4. Create auth_rate_limits table
CREATE TABLE auth_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create listing_drafts table (if not exists)
CREATE TABLE IF NOT EXISTS listing_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  draft_data JSONB NOT NULL,
  current_step INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create user_achievements table
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_data JSONB DEFAULT '{}',
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);
```

#### 1.2 Add Missing Columns to Profiles
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS 
  phone_number TEXT,
  date_of_birth DATE,
  gender TEXT,
  language_preference TEXT DEFAULT 'en',
  notification_preferences JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  account_status TEXT DEFAULT 'active',
  suspension_reason TEXT,
  last_active TIMESTAMPTZ DEFAULT now(),
  email_notifications_enabled BOOLEAN DEFAULT true,
  push_notifications_enabled BOOLEAN DEFAULT false,
  sms_notifications_enabled BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  stripe_account_id TEXT,
  tax_info JSONB DEFAULT '{}',
  business_info JSONB DEFAULT '{}',
  achievements JSONB DEFAULT '[]',
  badges JSONB DEFAULT '[]';
```

#### 1.3 Create Missing RPC Functions
```sql
-- Auth rate limiting
CREATE OR REPLACE FUNCTION check_auth_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN AS $$
DECLARE
  v_attempts INTEGER;
BEGIN
  -- Clean old attempts
  DELETE FROM auth_rate_limits 
  WHERE created_at < NOW() - INTERVAL '1 hour';
  
  -- Count recent attempts
  SELECT COUNT(*) INTO v_attempts
  FROM auth_rate_limits
  WHERE identifier = p_identifier
    AND action = p_action
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Check limit
  IF v_attempts >= p_max_attempts THEN
    RETURN FALSE;
  END IF;
  
  -- Log attempt
  INSERT INTO auth_rate_limits (identifier, action, created_at)
  VALUES (p_identifier, p_action, NOW());
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- More RPC functions in implementation guide...
```

#### 1.4 Create Critical Indexes
```sql
-- Auth performance
CREATE INDEX idx_auth_rate_limits_lookup ON auth_rate_limits(identifier, action, created_at DESC);

-- User lookups
CREATE INDEX idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;
CREATE INDEX idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;

-- Messaging performance  
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_conversations_participants ON conversations(buyer_id, seller_id);

-- Listings performance
CREATE INDEX idx_listings_category ON listings(category_id, status, created_at DESC);
CREATE INDEX idx_listings_seller ON listings(seller_id, status);
CREATE INDEX idx_listings_search ON listings USING gin(to_tsvector('english', title || ' ' || description));

-- Orders performance
CREATE INDEX idx_orders_buyer ON orders(buyer_id, created_at DESC);
CREATE INDEX idx_orders_seller ON orders(seller_id, created_at DESC);

-- Recreate essential indexes that were dropped
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_seller_active ON listings(seller_id) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_buyer_status ON orders(buyer_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wishlists_user_listing ON wishlists(user_id, listing_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_product ON reviews(product_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;
```

### Phase 2: RLS Policies (Week 1)

#### 2.1 Comprehensive RLS Strategy
```sql
-- Enable RLS on all tables
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Brand profiles policies
CREATE POLICY "Public can view verified brands" ON brand_profiles
  FOR SELECT TO public
  USING (verified = true);

CREATE POLICY "Users can manage own brand" ON brand_profiles
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Social media policies  
CREATE POLICY "Public can view social accounts" ON social_media_accounts
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Users manage own social accounts" ON social_media_accounts
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Documents policies (private)
CREATE POLICY "Users view own documents" ON documents
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Admins view all documents" ON documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );
```

#### 2.2 Storage RLS Policies
```sql
-- Product images
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'products');

CREATE POLICY "Sellers upload own product images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'products' AND
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- Profile images
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.filename(name) = (SELECT auth.uid())::text || '.jpg' OR
     storage.filename(name) = (SELECT auth.uid())::text || '.png')
  );
```

## Authentication Security Hardening

### 1. Implement CAPTCHA (Week 2)
```typescript
// 1. Enable in Supabase dashboard
// 2. Add to forms
import { useState } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

export function SecureAuthForm() {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!captchaToken) {
      showError('Please complete the CAPTCHA');
      return;
    }
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken,
        data: {
          // user metadata
        }
      }
    });
  };
}
```

### 2. Rate Limiting All Endpoints
```typescript
// hooks.server.ts enhancement
const rateLimits = new Map<string, RateLimit>();

const authLimiter = {
  '/auth/register': { max: 3, window: '15m' },
  '/auth/login': { max: 5, window: '15m' },
  '/auth/reset': { max: 2, window: '1h' },
  '/api/messages': { max: 30, window: '1m' },
  '/api/upload': { max: 10, window: '5m' }
};

export const handle: Handle = async ({ event, resolve }) => {
  // Check rate limits
  const limit = authLimiter[event.url.pathname];
  if (limit && !await checkRateLimit(event.clientAddress, limit)) {
    return new Response('Too many requests', { status: 429 });
  }
  
  // Continue...
};
```

### 3. Password Security
```typescript
// Implement password strength requirements
const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character');

// Check against haveibeenpwned
async function checkPasswordLeaked(password: string): Promise<boolean> {
  const hash = await sha1(password);
  const prefix = hash.substring(0, 5);
  const suffix = hash.substring(5);
  
  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  const data = await response.text();
  
  return data.includes(suffix.toUpperCase());
}
```

### 4. Multi-Factor Authentication
```typescript
// Enforce MFA for sensitive operations
CREATE POLICY "Require MFA for payments" ON payment_methods
  AS RESTRICTIVE
  FOR ALL TO authenticated
  USING ((SELECT auth.jwt()->>'aal') = 'aal2');

// In app
async function requireMFA() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user?.aal !== 'aal2') {
    const { error } = await supabase.auth.mfa.challenge({
      factorId: user.factors[0].id
    });
    // Handle MFA flow
  }
}
```

### 5. OTP and JWT Configuration Updates
```toml
# Update supabase/config.toml for better production settings
[auth]
# Increase OTP expiry to 30 minutes for better UX
otp_expiry = 1800  # 30 minutes (was 900/15 minutes)

# Extend JWT expiry for better user experience
jwt_expiry = 7200  # 2 hours (was 3600/1 hour)

# Enable additional security features
enable_signup = true
enable_anonymous_sign_ins = false
```

### 6. Fix SECURITY DEFINER Functions
```sql
-- Review and update SECURITY DEFINER functions to use proper security checks
CREATE OR REPLACE FUNCTION public.check_session_validity(p_session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- First verify the caller has a valid session
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Then check the session
  RETURN EXISTS (
    SELECT 1 FROM sessions 
    WHERE id = p_session_id 
    AND user_id = v_user_id 
    AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql; -- Remove SECURITY DEFINER unless absolutely necessary
```

## Feature Implementation Plan

### 1. Complete Rating System (Week 2)

#### Backend Enhancements
```sql
-- Auto-update seller ratings trigger
CREATE OR REPLACE FUNCTION update_seller_rating() RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    seller_rating = (
      SELECT AVG(rating)::NUMERIC(3,2)
      FROM user_ratings
      WHERE rated_user_id = NEW.rated_user_id
        AND rating_type = 'seller'
    ),
    seller_rating_count = (
      SELECT COUNT(*)
      FROM user_ratings
      WHERE rated_user_id = NEW.rated_user_id
        AND rating_type = 'seller'
    )
  WHERE id = NEW.rated_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_seller_rating_trigger
AFTER INSERT OR UPDATE ON user_ratings
FOR EACH ROW
EXECUTE FUNCTION update_seller_rating();
```

#### Frontend Implementation
```typescript
// RatingModal.svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import RatingStars from '$lib/components/ui/RatingStars.svelte';
  
  export let orderId: string;
  export let ratedUserId: string;
  export let ratingType: 'seller' | 'buyer';
  
  let rating = 0;
  let reviewText = '';
  let submitting = false;
  
  async function submitRating() {
    submitting = true;
    
    const { error } = await supabase
      .from('user_ratings')
      .insert({
        rated_user_id: ratedUserId,
        rater_user_id: (await supabase.auth.getUser()).data.user?.id,
        rating,
        review_text: reviewText,
        rating_type: ratingType,
        transaction_id: orderId
      });
      
    if (!error) {
      dispatch('success');
    }
    
    submitting = false;
  }
</script>
```

### 2. Fix Messaging System (Week 3)

#### Database Fixes
```sql
-- Fix column name mismatch
ALTER TABLE messages RENAME COLUMN content TO message_text;

-- Add missing update policy
CREATE POLICY "Users can update own message read status" ON messages
  FOR UPDATE TO authenticated
  USING (
    receiver_id = (SELECT auth.uid()) OR 
    sender_id = (SELECT auth.uid())
  )
  WITH CHECK (
    -- Only allow updating is_read field
    id = OLD.id AND
    conversation_id = OLD.conversation_id AND
    sender_id = OLD.sender_id AND
    receiver_id = OLD.receiver_id AND
    message_text = OLD.message_text AND
    attachments IS NOT DISTINCT FROM OLD.attachments
  );

-- Add composite index
CREATE INDEX idx_messages_conversation_created 
  ON messages(conversation_id, created_at DESC);
```

#### Enhanced Features
```typescript
// Typing indicators using Realtime Broadcast
const channel = supabase.channel(`typing:${conversationId}`);

// Send typing status
let typingTimeout: NodeJS.Timeout;
function handleTyping() {
  channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { userId: user.id, isTyping: true }
  });
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id, isTyping: false }
    });
  }, 3000);
}

// Receive typing status
channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
  if (payload.userId !== user.id) {
    typingUsers[payload.userId] = payload.isTyping;
  }
});
```

### 3. Implement Brand Features (Week 3)

#### Brand Dashboard
```typescript
// routes/(app)/brands/dashboard/+page.svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import BrandStats from '$lib/components/brands/BrandStats.svelte';
  import BrandProducts from '$lib/components/brands/BrandProducts.svelte';
  import BrandVerification from '$lib/components/brands/BrandVerification.svelte';
  
  let brand: BrandProfile | null = null;
  let stats: BrandStats | null = null;
  
  onMount(async () => {
    // Fetch brand profile
    const { data } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    brand = data;
    
    // Fetch stats
    const { data: statsData } = await supabase
      .rpc('get_brand_stats', { brand_id: brand.id });
      
    stats = statsData;
  });
</script>
```

## Performance Optimization

### 1. Image Optimization (Week 4)

#### Supabase Storage Transformations
```typescript
// utils/supabase-images.ts
export function getOptimizedImageUrl(
  path: string, 
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  }
) {
  const params = new URLSearchParams();
  
  if (options.width) params.set('width', options.width.toString());
  if (options.height) params.set('height', options.height.toString());
  if (options.quality) params.set('quality', options.quality.toString());
  if (options.format) params.set('format', options.format);
  
  return `${supabaseUrl}/storage/v1/render/image/public/${path}?${params}`;
}

// Usage in components
<EnhancedImage
  src={getOptimizedImageUrl(product.images[0], {
    width: 400,
    height: 400,
    quality: 85,
    format: 'webp'
  })}
  fallback={getOptimizedImageUrl(product.images[0], {
    width: 400,
    height: 400,
    quality: 85,
    format: 'jpg'
  })}
/>
```

#### CDN Configuration
```typescript
// Set cache headers for static assets
CREATE POLICY "Set cache headers for product images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'products')
  WITH CHECK (
    -- This is handled by Supabase CDN configuration
    -- Set Cache-Control: public, max-age=31536000
    true
  );
```

### 2. Database Query Optimization

#### Materialized Views for Analytics
```sql
-- Top sellers materialized view
CREATE MATERIALIZED VIEW mv_top_sellers AS
SELECT 
  p.id,
  p.username,
  p.avatar_url,
  p.seller_rating,
  p.seller_rating_count,
  COUNT(DISTINCT o.id) as total_sales,
  SUM(o.total_amount) as total_revenue,
  COUNT(DISTINCT l.id) as active_listings
FROM profiles p
LEFT JOIN orders o ON o.seller_id = p.id AND o.status = 'delivered'
LEFT JOIN listings l ON l.seller_id = p.id AND l.status = 'active'
WHERE p.role = 'seller'
GROUP BY p.id;

-- Refresh every hour
CREATE OR REPLACE FUNCTION refresh_mv_top_sellers() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_sellers;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh
SELECT cron.schedule('refresh-top-sellers', '0 * * * *', 'SELECT refresh_mv_top_sellers()');

-- Also refresh existing materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY IF EXISTS listing_stats_mv;
  REFRESH MATERIALIZED VIEW CONCURRENTLY IF EXISTS seller_performance_mv;
  REFRESH MATERIALIZED VIEW CONCURRENTLY IF EXISTS category_performance_mv;
  REFRESH MATERIALIZED VIEW CONCURRENTLY IF EXISTS mv_top_sellers;
END;
$$ LANGUAGE plpgsql;

-- Schedule all materialized views refresh every hour
SELECT cron.schedule('refresh-all-mvs', '0 * * * *', 'SELECT refresh_all_materialized_views()');
```

#### Optimized Search Queries
```sql
-- Full-text search with proper indexes
CREATE INDEX idx_listings_fts ON listings 
  USING gin(to_tsvector('english', 
    coalesce(title, '') || ' ' || 
    coalesce(description, '') || ' ' || 
    coalesce(brand, '') || ' ' ||
    coalesce(tags::text, '')
  ));

-- Search function
CREATE OR REPLACE FUNCTION search_listings(
  search_query TEXT,
  category_filter UUID DEFAULT NULL,
  min_price DECIMAL DEFAULT NULL,
  max_price DECIMAL DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  title TEXT,
  price DECIMAL,
  images JSONB,
  seller_id UUID,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.title,
    l.price,
    l.images,
    l.seller_id,
    ts_rank(
      to_tsvector('english', 
        coalesce(l.title, '') || ' ' || 
        coalesce(l.description, '') || ' ' || 
        coalesce(l.brand, '')
      ),
      plainto_tsquery('english', search_query)
    ) as relevance
  FROM listings l
  WHERE 
    l.status = 'active' AND
    (category_filter IS NULL OR l.category_id = category_filter) AND
    (min_price IS NULL OR l.price >= min_price) AND
    (max_price IS NULL OR l.price <= max_price) AND
    to_tsvector('english', 
      coalesce(l.title, '') || ' ' || 
      coalesce(l.description, '') || ' ' || 
      coalesce(l.brand, '')
    ) @@ plainto_tsquery('english', search_query)
  ORDER BY relevance DESC, l.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;
```

### 3. Connection Pooling Configuration
```toml
# supabase/config.toml
[db.pooler]
enabled = true
# Transaction mode for better connection reuse
default_pool_size = 25
max_client_conn = 100
# Connection pooling mode
pool_mode = "transaction"
```

## Security Enhancements

### 1. Content Security Policy
```typescript
// hooks.server.ts
const csp = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://js.stripe.com'],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:', supabaseUrl],
  'font-src': ["'self'"],
  'connect-src': ["'self'", supabaseUrl, 'https://api.stripe.com'],
  'frame-src': ['https://js.stripe.com'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': []
};
```

### 2. Input Sanitization and XSS Prevention
```typescript
// utils/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 255);
}

// Fix unsafe DOM manipulation in CheckoutModal.svelte
// Replace direct innerHTML usage with safe alternatives
export function clearElement(element: HTMLElement) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

// Or use Svelte's built-in reactivity
// Instead of: element.innerHTML = '';
// Use: elementContent = '';
// And in template: {@html sanitizeHtml(elementContent)}
```

### 3. Audit Logging
```sql
-- Enable PGAudit extension
CREATE EXTENSION IF NOT EXISTS pgaudit;

-- Configure audit logging
ALTER SYSTEM SET pgaudit.log = 'write, ddl, role';
ALTER SYSTEM SET pgaudit.log_relation = 'on';

-- Create audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit sensitive operations
CREATE OR REPLACE FUNCTION audit_sensitive_operation() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  ) VALUES (
    (SELECT auth.uid()),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to sensitive tables
CREATE TRIGGER audit_payment_methods
  AFTER INSERT OR UPDATE OR DELETE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION audit_sensitive_operation();
```

## Implementation Timeline

### Week 1: Database Foundation & Schema Fixes
- [ ] Day 1: Setup and Analysis
  - [ ] Install and configure Supabase CLI
  - [ ] Pull current production schema
  - [ ] Generate fresh TypeScript types
  - [ ] Create migration plan documentation
  
- [ ] Day 2: Create Missing Tables (6 tables)
  - [ ] Create `brand_profiles` table with indexes and RLS
  - [ ] Create `social_media_accounts` table with constraints
  - [ ] Create `documents` table for verification
  - [ ] Create `auth_rate_limits` table for security
  - [ ] Create `listing_drafts` table for saves
  - [ ] Create `user_achievements` table for gamification
  
- [ ] Day 3: Update Existing Tables
  - [ ] Add 20+ missing columns to profiles table
  - [ ] Fix messages table column name (content → message_text)
  - [ ] Add missing foreign key constraints
  - [ ] Update table comments and documentation
  
- [ ] Day 4: Implement RPC Functions (13+ functions)
  - [ ] Morning: Auth functions (check_auth_rate_limit, log_auth_event)
  - [ ] Afternoon: Analytics functions (track_listing_view, get_user_stats)
  - [ ] Evening: Admin functions (get_unverified_users, verify_user_email)
  
- [ ] Day 5: Performance & Indexes
  - [ ] Recreate 30+ dropped critical indexes
  - [ ] Add new composite indexes for performance
  - [ ] Set up pg_cron for materialized view refresh
  - [ ] Configure autovacuum settings
  
- [ ] Weekend: Testing & Validation
  - [ ] Test all new tables with sample data
  - [ ] Validate RPC functions work correctly
  - [ ] Performance test with explain analyze
  - [ ] Document any issues found

### Week 2: Authentication & Security Hardening
- [ ] Day 1: CAPTCHA Implementation
  - [ ] Configure hCaptcha in Supabase dashboard
  - [ ] Add CAPTCHA to registration form
  - [ ] Add CAPTCHA to login after 3 failed attempts
  - [ ] Add CAPTCHA to password reset
  
- [ ] Day 2: Rate Limiting & Brute Force Protection
  - [ ] Implement server-side rate limiting middleware
  - [ ] Configure rate limits per endpoint
  - [ ] Add IP-based blocking for repeated violations
  - [ ] Set up monitoring alerts for attacks
  
- [ ] Day 3: Multi-Factor Authentication
  - [ ] Enable TOTP in Supabase Auth
  - [ ] Create MFA enrollment flow
  - [ ] Implement MFA challenge UI
  - [ ] Add backup codes generation
  
- [ ] Day 4: Password & Session Security
  - [ ] Update OTP expiry to 30 minutes in config.toml
  - [ ] Extend JWT expiry to 2 hours
  - [ ] Implement haveibeenpwned password checking
  - [ ] Add password strength requirements
  - [ ] Configure session timeout policies
  
- [ ] Day 5: Security Hardening
  - [ ] Fix XSS vulnerabilities in CheckoutModal
  - [ ] Review and fix SECURITY DEFINER functions
  - [ ] Implement Content Security Policy headers
  - [ ] Add security audit logging
  
- [ ] Weekend: Security Testing
  - [ ] Run OWASP ZAP security scan
  - [ ] Test all auth flows with edge cases
  - [ ] Verify rate limiting works correctly
  - [ ] Document security procedures

### Week 3: Core Features & Business Logic
- [ ] Day 1: Rating System Implementation
  - [ ] Create rating UI components
  - [ ] Implement rating submission flow
  - [ ] Add rating display on profiles
  - [ ] Set up rating notifications
  
- [ ] Day 2: Messaging System Fixes
  - [ ] Fix column name mismatch (content → message_text)
  - [ ] Implement typing indicators with Realtime
  - [ ] Add read receipts functionality
  - [ ] Fix conversation list ordering
  
- [ ] Day 3: Brand Features
  - [ ] Create brand dashboard
  - [ ] Implement brand verification flow
  - [ ] Add brand analytics views
  - [ ] Set up brand product management
  
- [ ] Day 4: File Upload System
  - [ ] Configure storage buckets properly
  - [ ] Implement virus scanning with ClamAV
  - [ ] Add image optimization pipeline
  - [ ] Set up CDN for static assets
  
- [ ] Day 5: Payment Integration
  - [ ] Complete Stripe webhook handlers
  - [ ] Implement payment retry logic
  - [ ] Add refund automation
  - [ ] Create payment reporting
  
- [ ] Weekend: Integration Testing
  - [ ] Test complete user journeys
  - [ ] Verify all features work together
  - [ ] Fix integration issues
  - [ ] Update documentation

### Week 4: Performance Optimization & Scaling
- [ ] Day 1: Database Query Optimization
  - [ ] Analyze slow queries with pg_stat_statements
  - [ ] Add missing composite indexes
  - [ ] Optimize N+1 query problems
  - [ ] Implement query result caching
  
- [ ] Day 2: Image & Asset Optimization
  - [ ] Set up Supabase Image Transformations
  - [ ] Configure CDN with proper cache headers
  - [ ] Implement lazy loading for images
  - [ ] Add WebP format support
  
- [ ] Day 3: Real-time Features
  - [ ] Implement presence for online status
  - [ ] Add real-time notifications
  - [ ] Set up order status updates
  - [ ] Configure broadcast for typing indicators
  
- [ ] Day 4: Search & Discovery
  - [ ] Implement full-text search with proper indexes
  - [ ] Add faceted search functionality
  - [ ] Create recommendation engine
  - [ ] Optimize browse page performance
  
- [ ] Day 5: Monitoring & Observability
  - [ ] Set up Sentry error tracking
  - [ ] Configure performance monitoring
  - [ ] Add custom business metrics
  - [ ] Create monitoring dashboards
  
- [ ] Weekend: Load Testing
  - [ ] Run k6 load tests
  - [ ] Identify bottlenecks
  - [ ] Optimize based on results
  - [ ] Document performance baseline

### Week 5: Email, Notifications & Polish
- [ ] Day 1: Email System Setup
  - [ ] Configure Resend integration
  - [ ] Create email templates (welcome, order, etc.)
  - [ ] Implement transactional emails
  - [ ] Add email verification reminders
  
- [ ] Day 2: Push Notifications
  - [ ] Set up OneSignal integration
  - [ ] Implement notification preferences
  - [ ] Create notification templates
  - [ ] Add in-app notification center
  
- [ ] Day 3: Admin Tools
  - [ ] Complete admin dashboard
  - [ ] Add bulk operations
  - [ ] Implement content moderation
  - [ ] Create reporting tools
  
- [ ] Day 4: GDPR Compliance
  - [ ] Implement data export functionality
  - [ ] Add account deletion flow
  - [ ] Create privacy controls
  - [ ] Update privacy policy
  
- [ ] Day 5: Final Polish
  - [ ] Fix all remaining TypeScript errors
  - [ ] Complete missing UI states
  - [ ] Add loading skeletons
  - [ ] Implement error boundaries
  
- [ ] Weekend: User Acceptance Testing
  - [ ] Internal team testing
  - [ ] Gather feedback
  - [ ] Fix reported issues
  - [ ] Prepare for deployment

### Week 6: Deployment & Launch Preparation
- [ ] Day 1: Staging Deployment
  - [ ] Deploy to staging environment
  - [ ] Run migration scripts
  - [ ] Verify all features work
  - [ ] Test with production-like data
  
- [ ] Day 2: Performance Validation
  - [ ] Run load tests on staging
  - [ ] Verify response times meet SLA
  - [ ] Check resource utilization
  - [ ] Optimize if needed
  
- [ ] Day 3: Security Audit
  - [ ] Final security scan
  - [ ] Penetration testing
  - [ ] Review all permissions
  - [ ] Update security documentation
  
- [ ] Day 4: Production Preparation
  - [ ] Create deployment runbook
  - [ ] Set up monitoring alerts
  - [ ] Configure backups
  - [ ] Prepare rollback plan
  
- [ ] Day 5: Go-Live
  - [ ] Execute production deployment
  - [ ] Monitor system health
  - [ ] Be ready for hotfixes
  - [ ] Communicate with stakeholders
  
- [ ] Weekend: Post-Launch Support
  - [ ] Monitor for issues
  - [ ] Respond to user feedback
  - [ ] Plan iteration improvements
  - [ ] Celebrate successful launch! 🎉

## Testing Strategy

### 1. Unit Tests
```typescript
// Example test for auth rate limiting
import { describe, it, expect } from 'vitest';

describe('Auth Rate Limiting', () => {
  it('should block after 5 failed attempts', async () => {
    const email = 'test@example.com';
    
    // Make 5 failed attempts
    for (let i = 0; i < 5; i++) {
      await supabase.auth.signInWithPassword({
        email,
        password: 'wrong'
      });
    }
    
    // 6th attempt should be blocked
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: 'correct'
    });
    
    expect(error?.message).toContain('rate limit');
  });
});
```

### 2. Integration Tests
```typescript
// Test complete user journey
describe('User Journey', () => {
  it('should complete full purchase flow', async () => {
    // 1. Register user
    // 2. Complete profile
    // 3. Browse products
    // 4. Add to cart
    // 5. Checkout
    // 6. Leave rating
  });
});
```

### 3. Performance Tests
```bash
# Load testing with k6
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
};

export default function() {
  const res = http.get('https://driplo.com/api/listings');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
}
```

## Migration Checklist

### Pre-Migration
- [ ] Full database backup
- [ ] Document current schema
- [ ] Test migration scripts locally
- [ ] Prepare rollback plan
- [ ] Notify users of maintenance

### Migration Steps
1. [ ] Enable maintenance mode
2. [ ] Run database migrations
3. [ ] Deploy new code
4. [ ] Run smoke tests
5. [ ] Enable monitoring
6. [ ] Gradual traffic rollout

### Post-Migration
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Document issues
- [ ] Plan improvements

## Monitoring & Observability

### 1. Application Monitoring
```typescript
// Setup Sentry for error tracking
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### 2. Database Monitoring
```sql
-- Query performance monitoring
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 20;

-- Table bloat monitoring
CREATE OR REPLACE VIEW table_bloat AS
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS external_size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
```

### 3. Business Metrics
```typescript
// Track key metrics
export async function trackMetric(
  event: string,
  properties: Record<string, any>
) {
  // Send to analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, properties);
  }
  
  // Store in database for internal analytics
  await supabase.from('analytics_events').insert({
    event,
    properties,
    user_id: user?.id,
    session_id: sessionId,
    timestamp: new Date().toISOString()
  });
}
```

## Conclusion

This comprehensive refactoring plan addresses all critical issues identified in the audit and implements Supabase best practices for 2025. Following this plan will result in a secure, performant, and production-ready marketplace.

### Key Success Metrics
- ✅ All RLS policies implemented and tested
- ✅ Zero critical security vulnerabilities
- ✅ Page load times < 3 seconds
- ✅ API response times < 200ms
- ✅ 99.9% uptime SLA
- ✅ Comprehensive monitoring and alerting

### Next Steps
1. Review and approve this plan
2. Set up staging environment
3. Begin Week 1 implementation
4. Daily progress reviews
5. Weekly stakeholder updates

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-23  
**Status**: Ready for Implementation