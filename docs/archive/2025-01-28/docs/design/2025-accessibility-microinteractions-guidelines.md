# 2025 Accessibility, Micro-Interactions & Design Token Guidelines

## Executive Summary
This document provides practical implementation guidelines for accessibility (WCAG 2.2 AAA), micro-interactions with spring physics, and design token systems for the Driplo marketplace, based on 2025 best practices.

## 1. Micro-Interaction Guidelines

### Desktop Timing & Transitions
- **Optimal Duration**: 150-250ms for most interactions
- **Fast Micro-Interactions**: 75-100ms for immediate feedback (hover states, focus)
- **Complex Animations**: 200-250ms for page transitions or multi-step animations
- **Never Exceed**: 300ms - feels sluggish beyond this threshold

### Mobile Timing
- **Optimal Duration**: 100-150ms for touch interactions
- **Touch Feedback**: Immediate haptic response where supported
- **Gesture Animations**: 150-200ms for swipe/drag interactions

### Spring Physics vs Linear Easing
Spring physics create more natural, fluid animations compared to linear transitions:

```css
/* Traditional Linear Approach */
.button {
  transition: transform 150ms linear;
}

/* Spring Physics in CSS (approximation) */
.button {
  transition: transform 150ms cubic-bezier(0.5, 1.25, 0.75, 1.25);
}
```

For Svelte, use built-in spring stores:
```javascript
import { spring } from 'svelte/motion';

const scale = spring(1, {
  stiffness: 0.15,
  damping: 0.8
});

// On interaction
scale.set(1.05);
```

### Hover States on Touch Devices
Disable hover states on touch devices to prevent "sticky" hover:

```css
/* Only apply hover on devices that support it */
@media (hover: hover) and (pointer: fine) {
  .button:hover {
    background-color: var(--color-brand-600);
    transform: translateY(-1px);
  }
}

/* Touch devices get active states instead */
@media (hover: none) and (pointer: coarse) {
  .button:active {
    background-color: var(--color-brand-600);
    transform: scale(0.98);
  }
}
```

## 2. Accessibility & Design Tokens

### Color Contrast Requirements (WCAG 2.2 AAA)
- **Small Text**: Minimum contrast ratio of 7:1
- **Large Text (18pt+)**: Minimum contrast ratio of 4.5:1
- **UI Components**: Minimum contrast ratio of 3:1

### Brand Color Scale Implementation
Using a perceptually uniform scale from brand-50 to brand-950:

```css
:root {
  /* Brand Colors - Perceptually Uniform Scale */
  --color-brand-50: #f0f9ff;   /* L: 97, against white: 1.08:1 */
  --color-brand-100: #e0f2fe;  /* L: 95, against white: 1.13:1 */
  --color-brand-200: #bae6fd;  /* L: 88, against white: 1.29:1 */
  --color-brand-300: #7dd3fc;  /* L: 78, against white: 1.68:1 */
  --color-brand-400: #38bdf8;  /* L: 68, against white: 2.31:1 */
  --color-brand-500: #87ceeb;  /* L: 78, against black: 12.5:1 */
  --color-brand-600: #6bb6d8;  /* L: 68, against black: 9.1:1 */
  --color-brand-700: #4f9fc5;  /* L: 58, against black: 6.2:1 */
  --color-brand-800: #3a88ae;  /* L: 48, against black: 4.1:1 */
  --color-brand-900: #1e5a7e;  /* L: 35, against white: 8.2:1 */
  --color-brand-950: #0d3451;  /* L: 20, against white: 15.3:1 */
}
```

### Magic Number System
For guaranteed contrast, use a difference of at least:
- **50 grades**: AA compliance (4.5:1)
- **70 grades**: AAA compliance (7:1)

Example:
- brand-100 on brand-600 background = 50 grade difference ✓
- brand-50 on brand-900 background = 85 grade difference ✓

### Touch Target Requirements
WCAG 2.2 AAA requires 44×44px minimum touch targets:

```css
/* Tailwind mapping */
.touch-target {
  @apply min-h-11 min-w-11; /* 44px × 44px */
}

/* For smaller visual elements, expand touch area invisibly */
.small-button {
  position: relative;
  padding: 0.5rem 1rem; /* Visual size */
}

.small-button::after {
  content: '';
  position: absolute;
  inset: -0.25rem; /* Expand touch area */
  min-width: 44px;
  min-height: 44px;
}
```

### Keyboard Focus Rings
Implement visible, high-contrast focus indicators:

```css
/* Modern focus-visible approach */
.interactive-element:focus-visible {
  outline: none;
  ring: 2px solid var(--color-brand-500);
  ring-offset: 2px;
  ring-offset-color: var(--color-bg-primary);
}

/* Tailwind utilities */
.focus-ring {
  @apply focus-visible:ring-2 
         focus-visible:ring-brand-500 
         focus-visible:ring-offset-2
         focus-visible:outline-none;
}
```

## 3. Visual Regression & QA

### Chromatic Setup for 2025
Configure visual regression testing with key viewports:

```javascript
// .storybook/preview.js
export const parameters = {
  chromatic: {
    viewports: [360, 768, 1440], // Mobile, Tablet, Desktop
    delay: 300, // Wait for animations
    diffThreshold: 0.2, // Sensitivity
    animationMode: 'disabled' // For consistent snapshots
  }
};
```

### Automated Accessibility Testing with axe-core

```javascript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts']
  }
});

// src/test/setup.ts
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Example test
import { render } from '@testing-library/svelte';
import { axe } from 'jest-axe';
import Button from '$lib/components/ui/Button.svelte';

test('Button is accessible', async () => {
  const { container } = render(Button, { 
    props: { children: 'Click me' } 
  });
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Token Diffing Scripts
Monitor design token changes between releases:

```javascript
// scripts/token-diff.js
import { readFileSync } from 'fs';
import { diffLines } from 'diff';

const oldTokens = readFileSync('./tokens.old.css', 'utf8');
const newTokens = readFileSync('./src/lib/styles/tokens.css', 'utf8');

const diff = diffLines(oldTokens, newTokens);

diff.forEach((part) => {
  if (part.added || part.removed) {
    console.log(part.added ? '+ ' : '- ', part.value);
  }
});
```

## 4. Practical Implementation Examples

### Accessible Button Component
```svelte
<!-- Button.svelte -->
<script lang="ts">
  import { spring } from 'svelte/motion';
  
  export let variant: 'primary' | 'secondary' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  
  const scale = spring(1, { stiffness: 0.15, damping: 0.8 });
  
  function handleMouseDown() {
    scale.set(0.98);
  }
  
  function handleMouseUp() {
    scale.set(1);
  }
</script>

<button
  class="button {variant} {size}"
  style:transform="scale({$scale})"
  onmousedown={handleMouseDown}
  onmouseup={handleMouseUp}
  on:click
  {...$$restProps}
>
  <slot />
</button>

<style>
  .button {
    /* Base styles */
    position: relative;
    font-family: var(--font-sans);
    font-weight: var(--font-medium);
    border-radius: var(--radius-md);
    transition: all var(--duration-base) var(--ease-out);
    
    /* Ensure minimum touch target */
    min-height: var(--button-height-md);
    padding: 0 var(--space-4);
    
    /* Focus styles */
    @apply focus-visible:ring-2 
           focus-visible:ring-brand-500 
           focus-visible:ring-offset-2
           focus-visible:outline-none;
  }
  
  /* Size variants */
  .sm {
    min-height: var(--button-height-sm);
    font-size: var(--text-sm);
    padding: 0 var(--space-3);
  }
  
  .lg {
    min-height: var(--button-height-lg);
    font-size: var(--text-md);
    padding: 0 var(--space-5);
  }
  
  /* Ensure 44px touch target on mobile */
  @media (hover: none) and (pointer: coarse) {
    .button::after {
      content: '';
      position: absolute;
      inset: 0;
      min-width: 44px;
      min-height: 44px;
      transform: translate(-50%, -50%);
      left: 50%;
      top: 50%;
    }
  }
  
  /* Hover only on capable devices */
  @media (hover: hover) and (pointer: fine) {
    .button:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
    
    .primary:hover {
      background-color: var(--color-brand-600);
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .button {
      transition: none;
    }
  }
</style>
```

### Accessible Modal with Focus Trap
```svelte
<!-- Modal.svelte -->
<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { trapFocus } from '$lib/utils/focus-trap';
  
  export let open = false;
  
  let modalElement: HTMLElement;
  
  $: if (open && modalElement) {
    modalElement.focus();
  }
</script>

{#if open}
  <div 
    class="modal-backdrop" 
    transition:fade={{ duration: 150 }}
    on:click|self={() => open = false}
  >
    <div
      bind:this={modalElement}
      class="modal-content"
      transition:scale={{ duration: 200, start: 0.95 }}
      use:trapFocus
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <slot />
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal-backdrop);
  }
  
  .modal-content {
    background: var(--color-surface-primary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-modal);
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
    padding: var(--space-6);
    z-index: var(--z-modal);
    
    @apply focus-visible:ring-2 
           focus-visible:ring-brand-500 
           focus-visible:ring-offset-2
           focus-visible:outline-none;
  }
  
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .modal-backdrop,
    .modal-content {
      animation: none !important;
      transition: none !important;
    }
  }
</style>
```

## 5. Testing Strategies

### Manual Testing Checklist
1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Verify focus order matches visual layout
   - Test Enter/Space activation
   - Ensure Escape closes modals/dropdowns

2. **Screen Reader Testing**
   - Test with NVDA (Windows) or VoiceOver (Mac)
   - Verify all content is announced properly
   - Check ARIA labels and descriptions

3. **Color Contrast**
   - Use Chrome DevTools or axe DevTools
   - Test all text/background combinations
   - Verify in both light and dark modes

4. **Touch Targets**
   - Use device emulation at 360px width
   - Verify 44×44px minimum tap areas
   - Test with touch events, not mouse

5. **Motion Preferences**
   - Enable `prefers-reduced-motion`
   - Verify animations are disabled/reduced
   - Check that functionality remains intact

### Automated Testing Pipeline
```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm run build
      
      # Run axe-core tests
      - run: pnpm test:a11y
      
      # Visual regression with Chromatic
      - uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          exitOnceUploaded: true
          onlyChanged: true
```

## 6. 2025 Compliance Notes

### European Accessibility Act (EAA)
- **Enforcement Date**: June 28, 2025
- **Requirement**: All new/updated features must meet WCAG 2.2 AA
- **Legacy Code**: Unchanged components exempt until 2030

### Recommended Approach
1. Focus on AA compliance (legally required)
2. Implement AAA where practical (touch targets, contrast)
3. Use Chromatic's accessibility regression testing
4. Document accessibility decisions in component stories

### Key Resources
- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [A11y Project Checklist](https://a11yproject.com/checklist)
- [Chromatic Accessibility Tests](https://www.chromatic.com/docs/accessibility/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)

## Implementation Priority
1. **Immediate**: Update touch targets to 44×44px
2. **High**: Implement proper focus indicators
3. **High**: Add `prefers-reduced-motion` support
4. **Medium**: Migrate to spring-based animations
5. **Medium**: Set up visual regression testing
6. **Low**: Achieve AAA color contrast (nice-to-have)