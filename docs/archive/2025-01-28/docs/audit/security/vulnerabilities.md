# Driplo.bg Security Vulnerabilities Report

**Generated**: 2025-07-27  
**Severity Levels**: CRITICAL | HIGH | MEDIUM | LOW  
**OWASP Top 10 Compliance**: Partial  

## Executive Summary

The security audit of Driplo.bg marketplace has identified **48 vulnerabilities** across authentication, authorization, data protection, and infrastructure components. The application requires immediate security hardening before production deployment.

**UPDATE 2025-01-27**: Additional security scan found 3 new critical/high vulnerabilities, most notably an unprotected admin creation endpoint that allows anyone to gain full administrative access.

## 🚨 IMMEDIATE ACTIONS REQUIRED (Within 24 Hours)

1. **DELETE or SECURE `/api/admin/create-first` endpoint** - This allows anyone to become admin!
2. **Add authentication to system endpoints** (`/api/clear-cache`, `/api/clear-session`, `/api/metrics`)
3. **Fix XSS vulnerability** in MessageSearch.svelte (line 207) - Remove `{@html}` usage
4. **Implement RLS policies** on auth_rate_limits and admin_actions tables
5. **Add CAPTCHA** to password reset and email verification endpoints

### Vulnerability Breakdown:
- **CRITICAL**: 9 vulnerabilities requiring immediate attention (1 new found)
- **HIGH**: 17 vulnerabilities that pose significant risk (2 new found)
- **MEDIUM**: 14 vulnerabilities that should be addressed
- **LOW**: 8 vulnerabilities for security hygiene

## CRITICAL Vulnerabilities

### 0. CRITICAL: Unprotected Admin Creation Endpoint
**OWASP**: A01:2021 - Broken Access Control  
**Risk**: CRITICAL - Remote Code Execution / Privilege Escalation  
**Location**: `/src/routes/api/admin/create-first/+server.ts`  
**Added**: 2025-01-27

**Description**: The `/api/admin/create-first` endpoint allows ANYONE to create an admin user without any authentication. This is an immediate and severe security vulnerability that could lead to complete system compromise.

**Exploit Vector**:
```bash
curl -X POST https://driplo.bg/api/admin/create-first \
  -H "Content-Type: application/json" \
  -d '{"email":"attacker@evil.com","password":"admin123"}'
```

**Impact**: 
- Complete administrative access to the system
- Access to all user data and transactions
- Ability to modify any data in the system
- Potential financial theft

**Immediate Fix Required**:
```typescript
// Option 1: Delete the file entirely
// Option 2: Add environment check
if (process.env.NODE_ENV === 'production') {
  throw error(403, 'Forbidden');
}
// Option 3: Require setup token
const setupToken = env.INITIAL_SETUP_TOKEN;
if (!setupToken || request.headers.get('x-setup-token') !== setupToken) {
  throw error(403, 'Invalid setup token');
}
```

### 1. Missing RLS Policies on Critical Tables
**OWASP**: A01:2021 - Broken Access Control  
**Risk**: CRITICAL  
**Location**: Database layer

**Description**: Several database tables lack Row Level Security (RLS) policies, allowing potential unauthorized data access through direct Supabase client connections.

**Affected Tables**:
- `auth_rate_limits` - No RLS policies
- `admin_actions` - No RLS policies
- `seller_payouts` - Incomplete RLS coverage
- `documents` - Missing table entirely
- `brand_profiles` - Missing table entirely

**Proof of Concept**:
```javascript
// Any authenticated user can potentially access all rate limit data
const { data } = await supabase
  .from('auth_rate_limits')
  .select('*');
// Returns all rate limit records without authorization checks
```

### 2. XSS Vulnerability in Message Search
**OWASP**: A03:2021 - Injection  
**Risk**: CRITICAL  
**Location**: `/src/lib/components/messaging/MessageSearch.svelte:207`

**Description**: User-controlled input is rendered as HTML without proper sanitization.

**Vulnerable Code**:
```svelte
{@html highlightText(message.message_text, searchQuery)}
```

**Proof of Concept**:
```javascript
// Attacker sends message containing:
"<img src=x onerror=alert('XSS')>"
// When searched, executes JavaScript in victim's browser
```

### 3. Insufficient Admin Authorization Checks
**OWASP**: A01:2021 - Broken Access Control  
**Risk**: CRITICAL  
**Location**: `/src/lib/server/api-utils.ts:184`

**Description**: Admin role verification relies solely on database field without additional verification layers.

**Vulnerable Pattern**:
```typescript
if (auth.profile.role !== 'admin') {
  return null;
}
// No additional verification or audit logging
```

### 4. JWT Token Expiry Too Short
**OWASP**: A07:2021 - Identification and Authentication Failures  
**Risk**: CRITICAL  
**Location**: Supabase configuration

**Description**: JWT tokens expire after only 1 hour, forcing frequent re-authentication and potential session loss during transactions.

**Current Configuration**:
- JWT expiry: 1 hour
- Refresh token expiry: Not configured properly
- No grace period for active sessions

### 5. Missing CAPTCHA on Critical Forms
**OWASP**: A07:2021 - Identification and Authentication Failures  
**Risk**: CRITICAL  
**Location**: Multiple authentication endpoints

**Affected Endpoints**:
- `/forgot-password` - No CAPTCHA protection
- `/api/auth/resend-verification` - No rate limiting or CAPTCHA
- `/reset-password` - No CAPTCHA validation

### 6. Service Role Key Exposure Risk
**OWASP**: A02:2021 - Cryptographic Failures  
**Risk**: CRITICAL  
**Location**: Environment configuration

**Description**: `SUPABASE_SERVICE_ROLE_KEY` usage in client-accessible code paths without proper isolation.

### 7. Unvalidated File Uploads
**OWASP**: A04:2021 - Insecure Design  
**Risk**: CRITICAL  
**Location**: `/src/routes/api/upload/image/+server.ts`

**Description**: File type validation occurs only on MIME type, which can be spoofed.

**Vulnerable Code**:
```typescript
if (!allowedTypes.includes(file.type)) {
  throw error(400, 'Invalid file type');
}
// No magic number validation or virus scanning
```

### 8. SQL Injection via RPC Functions
**OWASP**: A03:2021 - Injection  
**Risk**: CRITICAL  
**Location**: Multiple RPC function calls

**Description**: Several RPC functions use SECURITY DEFINER without proper input validation.

**Example**:
```sql
CREATE FUNCTION check_auth_rate_limit(p_identifier TEXT)
SECURITY DEFINER
-- Bypasses RLS, must validate all inputs
```

## HIGH Vulnerabilities

### 9. Weak Rate Limiting Implementation
**OWASP**: A04:2021 - Insecure Design  
**Risk**: HIGH  
**Location**: `/src/lib/server/api-utils.ts`

**Description**: In-memory rate limiting resets on server restart, allowing bypass.

### 10. Missing CORS Configuration
**OWASP**: A05:2021 - Security Misconfiguration  
**Risk**: HIGH  
**Location**: API endpoints

**Description**: No explicit CORS headers on API responses, relying on browser defaults.

### 11. Insufficient CSP Headers
**OWASP**: A05:2021 - Security Misconfiguration  
**Risk**: HIGH  
**Location**: `/src/hooks.server.ts:173`

**Current CSP**:
```typescript
"script-src 'self' 'unsafe-inline' 'unsafe-eval'"
// Allows inline scripts and eval - major XSS risk
```

### 12. Session Fixation Vulnerability
**OWASP**: A07:2021 - Identification and Authentication Failures  
**Risk**: HIGH  
**Location**: Authentication flow

**Description**: Sessions not regenerated after successful authentication.

### 13. Weak Password Requirements
**OWASP**: A07:2021 - Identification and Authentication Failures  
**Risk**: HIGH  
**Location**: `/src/routes/(auth)/register/+page.server.ts:7`

**Current Validation**:
```typescript
password: z.string().min(8, 'Password must be at least 8 characters')
// No complexity requirements
```

### 14. Missing Two-Factor Authentication
**OWASP**: A07:2021 - Identification and Authentication Failures  
**Risk**: HIGH  
**Location**: Authentication system

**Description**: No 2FA implementation despite handling financial transactions.

### 15. Exposed Stripe Webhook Secret
**OWASP**: A02:2021 - Cryptographic Failures  
**Risk**: HIGH  
**Location**: Environment variables

**Description**: Webhook signature validation can be bypassed if secret is compromised.

### 16. Direct Object Reference in Orders
**OWASP**: A01:2021 - Broken Access Control  
**Risk**: HIGH  
**Location**: `/api/orders/[id]`

**Description**: Order access based on ID without ownership verification.

### 17. Missing Input Sanitization
**OWASP**: A03:2021 - Injection  
**Risk**: HIGH  
**Location**: Multiple API endpoints

**Description**: User inputs not consistently sanitized before database operations.

### 18. Insecure Direct Object References
**OWASP**: A01:2021 - Broken Access Control  
**Risk**: HIGH  
**Location**: Profile image updates

**Vulnerable Pattern**:
```typescript
// User can potentially update any profile's images
const { error } = await supabase
  .from('profiles')
  .update({ avatar_url: url })
  .eq('id', session.user.id); // Only client-side check
```

### 19. Missing Security Headers
**OWASP**: A05:2021 - Security Misconfiguration  
**Risk**: HIGH  

**Missing Headers**:
- `X-Permitted-Cross-Domain-Policies`
- `Expect-CT`
- `Feature-Policy` (partial implementation)

### 20. Insufficient Logging
**OWASP**: A09:2021 - Security Logging and Monitoring Failures  
**Risk**: HIGH  
**Location**: Security events

**Description**: Critical security events not logged consistently.

### 21. API Key Management
**OWASP**: A02:2021 - Cryptographic Failures  
**Risk**: HIGH  
**Location**: Third-party integrations

**Description**: API keys stored in plain text environment variables.

### 22. Missing Request Signing
**OWASP**: A08:2021 - Software and Data Integrity Failures  
**Risk**: HIGH  
**Location**: Internal API calls

**Description**: No request signing between services.

### 23. Weak Session Management
**OWASP**: A07:2021 - Identification and Authentication Failures  
**Risk**: HIGH  
**Location**: Cookie configuration

**Current Issues**:
- No secure flag in development
- SameSite=lax instead of strict
- 30-day default expiry too long

### 23a. HIGH: Unprotected System Endpoints
**OWASP**: A01:2021 - Broken Access Control  
**Risk**: HIGH  
**Location**: Multiple system endpoints
**Added**: 2025-01-27

**Vulnerable Endpoints**:
- `/api/clear-cache` - No authentication required
- `/api/clear-session` - No authentication required  
- `/api/metrics` - Exposes system metrics without auth

**Exploit**:
```bash
# Clear all sessions without authentication
curl -X POST https://driplo.bg/api/clear-session
# Access system metrics
curl https://driplo.bg/api/metrics
```

### 23b. HIGH: Missing File Content Validation
**OWASP**: A03:2021 - Injection  
**Risk**: HIGH  
**Location**: `/src/routes/api/upload/simple/+server.ts`
**Added**: 2025-01-27

**Description**: File upload endpoints only validate MIME types, which can be easily spoofed. No magic number validation or content scanning is performed.

**Exploit**: Upload malicious file with spoofed MIME type:
```javascript
const file = new File([maliciousContent], "image.jpg", {
  type: "image/jpeg" // Spoofed MIME type
});
```

## MEDIUM Vulnerabilities

### 24. Information Disclosure in Errors
**OWASP**: A04:2021 - Insecure Design  
**Risk**: MEDIUM  
**Location**: API error responses

**Description**: Stack traces and internal details exposed in development mode checks.

### 25. Missing Cache Headers
**OWASP**: A05:2021 - Security Misconfiguration  
**Risk**: MEDIUM  
**Location**: Sensitive endpoints

**Description**: Sensitive data can be cached by proxies/browsers.

### 26. Weak PRNG for IDs
**OWASP**: A02:2021 - Cryptographic Failures  
**Risk**: MEDIUM  
**Location**: Request ID generation

**Vulnerable Code**:
```typescript
Math.random().toString(36).substr(2, 9)
// Predictable random number generation
```

### 27. Missing Anti-Automation
**OWASP**: A04:2021 - Insecure Design  
**Risk**: MEDIUM  
**Location**: Browse/search endpoints

**Description**: No protection against automated scraping.

### 28. Insufficient Password Reset Security
**OWASP**: A07:2021 - Identification and Authentication Failures  
**Risk**: MEDIUM  
**Location**: Password reset flow

**Issues**:
- No token expiry validation
- Single-use tokens not enforced
- No notification to user

### 29. Missing Content Type Validation
**OWASP**: A03:2021 - Injection  
**Risk**: MEDIUM  
**Location**: API endpoints

**Description**: Content-Type header not validated on POST requests.

### 30. Unsafe Redirect
**OWASP**: A01:2021 - Broken Access Control  
**Risk**: MEDIUM  
**Location**: OAuth callback

**Description**: Redirect URLs not validated against whitelist.

### 31. Missing HSTS Preload
**OWASP**: A05:2021 - Security Misconfiguration  
**Risk**: MEDIUM  
**Location**: Security headers

**Description**: HSTS header missing preload directive.

### 32. Weak Cryptographic Storage
**OWASP**: A02:2021 - Cryptographic Failures  
**Risk**: MEDIUM  
**Location**: Sensitive data storage

**Description**: No encryption at rest for sensitive user data.

### 33. Missing Request Timeouts
**OWASP**: A04:2021 - Insecure Design  
**Risk**: MEDIUM  
**Location**: External API calls

**Description**: No timeouts on Stripe/external service calls.

### 34. Insufficient Audit Trail
**OWASP**: A09:2021 - Security Logging and Monitoring Failures  
**Risk**: MEDIUM  
**Location**: Admin actions

**Description**: Admin actions logged but not tamper-proof.

### 35. Missing CSRF Protection
**OWASP**: A01:2021 - Broken Access Control  
**Risk**: MEDIUM  
**Location**: State-changing operations

**Description**: Relying solely on SameSite cookies.

### 36. Weak Email Validation
**OWASP**: A03:2021 - Injection  
**Risk**: MEDIUM  
**Location**: Registration

**Description**: Basic email regex allows edge cases.

### 37. Missing API Versioning
**OWASP**: A08:2021 - Software and Data Integrity Failures  
**Risk**: MEDIUM  
**Location**: API structure

**Description**: No API versioning strategy for backward compatibility.

## LOW Vulnerabilities

### 38. Console Logging in Production
**OWASP**: A09:2021 - Security Logging and Monitoring Failures  
**Risk**: LOW  
**Location**: Multiple files

**Description**: Console statements not fully removed in production builds.

### 39. Missing Security.txt
**OWASP**: A05:2021 - Security Misconfiguration  
**Risk**: LOW  
**Location**: Static files

**Description**: No security disclosure policy.

### 40. Weak Cache Keys
**OWASP**: A04:2021 - Insecure Design  
**Risk**: LOW  
**Location**: Caching layer

**Description**: Cache keys don't include user context.

### 41. Missing Subresource Integrity
**OWASP**: A08:2021 - Software and Data Integrity Failures  
**Risk**: LOW  
**Location**: External scripts

**Description**: External scripts loaded without SRI hashes.

### 42. Verbose Server Headers
**OWASP**: A05:2021 - Security Misconfiguration  
**Risk**: LOW  
**Location**: Response headers

**Description**: Framework version exposed in headers.

### 43. Missing DNS CAA Records
**OWASP**: A05:2021 - Security Misconfiguration  
**Risk**: LOW  
**Location**: DNS configuration

**Description**: No CAA records to prevent unauthorized certificates.

### 44. Incomplete Logout
**OWASP**: A07:2021 - Identification and Authentication Failures  
**Risk**: LOW  
**Location**: Logout flow

**Description**: Server-side session not immediately invalidated.

### 45. Development Endpoints Exposed
**OWASP**: A05:2021 - Security Misconfiguration  
**Risk**: LOW  
**Location**: `/api/health/*`

**Description**: Detailed system information exposed without authentication.

## OWASP Top 10 Compliance Summary

| OWASP Category | Status | Critical Issues |
|----------------|--------|----------------|
| A01: Broken Access Control | ❌ FAIL | Missing RLS, IDOR vulnerabilities |
| A02: Cryptographic Failures | ❌ FAIL | Weak crypto, exposed secrets |
| A03: Injection | ❌ FAIL | XSS, potential SQL injection |
| A04: Insecure Design | ❌ FAIL | Missing security controls |
| A05: Security Misconfiguration | ⚠️ PARTIAL | Weak headers, missing configs |
| A06: Vulnerable Components | ✅ PASS | Dependencies up to date |
| A07: Auth Failures | ❌ FAIL | Weak passwords, no 2FA |
| A08: Data Integrity Failures | ⚠️ PARTIAL | Missing request signing |
| A09: Logging Failures | ❌ FAIL | Insufficient security logging |
| A10: SSRF | ✅ PASS | No SSRF vulnerabilities found |

**Overall Compliance Score**: 2/10 (CRITICAL - Not Production Ready)

## Exploitation Scenarios

### Scenario 1: Account Takeover Chain
1. Attacker uses missing rate limiting to brute force passwords
2. Weak password requirements allow quick success
3. No 2FA to prevent access
4. Session fixation allows persistence
5. XSS vulnerability enables cookie theft

### Scenario 2: Data Exfiltration
1. Attacker gains any authenticated access
2. Exploits missing RLS policies on critical tables
3. Dumps entire auth_rate_limits table
4. Uses IDOR to access all orders
5. Insufficient logging prevents detection

### Scenario 3: Financial Fraud
1. Attacker exploits XSS to steal session
2. Initiates fraudulent transactions
3. Weak webhook validation allows bypass
4. Missing audit trail hinders investigation
5. No 2FA on financial operations

## Next Steps

Refer to `recommendations.md` for detailed remediation guidance and `rls-policies.md` for specific database security implementations.