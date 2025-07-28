# Sentry Error Tracking Setup for Driplo.bg

This document describes the comprehensive Sentry error tracking implementation for the Driplo.bg e-commerce marketplace.

## Overview

Sentry provides production-grade error tracking, performance monitoring, and session replay capabilities. This implementation covers both client-side and server-side error tracking with privacy-focused configuration.

## Features Implemented

### 1. **Core Error Tracking**
- Client-side JavaScript error capture
- Server-side Node.js error capture
- Unhandled promise rejection tracking
- Network error monitoring
- Custom error boundaries integration

### 2. **Performance Monitoring**
- Page load performance tracking
- API request performance monitoring
- Database query performance (when enabled)
- Resource timing tracking
- Web Vitals integration

### 3. **Session Replay**
- Error session replay (100% capture rate)
- Regular session sampling (10% in production)
- Privacy-focused masking of sensitive data
- PII protection for user inputs

### 4. **User Context**
- Authenticated user tracking
- User type differentiation (regular/brand/admin)
- Session tracking across errors
- Privacy-compliant user identification

### 5. **Error Filtering**
- 404 errors excluded
- Expected authentication errors filtered
- Browser extension errors ignored
- Network timeout errors handled gracefully
- Bot traffic filtered

## Configuration

### Environment Variables

```bash
# Required
PUBLIC_SENTRY_DSN=your_sentry_dsn

# Optional (for source maps upload)
SENTRY_AUTH_TOKEN=your_auth_token
SENTRY_ORG=your_organization
SENTRY_PROJECT=your_project
```

### Development Setup

1. **Get your DSN from Sentry:**
   - Go to https://sentry.io
   - Navigate to Settings → Projects → [Your Project] → Client Keys
   - Copy the DSN

2. **Local Development:**
   ```bash
   # .env.local
   PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
   ```

3. **Disable in Development (optional):**
   ```bash
   # Leave empty to disable
   PUBLIC_SENTRY_DSN=
   ```

### Production Setup

1. **Vercel/Production Environment:**
   ```bash
   # Environment Variables
   PUBLIC_SENTRY_DSN=your_production_dsn
   SENTRY_AUTH_TOKEN=your_auth_token
   SENTRY_ORG=your_org
   SENTRY_PROJECT=your_project
   ```

2. **Source Maps Upload (CI/CD):**
   - Auth token enables automatic source map upload
   - Maps are uploaded during build process
   - Deleted after upload for security

## Privacy and GDPR Compliance

### Data Protection Features

1. **PII Filtering:**
   - Email addresses masked
   - Credit card numbers blocked
   - Phone numbers hidden
   - Passwords never captured

2. **Session Replay Privacy:**
   ```javascript
   // Masked selectors
   - input[type="password"]
   - input[type="email"]
   - input[name*="card"]
   - .stripe-card-element
   ```

3. **Request Sanitization:**
   - Authorization headers removed
   - Cookies stripped from logs
   - API keys redacted
   - Sensitive URLs sanitized

4. **User Consent:**
   - Respects cookie consent choices
   - Anonymous tracking option available
   - User ID hashing for privacy

## Error Handling Patterns

### 1. **API Error Handling**
```typescript
try {
  const response = await fetch('/api/endpoint');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
} catch (error) {
  // Automatically captured by Sentry
  throw error;
}
```

### 2. **Custom Error Context**
```typescript
import { captureSentryException } from '$lib/config/sentry';

try {
  // Risky operation
} catch (error) {
  captureSentryException(error, {
    user_action: 'checkout',
    order_id: orderId,
    payment_method: 'stripe'
  });
}
```

### 3. **Breadcrumbs for Context**
```typescript
import { addSentryBreadcrumb } from '$lib/config/sentry';

// Add breadcrumb before action
addSentryBreadcrumb('User clicked checkout', 'user', {
  cart_value: 150.00,
  item_count: 3
});
```

## Performance Monitoring

### 1. **Custom Transactions**
```typescript
import { startSentryTransaction } from '$lib/config/sentry';

const transaction = startSentryTransaction('checkout-flow', 'user-action');
// ... perform operations
transaction?.finish();
```

### 2. **API Performance**
- Automatic tracking of fetch/XHR requests
- Database query performance (when enabled)
- Custom spans for critical operations

## Debugging with Sentry

### 1. **Error Details**
- Unique error IDs for support tickets
- Stack traces with source maps
- User actions leading to error
- Browser/device information

### 2. **Session Replay**
- Visual reproduction of errors
- User interaction timeline
- Network request history
- Console log capture

### 3. **Release Tracking**
- Git commit SHA as release identifier
- Before/after error comparison
- Deployment tracking

## Best Practices

### 1. **Error Boundaries**
- Already integrated with ErrorBoundary component
- Automatic error capture and display
- Graceful error recovery

### 2. **Async Error Handling**
```typescript
// Good - errors are captured
async function riskyOperation() {
  try {
    await someAsyncWork();
  } catch (error) {
    // Log additional context
    console.error('Operation failed:', error);
    throw error; // Re-throw for Sentry
  }
}
```

### 3. **User Feedback**
```typescript
// After error capture
if (window.Sentry) {
  const eventId = window.Sentry.lastEventId();
  // Show feedback form with eventId
}
```

## Monitoring Dashboard

### Key Metrics to Track

1. **Error Rate**
   - Errors per session
   - Error-free sessions
   - Crash rate

2. **Performance**
   - Page load time (LCP, FCP)
   - API response times
   - Database query duration

3. **User Impact**
   - Users affected by errors
   - Most impacted user segments
   - Error patterns by user type

### Alerts Configuration

1. **Critical Alerts:**
   - Error rate spike (>10% increase)
   - New error types
   - Performance regression
   - High impact errors

2. **Warning Alerts:**
   - Increasing error trend
   - Slow transactions
   - Failed payments

## Troubleshooting

### Sentry Not Capturing Errors

1. **Check DSN Configuration:**
   ```bash
   echo $PUBLIC_SENTRY_DSN
   ```

2. **Verify Initialization:**
   - Check browser console for Sentry
   - Look for `window.Sentry` object

3. **Check Filters:**
   - Review beforeSend configuration
   - Check ignored errors list

### Source Maps Not Working

1. **Build Configuration:**
   - Ensure `sourcemap: true` in vite.config
   - Check SENTRY_AUTH_TOKEN is set

2. **Upload Verification:**
   - Check Sentry project settings
   - Verify release artifacts

### Performance Issues

1. **Reduce Sample Rate:**
   ```typescript
   tracesSampleRate: 0.1 // 10% sampling
   ```

2. **Disable Session Replay:**
   ```typescript
   replaysSessionSampleRate: 0
   ```

## Security Considerations

1. **DSN Exposure:**
   - DSN is public (safe to expose)
   - Rate limiting prevents abuse
   - Domain whitelist recommended

2. **Sensitive Data:**
   - Never log passwords
   - Mask credit card info
   - Sanitize user inputs
   - Remove auth tokens

3. **Source Maps:**
   - Upload only, don't serve publicly
   - Delete after upload
   - Use auth tokens securely

## Maintenance

### Regular Tasks

1. **Review Error Trends:**
   - Weekly error summary
   - Identify patterns
   - Fix recurring issues

2. **Update Filters:**
   - Add new browser extensions
   - Update error patterns
   - Adjust sample rates

3. **Performance Review:**
   - Check impact on users
   - Optimize heavy operations
   - Review alert thresholds

### Version Updates

```bash
# Update Sentry SDK
pnpm update @sentry/sveltekit

# Check for breaking changes
# Update configuration as needed
```

## Support and Resources

- **Sentry Documentation:** https://docs.sentry.io/platforms/javascript/guides/sveltekit/
- **Best Practices:** https://docs.sentry.io/best-practices/
- **Privacy Policy:** Update your privacy policy to mention error tracking
- **Support:** Use error IDs when reporting issues