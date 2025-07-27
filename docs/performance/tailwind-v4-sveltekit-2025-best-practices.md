# Tailwind CSS v4 + SvelteKit Integration: 2025 Best Practices

## Overview

This document outlines the latest best practices for integrating Tailwind CSS v4 with SvelteKit as of 2025, based on the official v4 release on January 22, 2025.

## 1. SvelteKit + Tailwind Setup

### Installation

```bash
# Use the new @next versions for v4
pnpm install tailwindcss@next @tailwindcss/vite@next
```

**Note**: `autoprefixer` and `postcss-import` are no longer needed with the Vite plugin approach.

### vite.config.ts Configuration

```typescript
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    sveltekit(),
    tailwindcss(), // Add the Tailwind Vite plugin
  ],
})
```

### svelte.config.js

```javascript
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(), // Handles Tailwind processing
  kit: {
    adapter: adapter()
  }
};

export default config;
```

### CSS Setup (app.css)

```css
/* No more @tailwind directives! */
@import "tailwindcss";

/* Your custom styles here */
```

### Automatic Content Detection

Tailwind v4 features automatic content detection - no need to configure content globs! The framework automatically discovers all template files in your project.

### Dark Mode Configuration

```javascript
// tailwind.config.js (if using configuration)
export default {
  darkMode: ['class', '[data-theme="dark"]'], // Media + class hybrid strategy
  // ... rest of config
}
```

For SvelteKit SSR compatibility, implement theme toggling:

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

## 2. Utility-First Rules & Anti-Patterns

### When to Use @apply

**⚠️ Important v4 Changes**:
- `@apply` must now be used in global CSS files (like `app.css`)
- Cannot be used inside component `<style>` blocks
- Consider alternatives before using `@apply`

**Valid Use Cases**:
1. **Repeated micro-layouts** (e.g., button variants used 10+ times)
2. **Third-party integration** where you can't add classes directly
3. **Legacy migration** from CSS modules

**Example - Good Use of @apply**:
```css
/* app.css - Global styles only */
.btn-primary {
  @apply bg-brand-500 text-white px-4 py-2 rounded-sm 
         hover:bg-brand-600 transition-colors duration-100
         focus:outline-none focus:ring-1 focus:ring-brand-500;
}
```

**Anti-Pattern - Avoid This**:
```svelte
<!-- Don't do this in v4 -->
<style>
  .card {
    @apply p-4 rounded-lg shadow-md; /* Won't work in component styles */
  }
</style>
```

### Arbitrary Values Best Practices

```svelte
<!-- Good: Use when truly unique -->
<div class="w-[412px] h-[618px]"> <!-- Specific design requirement -->

<!-- Better: Use design tokens when possible -->
<div class="w-96 h-auto"> <!-- Uses standard spacing scale -->

<!-- Best: Use CSS variables for repeated arbitrary values -->
<div class="w-[var(--product-card-width)]">
```

### Component Class Extraction

```svelte
<!-- Button.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils/cn';
  
  export let variant: 'primary' | 'secondary' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  
  const variants = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200'
  };
  
  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-6 text-base'
  };
</script>

<button 
  class={cn(
    'inline-flex items-center justify-center rounded-sm font-medium',
    'transition-colors duration-100',
    'focus:outline-none focus:ring-1 focus:ring-brand-500',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    variants[variant],
    sizes[size],
    $$props.class
  )}
  {...$$restProps}
>
  <slot />
</button>
```

## 3. Performance & Tooling

### The Oxide Engine

Tailwind CSS v4's new **Oxide engine** is built with Rust, delivering:
- **10x faster builds** compared to v3
- **Microsecond incremental builds** when no new CSS is generated
- **Parallel processing** utilizing all CPU cores
- **Optimized purging** for smaller CSS files

### Lightning CSS Integration

Tailwind v4 uses Lightning CSS for:
- CSS optimization and minification
- Vendor prefixing (replacing autoprefixer)
- Modern CSS feature transpilation

**No additional configuration needed** - it's integrated automatically!

### Container Queries

**Native support in v4** - no plugin needed!

```svelte
<!-- Parent container -->
<div class="@container">
  <!-- Responsive based on container size -->
  <div class="@sm:grid-cols-2 @md:grid-cols-3 @lg:grid-cols-4">
    <!-- Content -->
  </div>
</div>

<!-- With named containers -->
<div class="@container/sidebar">
  <nav class="@sm/sidebar:flex @md/sidebar:grid">
    <!-- Navigation -->
  </nav>
</div>
```

### Performance Configuration

```typescript
// vite.config.ts - Enhanced for v4
export default defineConfig({
  plugins: [
    sveltekit(),
    tailwindcss()
  ],
  css: {
    // Lightning CSS handles optimization
    transformer: 'lightningcss',
    lightningcss: {
      targets: {
        // Browser targets
        chrome: 95,
        firefox: 95,
        safari: 14
      }
    }
  },
  build: {
    // CSS code splitting for better performance
    cssCodeSplit: true,
    // Optimize CSS minification
    cssMinify: 'lightningcss'
  }
});
```

## 4. Production Configuration Examples

### Complete tailwind.config.js for SvelteKit

```javascript
export default {
  // Dark mode with class strategy
  darkMode: ['class'],
  
  // v4 automatically detects content, but you can be explicit
  content: {
    files: ['./src/**/*.{html,js,svelte,ts}'],
    // Safelist dynamic classes if needed
    safelist: [
      'bg-red-500',
      'bg-green-500',
      'bg-blue-500'
    ]
  },
  
  theme: {
    extend: {
      // Use CSS variables for dynamic theming
      colors: {
        brand: {
          50: 'rgb(from var(--color-brand) h s 95%)',
          100: 'rgb(from var(--color-brand) h s 90%)',
          // ... etc
        }
      },
      
      // Container queries breakpoints
      containers: {
        '2xs': '16rem',
        'xs': '20rem',
        'sm': '24rem',
        'md': '28rem',
        'lg': '32rem',
        'xl': '36rem',
      }
    }
  },
  
  plugins: [
    // Native container queries in v4, no plugin needed!
    // Other plugins still work as expected
  ]
};
```

### Optimized app.css

```css
/* Import Tailwind v4 */
@import "tailwindcss";

/* CSS Layer for better specificity control */
@layer base {
  /* CSS variables for theming */
  :root {
    --color-brand: 59 130 246; /* blue-500 in RGB */
    --color-surface: 255 255 255;
    --color-text: 17 24 39;
  }
  
  .dark {
    --color-surface: 17 24 39;
    --color-text: 243 244 246;
  }
  
  /* Base resets */
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
  }
}

@layer components {
  /* Component styles that use @apply */
  .btn {
    @apply inline-flex items-center justify-center rounded-sm
           font-medium transition-colors duration-100
           focus:outline-none focus:ring-1;
  }
}

@layer utilities {
  /* Custom utilities */
  .text-balance {
    text-wrap: balance;
  }
}
```

## 5. Performance Benchmarks

Based on 2025 benchmarks with Tailwind CSS v4:

### Build Performance
- **Initial build**: ~200ms (vs ~1000ms in v3)
- **Incremental builds**: <10ms (vs ~100ms in v3)
- **Production build**: ~500ms (vs ~2500ms in v3)

### Bundle Size Improvements
- **Development CSS**: ~50KB (vs ~300KB in v3)
- **Production CSS**: ~8-15KB (vs ~20-40KB in v3)
- **Compression**: Better gzip/brotli ratios due to optimized output

### Runtime Performance
- **First Paint**: 15-20% faster due to smaller CSS
- **CSS parsing**: 30% faster with optimized selectors
- **Memory usage**: 40% less CSS in memory

## 6. Migration Tips

### From Tailwind v3 to v4
1. Update dependencies to `@next` versions
2. Replace PostCSS setup with Vite plugin
3. Update CSS imports (remove @tailwind directives)
4. Move @apply usage to global CSS files
5. Remove container-queries plugin (now native)
6. Test dark mode implementation
7. Verify arbitrary value usage

### Common Issues & Solutions

**Issue**: @apply not working in component styles
```svelte
<!-- Solution: Use utility classes directly -->
<div class="p-4 rounded-lg shadow-md">
  <!-- Or create a component with class extraction -->
</div>
```

**Issue**: Build errors with old syntax
```css
/* Old */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* New */
@import "tailwindcss";
```

**Issue**: Container queries not working
```svelte
<!-- Ensure parent has @container class -->
<div class="@container">
  <div class="@lg:grid-cols-3">...</div>
</div>
```

## 7. Tooling Recommendations

### VS Code Extensions
- **Tailwind CSS IntelliSense** - Updated for v4 syntax
- **Tailwind Documentation** - Quick access to v4 docs
- **Headwind** - Class sorting (configure for v4 order)

### Build Tools
- **Vite 5.0+** - Best performance with Tailwind v4
- **SvelteKit 2.0+** - Full compatibility
- **pnpm** - Recommended package manager

### Development Tools
```json
// .vscode/settings.json
{
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*)[\"'`]"],
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*)[\"'`]"]
  ],
  "tailwindCSS.files.exclude": [
    "**/.git/**",
    "**/node_modules/**",
    "**/dist/**"
  ]
}
```

## Summary

Tailwind CSS v4 with SvelteKit in 2025 offers:
- **Simplified setup** with @tailwindcss/vite plugin
- **10x performance** improvements via Oxide engine
- **Zero configuration** with automatic content detection
- **Native container queries** without plugins
- **Better dark mode** support with hybrid strategies
- **Smaller bundles** through Lightning CSS optimization

The key is to embrace the utility-first approach, minimize @apply usage, and leverage the performance improvements of the new Oxide engine.