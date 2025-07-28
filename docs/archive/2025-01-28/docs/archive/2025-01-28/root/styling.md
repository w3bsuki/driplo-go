# 🎨 Driplo Styling Guide - 2025 Standards

This document outlines the comprehensive styling standards for Driplo based on 2025 best practices, including Tailwind CSS v4, ShadCN/ui v2.0+, and modern accessibility guidelines.

## 🚀 Quick Start

### Setup Requirements
- **Tailwind CSS v4** with @tailwindcss/vite plugin
- **SvelteKit 2.0+** with vitePreprocess()
- **ShadCN/ui v2.0+** with Svelte bindings

### Installation
```bash
pnpm install tailwindcss@next @tailwindcss/vite@next
```

---

## 📐 Design System Foundation

### Color System (OKLCH)
We use modern OKLCH color space for perceptually uniform scaling:

```css
:root {
  /* Brand Colors */
  --color-brand-50: oklch(97% 0.01 263);
  --color-brand-100: oklch(95% 0.02 263);
  --color-brand-500: oklch(70% 0.20 263);
  --color-brand-900: oklch(35% 0.15 263);
  --color-brand-950: oklch(20% 0.10 263);
  
  /* Semantic Colors */
  --color-success: oklch(65% 0.15 142);
  --color-warning: oklch(75% 0.15 65);
  --color-error: oklch(60% 0.20 25);
}
```

### Typography Scale
```css
:root {
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px - minimum for body text */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px - large text threshold */
  --text-xl: 1.25rem;    /* 20px */
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Spacing Scale
```css
:root {
  --space-px: 1px;
  --space-0-5: 0.125rem;  /* 2px */
  --space-1: 0.25rem;     /* 4px */
  --space-2: 0.5rem;      /* 8px */
  --space-3: 0.75rem;     /* 12px */
  --space-4: 1rem;        /* 16px */
  --space-6: 1.5rem;      /* 24px */
  --space-8: 2rem;        /* 32px */
  --space-12: 3rem;       /* 48px */
}
```

---

## 🏗️ Architecture

### File Structure
```
src/lib/
├── components/
│   ├── ui/              # ShadCN components
│   │   ├── button.svelte
│   │   ├── input.svelte
│   │   └── card.svelte
│   └── features/        # App components
│       ├── checkout/
│       ├── listings/
│       └── messaging/
├── styles/
│   ├── app.css         # Global styles & Tailwind import
│   ├── tokens.css      # Design tokens
│   └── themes/
│       ├── light.json
│       └── dark.json
└── utils/
    ├── cn.ts          # Class utility
    └── motion.ts      # Animation configs
```

### app.css Structure
```css
/* Import Tailwind v4 */
@import "tailwindcss";

/* Design Tokens */
@import "./tokens.css";

@layer base {
  :root {
    /* Base color scheme */
    --background: oklch(98% 0.002 247);
    --foreground: oklch(4% 0.004 247);
  }
  
  .dark {
    --background: oklch(4% 0.004 247);
    --foreground: oklch(98% 0.002 247);
  }
  
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
  }
}

@layer components {
  /* Only for repeated micro-layouts */
  .btn-base {
    @apply inline-flex items-center justify-center rounded-sm
           font-medium transition-colors duration-150
           focus-visible:ring-2 focus-visible:ring-offset-2
           focus-visible:outline-none;
  }
}
```

---

## 🎯 Component Standards

### Button Component Example
```svelte
<!-- Button.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils/cn';
  import { spring } from 'svelte/motion';
  
  export let variant: 'primary' | 'secondary' | 'ghost' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  
  const scale = spring(1, { stiffness: 0.15, damping: 0.8 });
  
  const variants = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    ghost: 'hover:bg-gray-100 text-gray-900'
  };
  
  const sizes = {
    sm: 'h-8 px-3 text-sm min-w-8',       /* 32px height */
    md: 'h-9 px-4 text-sm min-w-9',       /* 36px height */
    lg: 'h-11 px-6 text-base min-w-11'    /* 44px height - AAA compliant */
  };
  
  function handlePress() {
    scale.set(0.98);
    setTimeout(() => scale.set(1), 100);
  }
</script>

<button
  class={cn(
    'btn-base',
    variants[variant],
    sizes[size],
    $$props.class
  )}
  style:transform="scale({$scale})"
  onmousedown={handlePress}
  ontouchstart={handlePress}
  {...$$restProps}
>
  <slot />
</button>

<style>
  /* Hover only on capable devices */
  @media (hover: hover) and (pointer: fine) {
    button:hover {
      transform: translateY(-1px);
    }
  }
  
  /* Touch feedback */
  @media (hover: none) and (pointer: coarse) {
    button:active {
      transform: scale(0.98);
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    button {
      transition: none !important;
    }
  }
</style>
```

### Class Utility (cn.ts)
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## ⚡ Performance Guidelines

### Tailwind CSS v4 Optimization
- **Use @tailwindcss/vite plugin** instead of PostCSS
- **No @apply in component styles** - use global CSS only
- **Container queries are native** - no plugin needed
- **Automatic content detection** - no configuration required

### Animation Performance
```css
/* Prefer transform over position changes */
.good-animation {
  transform: translateY(-2px);
  transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Avoid layout-triggering properties */
.avoid-animation {
  top: -2px; /* Triggers layout */
  transition: top 150ms ease;
}
```

### Bundle Size Optimization
- **CSS size**: Target 8-15KB production (Tailwind v4 optimized)
- **Purge unused**: Automatic with Oxide engine
- **Code splitting**: Enable `cssCodeSplit: true` in Vite

---

## ♿ Accessibility Standards

### WCAG 2.2 AAA Compliance
```css
/* Color Contrast Requirements */
:root {
  /* 7:1 contrast for small text */
  --text-on-light: oklch(20% 0.01 263);    /* Against white: 15.3:1 */
  --text-on-dark: oklch(95% 0.01 263);     /* Against black: 18.1:1 */
  
  /* 4.5:1 contrast for large text (18pt+) */
  --text-large-secondary: oklch(45% 0.05 263);  /* Against white: 6.2:1 */
}
```

### Touch Targets
```css
/* Minimum 44×44px touch targets */
.touch-compliant {
  @apply min-h-11 min-w-11; /* 44px × 44px */
}

/* Expand small elements invisibly */
.small-interactive {
  position: relative;
}

.small-interactive::after {
  content: '';
  position: absolute;
  inset: -0.25rem;
  min-width: 44px;
  min-height: 44px;
}
```

### Focus Indicators
```css
/* Modern focus-visible approach */
.focus-ring {
  @apply focus-visible:ring-2 
         focus-visible:ring-brand-500 
         focus-visible:ring-offset-2
         focus-visible:outline-none;
}
```

### Motion Preferences
```css
/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🎭 Animation Guidelines

### Timing Standards
- **Desktop interactions**: 150-250ms (never exceed 300ms)
- **Mobile interactions**: 100-150ms
- **Complex animations**: 200-250ms max
- **Micro-feedback**: 75-100ms

### Spring Physics
```javascript
// Svelte spring configuration
const buttonScale = spring(1, {
  stiffness: 0.15,  // Bounce intensity
  damping: 0.8      // How quickly it settles
});

// CSS approximation
.spring-like {
  transition: transform 150ms cubic-bezier(0.5, 1.25, 0.75, 1.25);
}
```

### Easing Functions
```css
:root {
  /* Standard easings */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Spring-like */
  --ease-spring: cubic-bezier(0.5, 1.25, 0.75, 1.25);
  
  /* Durations */
  --duration-fast: 75ms;
  --duration-base: 150ms;
  --duration-slow: 250ms;
}
```

---

## 🌙 Dark Mode Implementation

### CSS Strategy
```css
/* Use class-based dark mode */
.dark {
  --background: oklch(4% 0.004 247);
  --foreground: oklch(98% 0.002 247);
  --card: oklch(7% 0.004 247);
  --border: oklch(15% 0.005 247);
}
```

### Svelte Theme Store
```typescript
// $lib/stores/theme.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createThemeStore() {
  const { subscribe, set } = writable<'light' | 'dark'>('light');
  
  return {
    subscribe,
    toggle: () => {
      if (browser) {
        const isDark = document.documentElement.classList.contains('dark');
        document.documentElement.classList.toggle('dark');
        set(isDark ? 'light' : 'dark');
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
      }
    },
    init: () => {
      if (browser) {
        const saved = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = saved || (prefersDark ? 'dark' : 'light');
        
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
        set(theme);
      }
    }
  };
}

export const theme = createThemeStore();
```

---

## 📱 Responsive Design

### Container Queries (Native in v4)
```svelte
<!-- Card component that adapts to container size -->
<div class="@container">
  <div class="@sm:grid-cols-2 @md:grid-cols-3 @lg:grid-cols-4 grid">
    {#each items as item}
      <div class="@sm:p-4 @md:p-6 p-2">
        <!-- Content adapts to container -->
      </div>
    {/each}
  </div>
</div>
```

### Breakpoint Strategy
```css
/* Mobile-first approach */
.responsive-component {
  /* Mobile: base styles */
  padding: 1rem;
  
  /* Tablet: 768px+ */
  @media (min-width: 768px) {
    padding: 1.5rem;
  }
  
  /* Desktop: 1024px+ */
  @media (min-width: 1024px) {
    padding: 2rem;
  }
}
```

---

## 🧪 Testing Standards

### Visual Regression
```javascript
// .storybook/preview.js
export const parameters = {
  chromatic: {
    viewports: [360, 768, 1440], // Mobile, Tablet, Desktop
    delay: 300,
    diffThreshold: 0.2,
    animationMode: 'disabled'
  }
};
```

### Accessibility Testing
```javascript
// Component test with axe
import { render } from '@testing-library/svelte';
import { axe } from 'jest-axe';
import Button from './Button.svelte';

test('Button meets accessibility standards', async () => {
  const { container } = render(Button, { 
    props: { children: 'Click me' } 
  });
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## 🚫 Common Anti-Patterns

### ❌ Avoid These
```svelte
<!-- Don't use @apply in component styles (Tailwind v4) -->
<style>
  .my-button {
    @apply px-4 py-2 bg-blue-500; /* Won't work in v4 */
  }
</style>

<!-- Don't hardcode colors -->
<div class="bg-blue-500 text-white">

<!-- Don't ignore touch targets -->
<button class="h-6 w-6 p-1"> <!-- Too small: 24×24px -->

<!-- Don't use hover on touch devices -->
<style>
  button:hover { /* Sticky on mobile */ }
</style>
```

### ✅ Do This Instead
```svelte
<!-- Use class composition -->
<Button class={cn("btn-primary", $$props.class)} />

<!-- Use design tokens -->
<div class="bg-brand-500 text-brand-50">

<!-- Ensure accessible touch targets -->
<button class="h-11 w-11 p-2"> <!-- 44×44px minimum -->

<!-- Use media queries for hover -->
<style>
  @media (hover: hover) and (pointer: fine) {
    button:hover { /* Only on capable devices */ }
  }
</style>
```

---

## 🔧 Developer Tools

### VS Code Extensions
- **Tailwind CSS IntelliSense** - Autocomplete and validation
- **Headwind** - Class sorting for v4
- **axe DevTools** - Accessibility testing

### Configuration
```json
// .vscode/settings.json
{
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*)[\"'`]"]
  ],
  "tailwindCSS.includeLanguages": {
    "svelte": "html"
  }
}
```

---

## 📈 Migration Path

### From Tailwind v3 to v4
1. **Update dependencies**: `pnpm install tailwindcss@next`
2. **Replace PostCSS**: Use `@tailwindcss/vite` plugin
3. **Update CSS imports**: `@import "tailwindcss"`
4. **Move @apply to global CSS**: Remove from component styles
5. **Remove plugins**: Container queries now native
6. **Test dark mode**: Verify class-based theming

### Phase Implementation
**Week 1**: Core setup and critical components
**Week 2**: Animation and interaction updates  
**Week 3**: Accessibility compliance
**Week 4**: Performance optimization and testing

---

## 📚 Resources

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [ShadCN/ui Components](https://ui.shadcn.com/docs)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [A11y Project Checklist](https://a11yproject.com/checklist)

---

**Last Updated**: 2025-07-27  
**Status**: ✅ Production Ready  
**Compliance**: WCAG 2.2 AAA, EAA 2025