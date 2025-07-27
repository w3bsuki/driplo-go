# Supabase Dashboard Manual Configuration Checklist

## 🔴 Critical Security Configurations

These settings must be configured manually in the Supabase Dashboard as they cannot be set via migrations.

### 1. OTP Expiry Time (High Priority)
**Location**: Authentication > Email Templates > Settings
**Action**: Set OTP expiry to 30 minutes
**Current**: Default (likely 3600 seconds / 1 hour)
**Target**: 1800 seconds (30 minutes)
**Reason**: Reduces window for OTP code compromise

### 2. Leaked Password Protection (High Priority)  
**Location**: Authentication > Auth Providers > Email
**Action**: Enable "Check passwords against known breaches"
**Current**: Disabled by default
**Target**: Enabled
**Reason**: Prevents users from using compromised passwords from data breaches

### 3. Move pg_trgm Extension (Medium Priority)
**Location**: Database > Extensions
**Action**: Move pg_trgm extension out of public schema
**SQL Command**:
```sql
-- First create a dedicated schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move the extension
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Update search_path for functions that use it
-- This needs to be done for any functions using pg_trgm
```
**Reason**: Security best practice to keep extensions out of public schema

## 📊 Performance Configurations

### 4. Connection Pooling Settings
**Location**: Settings > Database
**Current Settings**: Check and document current pool size
**Recommended**:
- PostgREST API heavy usage: ≤40% of max connections
- Standard usage: Up to 80% of max connections
- Monitor with the query in `/docs/database-connection-pooling.md`

### 5. Database Compute Size
**Location**: Settings > Infrastructure
**Monitor**: Cache hit rates (should be >99%)
**Action**: If cache hit rates drop below 99%, consider upgrading compute for more memory

## 🔍 Monitoring Setup

### 6. Enable Query Performance Insights
**Location**: Database > Query Performance
**Action**: Ensure pg_stat_statements is enabled and collecting data
**Verify**: Run the verification queries from phase2-best-practices.md

### 7. Set Up Alerts
**Location**: Settings > Alerts
**Recommended Alerts**:
- Database connection usage > 80%
- Cache hit rate < 95%
- Failed authentication attempts spike
- Storage usage > 80%

## ✅ Verification Steps

After completing each configuration:

1. **OTP Expiry**: Test password reset flow and verify 30-minute expiry
2. **Leaked Password**: Try to set a known compromised password (e.g., "password123")
3. **pg_trgm**: Run `\dx` in SQL editor to verify extension schema
4. **Connection Pooling**: Monitor active connections using provided queries
5. **Query Performance**: Check that slow query logs are being collected

## 📝 Documentation Updates

After completing manual configurations:
1. Update `.env.example` with any new configuration notes
2. Document actual pool size settings in connection pooling guide
3. Add monitoring dashboard URLs to team documentation

## 🚨 Important Notes

- These settings are project-specific and must be configured for each environment
- Some settings may require a database restart (Supabase handles this automatically)
- Always test in staging/development before applying to production
- Keep screenshots of configuration changes for audit trail

## 📅 Regular Maintenance

Schedule monthly reviews of:
- Connection pool usage patterns
- Cache hit rates
- Slow query logs
- Failed authentication attempts
- Extension security updates