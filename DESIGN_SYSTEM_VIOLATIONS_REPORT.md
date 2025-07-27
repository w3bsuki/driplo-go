# Design System Violations Report

## Overview
This report identifies all Svelte components that violate the established design system standards. The product cards have been identified as a priority for immediate fixes.

## Design Standards to Enforce
1. **Border Radius**: Only use `rounded-sm` (no rounded-md, rounded-lg, rounded-xl)
2. **Shadows**: Remove all shadow-* classes except for dropdowns/modals
3. **Heights**: Use compact sizes (no h-10, h-12, h-14)
4. **Spacing**: Use tighter spacing (no p-4, p-6, gap-4, gap-6)
5. **Text Sizes**: Use text-sm for body text (no text-base or text-lg except headings)
6. **Transitions**: Always use duration-100 (not duration-fast, duration-200, etc)
7. **Focus Rings**: Use ring-1 (not ring-2) with minimal offset
8. **Borders**: Use single borders (not border-2) with gray-200

## ✅ COMPLETED FIXES (2025-07-24)

### Priority 1: Product Card Components ✅
- **ListingCard.svelte** - FIXED:
  - All rounded-md → rounded-sm
  - All avatars now use rounded-sm
  - Error state rounded-b-xl → rounded-b-sm
  - Transitions use duration-100
  
- **ListingGrid.svelte** - FIXED:
  - All rounded-lg/xl → rounded-sm
  - Spacing: py-3→py-2, gap-3→gap-2, p-4→p-3
  - Text sizes: text-base/lg → text-sm
  - Removed shadow-sm from skeleton
  - All transitions use duration-100

### Priority 2: Core UI Components ✅
- **Button.svelte** - FIXED: All sizes use rounded-sm, text-sm, duration-100, ring-1
- **Input.svelte** - FIXED: rounded-sm, removed text-base from lg, duration-100, ring-1
- **Textarea.svelte** - FIXED: rounded-sm, duration-100, ring-1
- **SelectTrigger.svelte** - FIXED: rounded-sm, duration-100, ring-1
- **SelectContent.svelte** - FIXED: rounded-sm (kept shadow-md for dropdown)

### Priority 3: High-Traffic Components ✅
- **HeroSearch.svelte** - FIXED:
  - All rounded-lg/md → rounded-sm
  - Spacing: py-4→py-2, px-4→px-3, p-3→p-2
  - Text: text-base → text-sm
  - Removed shadow-sm, fixed ring-2→ring-1
  - All transitions use duration-100
  
- **Header.svelte** - FIXED:
  - All border-2 → single border
  - All rounded-md/full → rounded-sm
  - Fixed black border → gray-200
  - All focus:ring-2 → focus:ring-1
  - Heights: h-10 → h-9
  
- **ProfileDropdownContent.svelte** - FIXED:
  - All rounded-lg → rounded-sm
  - Spacing: p-3→p-2, py-2→py-1.5
  - Profile avatar rounded-full → rounded-sm

## Priority 2: UI Components (120 files with violations)

### Button Component
- `src/lib/components/ui/button.svelte` - Uses various rounded-* classes

### Input/Form Components
- `src/lib/components/ui/input.svelte` - Uses text-base
- `src/lib/components/ui/textarea.svelte` - Uses text-base, rounded-md
- `src/lib/components/ui/select/SelectTrigger.svelte` - Uses h-10, rounded-md
- `src/lib/components/ui/select/SelectContent.svelte` - Uses rounded-md, shadow-md

### Dialog/Modal Components
- `src/lib/components/ui/dialog/DialogContent.svelte` - Uses rounded-lg, shadow-lg (OK for modals)
- `src/lib/components/ui/dropdown-menu/DropdownMenuContent.svelte` - Uses rounded-md, shadow-md (OK for dropdowns)
- `src/lib/components/ui/sheet/SheetContent.svelte` - Uses shadow-lg (OK for sheets)

### Badge/Chip Components
- `src/lib/components/ui/BrandBadge.svelte` - Uses text-base
- `src/lib/components/ui/Chip.svelte` - Uses rounded-full
- `src/lib/components/ui/badge.svelte` - Needs review

## Priority 3: Page Components (High Traffic)

### Home Page Components
- `src/lib/components/home/HeroSearch.svelte` - Uses rounded-full, text-base
- `src/lib/components/home/QuickFilters.svelte` - Uses rounded-full, shadow-sm
- `src/lib/components/home/SellerQuickView.svelte` - Uses rounded-lg, shadow-md
- `src/lib/components/home/TopSellers.svelte` - Uses rounded-full, gap-4, p-4
- `src/lib/components/home/LandingCategories.svelte` - Uses rounded-lg, gap-6, text-lg
- `src/lib/components/home/CategoryGrid.svelte` - Uses h-12

### Browse/Category Pages
- `src/routes/(app)/browse/+page.svelte` - Uses gap-6, rounded-lg
- `src/lib/components/category/CategoryLanding.svelte` - Uses shadow-sm, text-base, gap-4
- `src/lib/components/subcategory/SubcategoryBrowse.svelte` - Uses text-lg, gap-4

### Product Detail Page
- `src/routes/(app)/listings/[id]/+page.svelte` - Uses rounded-lg, shadow-sm, text-base, gap-4, p-4

## Priority 4: Auth & Onboarding (77 files with violations)

### Auth Pages
- `src/routes/(auth)/login/+page.svelte` - Uses rounded-lg, shadow-sm, text-base
- `src/routes/(auth)/register/+page.svelte` - Uses rounded-lg, shadow-sm, text-base, p-4
- `src/routes/(auth)/forgot-password/+page.svelte` - Uses rounded-lg, shadow-md, gap-4
- `src/routes/(auth)/reset-password/+page.svelte` - Uses rounded-lg, shadow-md, gap-4

### Onboarding Components
- `src/lib/components/onboarding/ProfileSetupWizard.svelte` - Uses rounded-lg, shadow-md, gap-4
- `src/lib/components/onboarding/AvatarPicker.svelte` - Uses rounded-full, h-12, shadow-sm
- `src/lib/components/onboarding/BrandInfoForm.svelte` - Uses text-base, gap-4
- `src/lib/components/onboarding/WelcomeModal.svelte` - Uses rounded-lg, text-lg

## Priority 5: Other Components (82 files with violations)

### Profile Components
- `src/lib/components/profile/ProfileHeader.svelte` - Uses rounded-full, shadow-sm, text-base
- `src/lib/components/profile/ProfileStats.svelte` - Uses rounded-lg, shadow-sm, gap-4
- `src/lib/components/profile/SocialMediaLinks.svelte` - Uses rounded-full, shadow-sm

### Messaging Components
- `src/lib/components/messaging/MessageThread.svelte` - Uses rounded-full, p-4, gap-4
- `src/lib/components/messaging/ConversationList.svelte` - Uses rounded-full, h-12, gap-4
- `src/lib/components/messaging/MessageSearch.svelte` - Uses rounded-md, shadow-sm, text-base

### Order/Checkout Components
- `src/lib/components/checkout/CheckoutFlow.svelte` - Uses rounded-lg, h-12, p-4, gap-4
- `src/lib/components/checkout/CheckoutModal.svelte` - Uses rounded-lg, text-base, p-4
- `src/lib/components/orders/OrderList.svelte` - Uses rounded-lg, shadow-sm, h-12, gap-4
- `src/lib/components/orders/OrderDetails.svelte` - Uses rounded-lg, shadow-sm, gap-4

## 🎯 REMAINING VIOLATIONS TO FIX

### ✅ COMPLETED TODAY (2025-07-24):

### Priority 4: Badge/Chip Components ✅
- `src/lib/components/ui/BrandBadge.svelte` - FIXED: text-base → text-sm, rounded-full → rounded-sm
- `src/lib/components/ui/Chip.svelte` - FIXED: duration-fast → duration-100
- `src/lib/components/ui/badge.svelte` - FIXED: Already uses rounded-[var(--radius-sm)]

### Priority 5: Home Page Components ✅
- `src/lib/components/home/QuickFilters.svelte` - FIXED: duration-fast → duration-100, ring-2 → ring-1
- `src/lib/components/home/SellerQuickView.svelte` - FIXED: All rounded-lg/xl → rounded-sm, removed shadows
- `src/lib/components/home/TopSellers.svelte` - FIXED: rounded-full → rounded-sm, gap-4 → gap-3, p-3 → p-2
- `src/lib/components/home/LandingCategories.svelte` - FIXED: All transitions, text sizes
- `src/lib/components/home/CategoryGrid.svelte` - FIXED: duration-fast → duration-100

### Priority 6: Browse/Category Pages ✅
- `src/routes/(app)/browse/+page.svelte` - FIXED: ring-2 → ring-1, all transitions
- `src/lib/components/category/CategoryLanding.svelte` - FIXED: All spacing and text sizes
- `src/lib/components/subcategory/SubcategoryBrowse.svelte` - FIXED: text-lg → text-sm, gap-6 → gap-3

### Priority 7: Product Detail Page ✅
- `src/routes/(app)/listings/[id]/+page.svelte` - FIXED: All transitions, spacing, text sizes

### Priority 8: Auth & Onboarding
- `src/routes/(auth)/login/+page.svelte` - Uses rounded-lg, shadow-sm, text-base
- `src/routes/(auth)/register/+page.svelte` - Uses rounded-lg, shadow-sm, text-base, p-4
- `src/routes/(auth)/forgot-password/+page.svelte` - Uses rounded-lg, shadow-md, gap-4
- `src/routes/(auth)/reset-password/+page.svelte` - Uses rounded-lg, shadow-md, gap-4
- `src/lib/components/onboarding/ProfileSetupWizard.svelte` - Uses rounded-lg, shadow-md, gap-4
- `src/lib/components/onboarding/AvatarPicker.svelte` - Uses rounded-full, h-12, shadow-sm
- `src/lib/components/onboarding/BrandInfoForm.svelte` - Uses text-base, gap-4
- `src/lib/components/onboarding/WelcomeModal.svelte` - Uses rounded-lg, text-lg

### Priority 9: Other Components
- Profile components with rounded-full, shadow-sm, text-base
- Messaging components with rounded-full, p-4, gap-4
- Order/Checkout components with rounded-lg, h-12, p-4, gap-4

## Summary Statistics (Updated 2025-07-24)
- **Initially**: 120+ files with violations
- **Fixed Today**: 22 components (Priority 1-7 all completed!)
- **Remaining**: ~98 files still need updates (Auth, Profile, Messaging, Orders)
- **Progress**: ~18% complete

## Next Steps
1. Continue with Priority 4-5 (Badge/Chip and Home components)
2. Focus on high-traffic pages first
3. Update auth flows for better UX
4. Complete remaining components systematically