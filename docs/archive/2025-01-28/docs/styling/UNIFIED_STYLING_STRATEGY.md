# Unified Styling Strategy - Tailwind Best Practices

## Core Principles

### 1. **Single Source of Truth**
- ALL design tokens in `app.css` as CSS variables
- NO hardcoded colors anywhere
- NO duplicate token definitions

### 2. **Utility-First Approach**
- Use Tailwind utilities directly in markup
- NO @apply directives
- NO custom CSS classes unless absolutely necessary

### 3. **Dynamic Styling**
- Use data attributes + CSS for dynamic styles
- Inline styles ONLY for truly dynamic values (width %, transform)
- CSS variables for theme switching

## Implementation Plan

### Phase 1: Clean app.css
```css
/* app.css - ONLY these sections */
@import 'tailwindcss';

/* Font imports - optimize to only needed weights */
@import '@fontsource/inter/400.css';
@import '@fontsource/inter/500.css';
@import '@fontsource/inter/600.css';

:root {
  /* Primary palette */
  --color-primary: 197 71% 73%; /* #87ceeb in HSL */
  
  /* Neutral palette */
  --color-neutral-50: 0 0% 98%;
  --color-neutral-100: 0 0% 96%;
  /* ... etc */
  
  /* Semantic colors */
  --color-success: 142 71% 45%;
  --color-warning: 38 92% 50%;
  --color-error: 0 84% 60%;
  
  /* Spacing scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  /* ... etc */
  
  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
}

/* Dark mode overrides */
.dark {
  /* Only color overrides here */
}

/* Base styles - minimal */
@layer base {
  body {
    @apply antialiased;
  }
}
```

### Phase 2: Update tailwind.config.js
```js
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Reference CSS variables
        primary: 'hsl(var(--color-primary) / <alpha-value>)',
        success: 'hsl(var(--color-success) / <alpha-value>)',
        warning: 'hsl(var(--color-warning) / <alpha-value>)',
        error: 'hsl(var(--color-error) / <alpha-value>)',
      }
    }
  }
}
```

### Phase 3: Component Updates

#### ❌ Bad (Current)
```svelte
<style>
  .notification {
    @apply bg-background border rounded-lg shadow-lg p-4;
  }
</style>
<div class="notification">
```

#### ✅ Good (Target)
```svelte
<div class="bg-background border rounded-lg shadow-lg p-4">
```

#### ❌ Bad (Current)
```svelte
<div style="background-color: #87ceeb">
```

#### ✅ Good (Target)
```svelte
<div class="bg-primary">
```

### Phase 4: Dynamic Styles

#### ❌ Bad
```svelte
<div style="width: {progress}%; background-color: {color};">
```

#### ✅ Good
```svelte
<div 
  class="bg-primary"
  style="width: {progress}%"
>
```

Or better with CSS variables:
```svelte
<div 
  class="progress-bar"
  style="--progress: {progress}%"
>

<style>
  .progress-bar {
    width: var(--progress);
  }
</style>
```

## Files to Update

### Priority 1 - Critical
1. `app.css` - Complete rewrite
2. `NotificationPopup.svelte` - Remove all @apply
3. `ProgressIndicator.svelte` - Remove all @apply
4. All components with hardcoded colors

### Priority 2 - Important
1. Remove Storybook CSS files
2. Update components with inline styles
3. Remove custom utility classes

### Priority 3 - Nice to have
1. Optimize font imports
2. Clean up :global() usage
3. Convert remaining inline styles

## Validation Checklist

- [ ] No @apply directives anywhere
- [ ] No hardcoded colors (only Tailwind classes)
- [ ] Single set of design tokens in app.css
- [ ] All colors use CSS variables
- [ ] Tailwind config references CSS variables
- [ ] No duplicate utility definitions
- [ ] Inline styles only for dynamic values
- [ ] Bundle size reduced

## Benefits

1. **Performance**: Smaller CSS bundle
2. **Maintainability**: Single source of truth
3. **Developer Experience**: Clear patterns
4. **Consistency**: Uniform styling approach
5. **Scalability**: Easy to add new tokens