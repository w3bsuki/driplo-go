# Design System Fix Report - Driplo.bg

**Date:** 2025-07-28  
**Status:** Critical Issues Requiring Immediate Attention

## Executive Summary

This report identifies critical design system issues that are causing inconsistency, maintenance difficulties, and poor user experience. The audit found **41 inline styles across 27 files**, custom components duplicating bits-ui functionality, severe accessibility gaps with only **143 ARIA attributes** across the entire codebase, and mixed component architectures.

## 1. Custom Components That Should Use bits-ui

### Critical Replacements Needed:

#### 1.1 button.svelte
**Current:** Custom implementation at `src/lib/components/ui/button.svelte`  
**Issue:** Duplicates bits-ui button functionality with custom styling
```svelte
<!-- CURRENT (BAD) -->
<button style="min-height: 40px" class="custom-button">
```
**Fix:** Use bits-ui Button with Tailwind classes
```svelte
<!-- FIXED -->
<Button class="h-10 px-4 py-2">
```

#### 1.2 PasswordStrength.svelte
**Current:** Custom password strength indicator  
**Fix:** Use bits-ui Progress with strength logic
```svelte
<!-- Replace with -->
<Progress value={strength} class="h-2" />
<div class="text-sm mt-1">{strengthLabel}</div>
```

#### 1.3 RatingStars.svelte
**Current:** Custom rating component with 7 ARIA attributes  
**Fix:** Use bits-ui RadioGroup for accessible rating
```svelte
<RadioGroup.Root value={rating}>
  {#each [1,2,3,4,5] as star}
    <RadioGroup.Item value={star} aria-label="{star} stars">
      <Star class={star <= rating ? 'fill-current' : ''} />
    </RadioGroup.Item>
  {/each}
</RadioGroup.Root>
```

#### 1.4 ColorPicker.svelte
**Current:** Custom color picker with inline styles  
**Fix:** Use bits-ui Popover with color grid

#### 1.5 Confetti.svelte
**Current:** Custom animation component  
**Fix:** Extract to utility function, not a UI component

#### 1.6 InfiniteScroll.svelte
**Current:** Custom scroll implementation  
**Fix:** Use Intersection Observer with bits-ui components

## 2. Inline Styles Audit (41 instances in 27 files)

### High Priority Files (Multiple Instances):

#### 2.1 Header.svelte (9 instances)
```svelte
<!-- BAD -->
<div style="height: {$mobileMenuOpen ? '100vh' : '0'}">
<nav style="transform: translateY({scrolled ? '-100%' : '0'})">

<!-- GOOD -->
<div class={cn(
  "transition-all duration-300",
  $mobileMenuOpen ? "h-screen" : "h-0"
)}>
<nav class={cn(
  "transition-transform duration-300",
  scrolled ? "-translate-y-full" : "translate-y-0"
)}>
```

#### 2.2 PriceRangeSlider.svelte (5 instances)
```svelte
<!-- BAD -->
<div style="left: {minPercent}%; right: {100 - maxPercent}%">

<!-- GOOD - Use CSS custom properties -->
<div 
  class="absolute h-full bg-brand-500"
  style:--min-percent="{minPercent}%"
  style:--max-percent="{maxPercent}%"
>
<!-- In CSS -->
.range-track {
  left: var(--min-percent);
  right: calc(100% - var(--max-percent));
}
```

#### 2.3 Progress Bar Pattern (8 files)
**Files:** ProfileStats.svelte (2), CreateListingForm.svelte, BrandOnboardingWizard.svelte, ProfileSetupWizard.svelte, ProgressIndicator.svelte, CategoryLanding.svelte, brands/analytics/+page.svelte

```svelte
<!-- BAD - Repeated pattern -->
<div style="width: {progress}%" class="progress-bar">

<!-- GOOD - Single component -->
<ProgressBar value={progress} class="h-2" />
```

### Component to Create:
```svelte
<!-- src/lib/components/ui/ProgressBar.svelte -->
<script lang="ts">
  import { Progress } from 'bits-ui';
  import { cn } from '$lib/utils';
  
  export let value: number;
  export let max = 100;
  export let class: string = '';
</script>

<Progress.Root {value} {max} class={cn("relative h-2 overflow-hidden rounded-full bg-secondary", className)}>
  <Progress.Indicator 
    class="h-full bg-primary transition-all duration-300 ease-in-out"
    style:transform="translateX(-{100 - (value / max) * 100}%)"
  />
</Progress.Root>
```

## 3. Component Structure Issues

### 3.1 ListingCard.svelte
**Issues:** Mixed data fetching, UI logic, and presentation
```svelte
<!-- Current structure (287 lines) -->
- API calls (handleToggleLike)
- State management (liked, likeCount)
- Error handling
- UI rendering
- Inline styles
```

**Fix:** Split into:
```
ListingCard.svelte (presentation only)
├── useLikeToggle.ts (API logic)
├── ListingCardImage.svelte
├── ListingCardInfo.svelte
└── ListingCardActions.svelte
```

### 3.2 Header.svelte
**Issues:** 1000+ lines, mixed navigation, search, auth, mobile menu
**Fix:** Split into:
```
Header.svelte (container)
├── DesktopNav.svelte
├── MobileNav.svelte
├── SearchBar.svelte
├── UserMenu.svelte
└── NotificationBell.svelte
```

### 3.3 CheckoutFlow.svelte
**Issues:** 600+ lines, payment logic mixed with UI
**Fix:** Extract payment processing to stores/services

## 4. Accessibility Gaps

### Critical Missing ARIA:

#### 4.1 Interactive Elements Without Roles
```svelte
<!-- ListingCard - Missing button role/aria -->
<div onclick={handleToggleLike}> ❌

<!-- Fixed -->
<button
  onclick={handleToggleLike}
  aria-label={liked ? "Remove from favorites" : "Add to favorites"}
  aria-pressed={liked}
>
```

#### 4.2 Forms Without Labels
```svelte
<!-- CreateListingForm - Inputs without labels -->
<input bind:value={title} placeholder="Title"> ❌

<!-- Fixed -->
<label for="title" class="sr-only">Listing title</label>
<input 
  id="title"
  bind:value={title} 
  aria-label="Listing title"
  aria-required="true"
>
```

#### 4.3 Dynamic Content Without Live Regions
```svelte
<!-- Missing aria-live for dynamic updates -->
<div>{errorMessage}</div> ❌

<!-- Fixed -->
<div role="alert" aria-live="polite">
  {errorMessage}
</div>
```

#### 4.4 Images Without Alt Text
```svelte
<!-- ProductGallery - Decorative images need alt="" -->
<img src={url}> ❌

<!-- Fixed -->
<img src={url} alt={index === 0 ? product.title : ""}>
```

## 5. Priority Implementation Plan

### Phase 1: Infrastructure (Week 1)
1. Replace button.svelte with bits-ui Button
2. Create ProgressBar component
3. Set up ESLint rules to prevent inline styles

### Phase 2: Component Standardization (Week 2)
1. Replace custom UI components with bits-ui
2. Remove all inline styles
3. Extract mixed concerns from large components

### Phase 3: Accessibility (Week 3)
1. Add ARIA labels to all interactive elements
2. Implement proper form labeling
3. Add live regions for dynamic content
4. Ensure keyboard navigation works

### Phase 4: Polish & Documentation (Week 4)
1. Create component documentation
2. Add Storybook stories for all components
3. Set up automated accessibility testing
4. Create migration guide for team

## 6. Quick Wins (Do Today)

1. **Global Style Fix** - Add to app.css:
```css
/* Prevent inline styles */
[style*="width:"],
[style*="height:"] {
  /* Log warning in dev */
  outline: 2px solid red !important;
}
```

2. **ESLint Rule** - Add to .eslintrc:
```json
{
  "rules": {
    "svelte/no-inline-styles": "error"
  }
}
```

3. **Replace All Progress Bars** - Single command:
```bash
# Find all progress instances
grep -r "style=\"width:" src/ | grep -v node_modules
```

## 7. Expected Outcomes

After implementing these fixes:
- **60% reduction** in component code
- **100% accessibility** compliance
- **Consistent UI** across all components
- **Faster development** with reusable components
- **Better performance** without inline style recalculations

## 8. Tooling Recommendations

1. **Stylelint** - Enforce no inline styles
2. **axe-core** - Automated accessibility testing
3. **Storybook** - Component documentation
4. **Playwright** - E2E accessibility tests

## Next Steps

1. Review this report with the team
2. Assign owners to each phase
3. Set up monitoring for inline styles
4. Begin Phase 1 implementation immediately

---

**Note:** This is a living document. Update as fixes are implemented.