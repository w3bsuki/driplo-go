# Design System Fix Report for driplo.bg-main

## Executive Summary

This report identifies critical design system issues in the driplo.bg codebase that need immediate attention. The audit found:

- **41 inline styles** across 27 files undermining the design system
- **Mixed UI component library** usage (custom + bits-ui)
- **Only 143 accessibility attributes** across the entire codebase
- **Component architecture issues** with mixed concerns and responsibilities
- **Inconsistent styling patterns** between custom components and bits-ui

## 1. Custom Components That Should Use bits-ui

### Priority 1: Replace with Direct bits-ui Equivalents

| Custom Component | bits-ui Replacement | Reason |
|-----------------|-------------------|---------|
| `src/lib/components/ui/button.svelte` | `bits-ui/button` | Has inline height styles, custom implementation |
| `src/lib/components/ui/RatingStars.svelte` | `bits-ui/rating-group` | Has inline width styles, custom implementation |
| `src/lib/components/ui/switch.svelte` | `bits-ui/switch` | Redundant custom implementation |
| `src/lib/components/ui/RadioGroup.svelte` | `bits-ui/radio-group` | Already using bits-ui partially |
| `src/lib/components/ui/ColorPicker.svelte` | Custom needed | No direct bits-ui equivalent, but has inline styles |
| `src/lib/components/ui/PasswordStrength.svelte` | `bits-ui/progress` + custom logic | Has inline width styles |

### Priority 2: Components with Mixed Implementation

| Component | Issue | Fix Required |
|-----------|-------|--------------|
| `src/lib/components/ui/input.svelte` | Inline height styles | Remove style attribute, use CSS classes |
| `src/lib/components/ui/textarea.svelte` | Inline min-height calculation | Move to CSS custom properties |
| `src/lib/components/ui/select/SelectTrigger.svelte` | Inline height styles | Use consistent sizing classes |

## 2. Files with Inline Styles

### Critical Files (Multiple Inline Styles)

#### 1. **Header.svelte** - 6 instances
```svelte
// Current (BAD):
style="height: 36px; width: 36px;"
style="height: var(--button-height-lg); width: var(--button-height-lg);"

// Should be:
class="size-9"  // For 36px
class="size-button-lg"  // For button height
```

#### 2. **ListingGrid.svelte** - 2 instances
```svelte
// Current (BAD):
style="grid-template-columns: repeat({columns}, minmax(0, 1fr));"

// Should be:
class="grid"
style:--grid-cols={columns}
// Then in CSS: grid-template-columns: repeat(var(--grid-cols), minmax(0, 1fr));
```

#### 3. **ColorPicker.svelte** - 2 instances
```svelte
// Current (BAD):
style={color.value !== 'multi' ? `background-color: ${color.value}` : 'background: linear-gradient(...)'}

// Should be:
class="color-swatch"
style:--swatch-color={color.value}
// Use CSS custom properties with fallback
```

### Progress Bar Patterns (8 files)

These files all use inline width for progress bars:
- `BrandOnboardingWizard.svelte`: `style="width: {(currentStep / totalSteps) * 100}%"`
- `ProfileHeader.svelte`: `style="width: {completionScore}%"`
- `PasswordStrength.svelte`: `style="width: {strengthPercentage}%"`
- `ProfileStats.svelte`: `style="width: {metrics.completion_rate}%"`
- `CreateListingForm.svelte`: `style="width: {(formStore.currentStep / formStore.totalSteps) * 100}%"`
- `ImageUploader.svelte`: `style="width: {file.progress}%"`
- `MediaUploadStep.svelte`: `style="width: {progress.percentage}%"`
- `ProgressIndicator.svelte`: `style="width: {onboarding.progress.percentage}%"`

**Standardized Solution:**
```svelte
<!-- Create a reusable ProgressBar component -->
<script>
  export let value = 0;
  export let max = 100;
  $: percentage = (value / max) * 100;
</script>

<div class="progress-bar">
  <div class="progress-bar-fill" style:--progress="{percentage}%"></div>
</div>

<style>
  .progress-bar-fill {
    width: var(--progress);
  }
</style>
```

### Complete List of Files with Inline Styles

1. `src/lib/components/brands/BrandOnboardingWizard.svelte` - Line 295
2. `src/lib/components/checkout/CheckoutFlow.svelte` - Line 314
3. `src/lib/components/category/CategoryLanding.svelte` - Line 361
4. `src/routes/+layout.svelte` - Line 195
5. `src/lib/components/home/LandingCategories.svelte` - Line 90
6. `src/lib/components/listings/ListingGrid.svelte` - Lines 153, 178
7. `src/routes/(app)/brands/analytics/+page.svelte` - Line 314
8. `src/lib/components/layout/Header.svelte` - Lines 101, 126, 136, 164, 172, 176, 180, 201, 211
9. `src/lib/components/onboarding/ProgressIndicator.svelte` - Line 54
10. `src/lib/components/listings/ListingCard.svelte` - Line 191
11. `src/lib/components/onboarding/ProfileSetupWizard.svelte` - Line 319
12. `src/lib/components/listings/CreateListingForm/CreateListingForm.svelte` - Line 317
13. `src/lib/components/profile/ProfileHeader.svelte` - Line 251
14. `src/lib/components/ui/input.svelte` - Line 71
15. `src/lib/components/search/StickySearchBar.svelte` - Line 105
16. `src/lib/components/listings/CreateListingForm/components/ImageUploader.svelte` - Line 394
17. `src/lib/components/profile/ProfileStats.svelte` - Lines 160, 174
18. `src/lib/components/ui/textarea.svelte` - Line 19
19. `src/lib/components/shared/PriceRangeSlider.svelte` - Lines 62, 75, 88, 98, 108
20. `src/lib/components/ui/Confetti.svelte` - Line 97
21. `src/lib/components/ui/DriploLogo.svelte` - Line 48
22. `src/lib/components/ui/button.svelte` - Line 57
23. `src/lib/components/ui/PasswordStrength.svelte` - Line 65
24. `src/lib/components/ui/ColorPicker.svelte` - Line 70
25. `src/lib/components/ui/RatingStars.svelte` - Line 107
26. `src/lib/components/listings/CreateListingForm/steps/MediaUploadStep.svelte` - Line 140
27. `src/lib/components/ui/select/SelectTrigger.svelte` - Line 27

## 3. Component Structure Issues

### Components with Mixed Concerns

1. **ListingCard.svelte**
   - Handles UI presentation
   - Contains wishlist logic
   - Has inline styles
   - **Fix**: Extract wishlist logic to a hook/store

2. **Header.svelte**
   - Navigation logic
   - User state management
   - Search functionality
   - Multiple inline styles
   - **Fix**: Split into smaller components (HeaderNav, HeaderSearch, HeaderUser)

3. **CheckoutFlow.svelte**
   - Form handling
   - Payment processing
   - UI presentation
   - Inline max-height calculation
   - **Fix**: Separate concerns into CheckoutForm, PaymentProcessor, CheckoutUI

4. **ColorPicker.svelte**
   - Color data
   - UI rendering
   - Style calculations
   - **Fix**: Extract color data to constants, use CSS for styling

## 4. Accessibility Gaps

### Critical Components Lacking ARIA

1. **Forms without proper labels/descriptions**
   - CreateListingForm components
   - CheckoutFlow forms
   - Profile setup forms

2. **Interactive elements without roles**
   - Custom dropdown implementations
   - Modal/dialog components
   - Tab components

3. **Missing live regions**
   - Loading states
   - Form validation messages
   - Progress indicators

### Recommended ARIA Additions

```svelte
<!-- Loading States -->
<div role="status" aria-live="polite" aria-label="Loading content">
  <Spinner />
  <span class="sr-only">Loading...</span>
</div>

<!-- Form Validation -->
<input 
  aria-invalid={hasError}
  aria-describedby="error-message"
  aria-required="true"
/>
<div id="error-message" role="alert">{errorMessage}</div>

<!-- Progress Indicators -->
<div 
  role="progressbar" 
  aria-valuenow={currentStep} 
  aria-valuemin="1" 
  aria-valuemax={totalSteps}
  aria-label="Form progress"
>
```

## 5. Priority Fix Order

### Phase 1: Critical Infrastructure (Week 1)
1. Replace custom button.svelte with bits-ui/button
2. Create standardized ProgressBar component
3. Remove all inline height/width styles from Header.svelte
4. Implement CSS custom properties for dynamic values

### Phase 2: Component Standardization (Week 2)
1. Replace RatingStars with bits-ui/rating-group
2. Standardize all form inputs (remove inline styles)
3. Create reusable GridLayout component for ListingGrid
4. Extract mixed concerns from ListingCard and CheckoutFlow

### Phase 3: Accessibility Enhancement (Week 3)
1. Add ARIA labels to all interactive elements
2. Implement proper form validation announcements
3. Add keyboard navigation to custom components
4. Ensure all images have proper alt text

### Phase 4: Final Polish (Week 4)
1. Remove remaining inline styles
2. Ensure consistent spacing using design tokens
3. Validate all components against WCAG 2.1 AA
4. Document component usage patterns

## Implementation Guidelines

### CSS Custom Properties Pattern
```css
/* tokens.css */
:root {
  --progress-height: 0.5rem;
  --progress-bg: var(--color-gray-200);
  --progress-fill: var(--color-brand-500);
}

/* component.css */
.progress-bar {
  height: var(--progress-height);
  background: var(--progress-bg);
}

.progress-bar-fill {
  background: var(--progress-fill);
  width: var(--progress, 0%);
}
```

### Dynamic Styling Pattern
```svelte
<!-- Instead of inline styles -->
<div style="width: {value}%">

<!-- Use CSS custom properties -->
<div class="dynamic-width" style:--width="{value}%">

<style>
  .dynamic-width {
    width: var(--width);
  }
</style>
```

### Accessibility Pattern
```svelte
<script>
  import { announceToScreenReader } from '$lib/utils/a11y';
  
  $: if (loading) announceToScreenReader('Loading content');
  $: if (error) announceToScreenReader(`Error: ${error.message}`);
</script>
```

## Success Metrics

- Zero inline style attributes
- 100% bits-ui adoption for supported components
- 500+ accessibility attributes (3.5x current)
- All components pass automated accessibility tests
- Consistent visual appearance across all breakpoints
- Improved build performance from reduced style calculations

## Tools and Resources

1. **ESLint Rules**: Configure to catch inline styles
2. **Stylelint**: Enforce CSS custom property usage
3. **axe-core**: Automated accessibility testing
4. **Storybook**: Component documentation and testing
5. **CSS Stats**: Monitor CSS complexity

This report provides a clear roadmap to transform the design system from its current fragmented state to a consistent, accessible, and maintainable architecture.