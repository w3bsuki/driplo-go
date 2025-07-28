# Database Schema Mismatch Report

**Generated**: 2025-01-23  
**Purpose**: Identify discrepancies between database schema and TypeScript implementation

## Summary

This report documents all mismatches between the database schema defined in `database.ts`/`database.types.ts` and the actual usage in the codebase. These mismatches can cause runtime errors and type safety issues.

## 1. Missing Tables in Database Schema

The following tables are referenced in the codebase but do not exist in the database schema:

### 1.1 `brand_profiles` Table
- **Used in**: 29 locations across the codebase
- **Key files**:
  - `src/lib/components/brands/BrandOnboardingWizard.svelte`
  - `src/routes/(app)/profile/[username]/+page.server.ts`
  - `src/routes/brands/settings/+page.svelte`
  - `src/lib/components/onboarding/ProfileSetupWizard.svelte`
- **Impact**: Brand profile features will fail at runtime

### 1.2 `social_media_accounts` Table
- **Used in**: 11 locations
- **Key files**:
  - `src/routes/(app)/profile/settings/+page.svelte`
  - `src/routes/dashboard/brands/[id]/+page.server.ts`
  - `src/routes/brands/settings/+page.server.ts`
- **Impact**: Social media integration features will fail

### 1.3 `documents` Table
- **Used in**: 2 locations
- **Key files**:
  - `src/routes/brands/settings/+page.svelte`
- **Impact**: Document upload/management features will fail

## 2. Missing RPC Functions

The following RPC functions are called but not defined in the database schema:

### 2.1 Auth-Related Functions (Commented Out)
- `check_auth_rate_limit` - Used in auth-context.svelte.ts (commented out)
- `log_auth_event` - Used in multiple auth flows (commented out)

### 2.2 Active RPC Functions Not in Schema
- `track_listing_view` - Used for view tracking
- `get_user_stats` - Used for user statistics
- `get_top_sellers` - Used for seller rankings
- `get_brand_sales_stats` - Used for brand analytics
- `get_top_brands` - Used for brand listings
- `log_admin_action` - Used for audit logging
- `get_unverified_users_for_admin` - Admin functionality
- `admin_verify_user_email` - Admin functionality
- `generate_order_number` - Order management
- `update_order_status` - Order management
- `increment_listing_quantity` - Inventory management
- `get_payout_statistics` - Payout analytics
- `mark_messages_as_read` - Message management

## 3. Schema Type Mismatches

### 3.1 Extended Profile Fields
The `profiles` table in the schema is missing many fields that are used via `ExtendedProfile` interface:
- Brand-specific fields (brand_name, brand_description, etc.)
- Onboarding fields (has_completed_onboarding, onboarding_step, etc.)
- Avatar customization fields (avatar_style, avatar_seed, etc.)

### 3.2 Table Existence in Schema
The schema DOES include these tables that were previously thought missing:
- ✅ `brand_verification_requests` - Exists in schema
- ✅ `admin_approvals` - Exists in schema

## 4. Type Safety Issues

### 4.1 Type Casting Workarounds
Multiple files use `database.extended.ts` to add missing types, indicating schema drift:
```typescript
// ExtendedProfile interface adds 20+ fields not in the base schema
export interface ExtendedProfile extends Database['public']['Tables']['profiles']['Row'] {
  // ... many additional fields
}
```

### 4.2 RPC Type Definitions
`rpc.types.ts` defines types for RPC functions that may not exist in the database, creating a false sense of type safety.

## 5. Recommendations

### Immediate Actions Required:
1. **Generate fresh database types** from Supabase:
   ```bash
   npx supabase gen types typescript --local > src/lib/types/database.types.ts
   ```

2. **Create missing tables** in Supabase:
   - `brand_profiles`
   - `social_media_accounts`
   - `documents`

3. **Add missing RPC functions** or remove their usage

4. **Update profile table schema** to include all extended fields

### Long-term Solutions:
1. Set up automated type generation in CI/CD
2. Add database migration tracking
3. Implement schema validation tests
4. Remove `database.extended.ts` once schema is updated

## 6. Critical Impact Areas

1. **Brand Features** - Completely broken without `brand_profiles` table
2. **Social Media Integration** - Non-functional
3. **Document Management** - Will fail on any document operations
4. **Analytics & Reporting** - Many RPC functions missing
5. **Order Management** - Critical RPC functions not in schema

## 7. Files Requiring Updates After Schema Fix

- All files importing from `database.extended.ts`
- Auth context using commented RPC functions
- Brand-related components and routes
- Profile settings pages
- Admin functionality pages

---

**Note**: This report should be addressed urgently as these mismatches will cause runtime failures in production.