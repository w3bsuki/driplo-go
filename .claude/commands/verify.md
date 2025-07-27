# /verify - Verification Command

Verifies code changes, migrations, and functionality in the Driplo project.

## Usage
```
/verify [type]
```

## Options
- `migration` - Verify database migration safety
- `rls` - Verify Row Level Security policies
- `api` - Verify API endpoints and server actions
- `types` - Verify TypeScript types
- `mobile` - Verify mobile responsiveness

## What it does:
1. **Migration Verification**
   - Checks for data loss risks
   - Validates rollback capability
   - Tests migration on branch database
   - Verifies indexes and constraints

2. **RLS Verification**
   - Tests all CRUD operations
   - Validates user isolation
   - Checks edge cases
   - Ensures no security gaps

3. **API Verification**
   - Tests error handling
   - Validates input sanitization
   - Checks response formats
   - Verifies authentication

4. **Type Verification**
   - Ensures type safety
   - Validates Supabase types
   - Checks form schemas
   - Reviews API contracts

5. **Mobile Verification**
   - Tests on multiple viewports
   - Validates touch interactions
   - Checks performance on mobile
   - Ensures responsive design

## Examples:
```
/verify migration 20240315_add_messaging_system
/verify rls listings
/verify api create-listing
/verify types Profile
/verify mobile ListingCard
```

## Output Format:
- **Test Results**: Pass/Fail status
- **Coverage**: What was tested
- **Issues Found**: Detailed problem descriptions
- **Recommendations**: How to fix issues