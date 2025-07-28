# Production Deployment Checklist

## Pre-Deployment

### Environment Configuration
- [ ] Set all required environment variables
  - [ ] `SUPABASE_URL` - Production Supabase URL
  - [ ] `SUPABASE_ANON_KEY` - Production anon key
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)
  - [ ] `STRIPE_SECRET_KEY` - Production Stripe key
  - [ ] `STRIPE_PUBLISHABLE_KEY` - Production publishable key
  - [ ] `PUBLIC_SENTRY_DSN` - Sentry error tracking
  - [ ] `PUBLIC_TURNSTILE_SITE_KEY` - Cloudflare Turnstile CAPTCHA

### Database Setup
- [ ] Run all migrations in production
- [ ] Verify RLS policies are enabled on all tables
- [ ] Check indexes exist for performance
- [ ] Enable pg_cron for scheduled tasks
- [ ] Configure backup strategy

### Security Checklist
- [ ] Enable Turnstile CAPTCHA in production
- [ ] Configure rate limiting thresholds
- [ ] Set secure cookie settings
- [ ] Enable HTTPS everywhere
- [ ] Configure CSP headers
- [ ] Review and enable RLS policies
- [ ] Set up JWT token expiry (2 hours)
- [ ] Configure OTP expiry (30 minutes)

### Performance Optimization
- [ ] Build with production optimizations
- [ ] Enable code splitting and lazy loading
- [ ] Configure CDN for static assets
- [ ] Set up image optimization pipeline
- [ ] Enable gzip/brotli compression
- [ ] Configure caching headers

## Deployment Steps

1. **Build Application**
   ```bash
   pnpm run build
   pnpm run preview  # Test production build locally
   ```

2. **Database Migration**
   ```bash
   supabase db push --db-url $DATABASE_URL
   ```

3. **Deploy to Hosting**
   - Deploy to your preferred hosting (Vercel, Netlify, etc.)
   - Ensure Node.js 18+ runtime
   - Set all environment variables

4. **Post-Deployment Verification**
   - [ ] Homepage loads correctly
   - [ ] Authentication flow works
   - [ ] Create listing flow completes
   - [ ] Payment processing works
   - [ ] Image uploads function
   - [ ] Search and filters work
   - [ ] Error tracking reports to Sentry

## Monitoring Setup

### Error Tracking
- [ ] Verify Sentry is receiving errors
- [ ] Set up error alerts for critical issues
- [ ] Configure user feedback collection
- [ ] Enable session replay (1% sampling)

### Performance Monitoring
- [ ] Web Vitals tracking enabled
- [ ] Set up performance budgets
- [ ] Configure alerts for slow pages
- [ ] Monitor database query performance

### Business Metrics
- [ ] Track user registrations
- [ ] Monitor listing creation rate
- [ ] Track conversion funnel
- [ ] Monitor payment success rate

## Rollback Plan

1. **Keep Previous Build**
   - Tag previous production release
   - Keep build artifacts for quick rollback

2. **Database Rollback**
   - Keep migration down scripts ready
   - Have database backup before migration

3. **Quick Rollback Steps**
   ```bash
   # Revert to previous build
   git checkout [previous-tag]
   pnpm run build
   # Deploy previous version
   ```

## First Week Monitoring

- [ ] Monitor error rates closely
- [ ] Check performance metrics daily
- [ ] Review user feedback
- [ ] Monitor server resources
- [ ] Check for security incidents
- [ ] Verify backup systems working

## Security Contacts

- **Security Issues**: security@driplo.bg
- **Critical Incidents**: Use PagerDuty
- **Database Issues**: Supabase support
- **Payment Issues**: Stripe support