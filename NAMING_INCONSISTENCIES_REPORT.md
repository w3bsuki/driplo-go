# Naming Inconsistencies Report

Generated: 2025-01-23

## Executive Summary

This report identifies naming inconsistencies across the Driplo codebase, focusing on file naming, component naming, prop naming, and function/variable naming patterns. The analysis reveals multiple inconsistent patterns that should be standardized for better maintainability.

## 1. File Naming Inconsistencies

### 1.1 Component Files (Mixed Cases)

**PascalCase Components:**
- `NotificationPopup.svelte`
- `CategoryBadge.svelte`, `ConditionBadge.svelte`, `SizeBadge.svelte`, `VerifiedBadge.svelte`
- `BrandOnboardingWizard.svelte`, `TopBrands.svelte`
- `FilterBar.svelte`
- `CategoryLanding.svelte`, `TopThreeSellers.svelte`
- `CheckoutFlow.svelte`, `CheckoutModal.svelte`, `LazyCheckoutFlow.svelte`
- `EnhancedImage.svelte`

**kebab-case Components:**
- `alert-description.svelte`, `alert-title.svelte`, `alert.svelte`
- `avatar-fallback.svelte`, `avatar-image.svelte`
- `card-action.svelte`, `card-content.svelte`, `card-description.svelte`
- `dropdown-menu-checkbox-item.svelte`, `dropdown-menu-content.svelte`
- `radio-group-item.svelte`, `radio-group.svelte`
- `select-content.svelte`, `select-item.svelte`
- `sheet-content.svelte`, `sheet-header.svelte`
- `tabs-content.svelte`, `tabs-list.svelte`

**Recommendation:** Standardize on PascalCase for all component files (industry standard for Svelte components)

### 1.2 Utility Files (Mostly Consistent)

All utility files use kebab-case, which is good:
- `api-client.ts`, `error-handling.ts`, `image-optimization.ts`
- `auth-validation.ts`, `cache-headers.ts`, `form-validation.ts`

**Exception found:** 
- `cn.ts` (should be `class-names.ts` or similar for consistency)

### 1.3 Store Files (Inconsistent)

Mix of naming patterns in `src/lib/stores/`:
- Kebab-case: `auth-compat.ts`, `cookie-consent.svelte.ts`, `query-client.ts`
- Single words: `auth.ts`, `messages.ts`, `motion.ts`, `stripe.ts`
- With .svelte suffix: `auth-context.svelte.ts`, `notifications.svelte.ts`

**Recommendation:** Use kebab-case consistently, with `.svelte.ts` suffix for rune-based stores

### 1.4 Directory Naming (Mixed Cases)

**kebab-case directories:**
- `cookie-consent/`
- `dropdown-menu/`, `radio-group/`

**Regular lowercase directories:**
- `badges/`, `brands/`, `browse/`, `category/`, `checkout/`, `common/`
- `dashboard/`, `features/`, `home/`, `layout/`, `listings/`

**Recommendation:** Use lowercase for all directories (current majority pattern)

## 2. Component & Interface Naming Patterns

### 2.1 Props Interface Naming

Found patterns:
- Simple `Props` interface (most common)
- Some files use inline prop definitions without interfaces
- No consistent prefix/suffix pattern (e.g., `IProps`, `ComponentProps`, etc.)

**Recommendation:** Use `ComponentNameProps` pattern for clarity

### 2.2 Event Handler Naming

Mixed patterns observed:
- Some use `onEvent` pattern
- Some use `handleEvent` pattern
- Some use simple function names without prefix

**Example inconsistencies:**
```typescript
// In some components:
onComplete: () => void;

// In others:
handleSubmit: () => void;

// And sometimes:
submit: () => void;
```

**Recommendation:** Standardize on `onEvent` for props and `handleEvent` for internal handlers

## 3. Variable & Constant Naming

### 3.1 Constants

Mixed patterns:
- `PRICE_CURRENCY`, `PRICE_LOCALE` (SCREAMING_SNAKE_CASE)
- `AVATAR_GRADIENT_COLORS`, `API_RETRY_DELAY`
- But also: `buttonVariants`, `activeSteps` (camelCase)

**Recommendation:** Use SCREAMING_SNAKE_CASE for true constants, camelCase for derived values

### 3.2 Object Keys

Inconsistent patterns found:
- Snake_case: `'new_with_tags'`, `'very_good'`, `'condition_fair'`
- Kebab-case: `'top-right'`, `'condition-new-with-tags'`
- Camelcase keys in some objects

**Recommendation:** Use camelCase for JavaScript object keys, kebab-case only for CSS classes

## 4. Route & API Naming

### 4.1 Route Segments

Consistent use of kebab-case for routes (good):
- `/forgot-password`, `/reset-password`, `/auth-code-error`
- `/load-more`, `/unread-count`, `/mark-shipped`

### 4.2 API Endpoints

Also consistent kebab-case (good):
- `/api/auth/resend-verification`
- `/api/orders/mark-shipped`
- `/api/payment/create-intent`

## 5. Database & Type-Related Naming

### 5.1 Database Column References

Snake_case used (following database convention):
- `account_type`, `is_verified`, `created_at`

### 5.2 Type Definitions

Files follow kebab-case:
- `api.types.ts`, `rpc.types.ts`

## 6. Specific Inconsistencies to Address

### High Priority Issues:

1. **Component File Naming**: Mix of PascalCase and kebab-case in UI components
2. **Event Handler Props**: No consistent pattern for event callbacks
3. **Constants vs Variables**: Mixed use of SCREAMING_SNAKE_CASE and camelCase
4. **Object Key Naming**: Mix of snake_case, kebab-case, and camelCase

### Medium Priority Issues:

1. **Directory Structure**: Some directories use kebab-case while most use lowercase
2. **Props Interface Naming**: Generic `Props` vs specific naming
3. **Component Import Paths**: Some use index.ts exports, others direct imports
4. **Class Prop Naming**: Inconsistent use of `class` vs `className` for CSS class props

### Low Priority Issues:

1. **Utility File Exceptions**: `cn.ts` breaks kebab-case pattern
2. **CSS Custom Properties**: Mix of naming conventions in CSS variables

## 7. Recommended Naming Conventions

### Files
- **Components**: PascalCase (e.g., `ListingCard.svelte`)
- **Utilities**: kebab-case (e.g., `image-utils.ts`)
- **Types**: kebab-case with .types suffix (e.g., `api.types.ts`)
- **Tests**: Match source file with .test suffix

### Code
- **Components**: PascalCase
- **Props Interfaces**: `ComponentNameProps`
- **Event Props**: `onEventName`
- **Event Handlers**: `handleEventName`
- **Constants**: SCREAMING_SNAKE_CASE
- **Variables/Functions**: camelCase
- **CSS Classes**: kebab-case
- **Object Keys**: camelCase (except when matching external APIs/databases)

### Directories
- **All directories**: lowercase (no kebab-case or camelCase)

## 8. Migration Strategy

1. **Phase 1**: Update component file names to PascalCase
2. **Phase 2**: Standardize event handler naming
3. **Phase 3**: Update directory names to lowercase
4. **Phase 4**: Refactor object key naming
5. **Phase 5**: Update constants to proper case

Each phase should include:
- Automated migration script where possible
- Update of import statements
- Testing to ensure no breakage
- Documentation updates

## 9. Automated Checks

Consider adding:
- ESLint rules for naming conventions
- Pre-commit hooks to check file naming
- Custom linting rules for Svelte components
- TypeScript compiler options for consistent casing