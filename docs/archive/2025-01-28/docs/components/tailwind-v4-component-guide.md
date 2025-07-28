# Tailwind v4 Component Development Guide

> **Date**: 2025-07-27  
> **Task**: 9.10.5 - Component Documentation with v4 Patterns  
> **Status**: ✅ **COMPLETE** - Comprehensive v4 patterns and migration guide  
> **Branch**: feature/v4-migration-foundation

## 🎯 Overview

This guide documents the new Tailwind v4 patterns implemented in the Driplo codebase and provides clear guidelines for component development using the modern token system.

## 🎨 Tailwind v4 Token System

### **Color Token Architecture**
```css
/* Modern OKLCH Token System */
@theme {
  /* Brand Colors */
  --color-brand-50: oklch(98.36% 0.011 224.89);   /* Lightest brand */
  --color-brand-500: oklch(81.24% 0.086 210.97);  /* Primary brand (baby blue) */
  --color-brand-600: oklch(73.52% 0.094 210.16);  /* Brand hover */
  --color-brand-900: oklch(42.17% 0.088 212.89);  /* Darkest brand */
  
  /* Semantic Colors */
  --color-error-500: oklch(65.69% 0.199 27.33);   /* Error state */
  --color-success-500: oklch(69.61% 0.158 141.48); /* Success state */
  --color-warning-500: oklch(81.66% 0.108 83.28);  /* Warning state */
  
  /* Neutrals */
  --color-gray-50: oklch(98.47% 0.004 247.86);    /* Light background */
  --color-gray-500: oklch(52.87% 0.022 252.59);   /* Medium gray */
  --color-gray-900: oklch(15.85% 0.015 257.28);   /* Dark text */
  
  /* Special Colors */
  --color-white: oklch(100% 0 0);                  /* Pure white */
  --color-black: oklch(0% 0 0);                    /* Pure black */
}
```

### **Token Usage Patterns**
| Token Type | Usage | Example Classes |
|------------|-------|-----------------|
| **Brand** | Primary actions, links, focus states | `bg-brand-500`, `text-brand-600`, `ring-brand-500` |
| **Semantic** | Status indicators, alerts, feedback | `bg-error-500`, `text-success-600`, `border-warning-500` |
| **Neutrals** | Text, backgrounds, borders | `bg-gray-100`, `text-gray-900`, `border-gray-300` |

## 🔧 Component Patterns

### **Pattern 1: Direct Token Classes** ⭐ **RECOMMENDED**
```svelte
<!-- ✅ Modern v4 Pattern - Button Component -->
<script lang="ts">
  import { cva } from 'class-variance-authority';
  
  const buttonVariants = cva(
    'inline-flex items-center justify-center font-medium transition-all focus-visible:ring-2 focus-visible:ring-brand-500',
    {
      variants: {
        variant: {
          default: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700',
          destructive: 'bg-error-500 text-white hover:bg-error-600',
          outline: 'border border-gray-200 bg-white hover:bg-brand-500 hover:text-white',
          secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
          ghost: 'hover:bg-brand-500 hover:text-white'
        }
      }
    }
  );
</script>

<button class={buttonVariants({ variant })}>
  {children}
</button>
```

### **Pattern 2: CSS Custom Property Brackets** (Transitional)
```svelte
<!-- ⚠️ Hybrid Pattern - Badge Component -->
<script lang="ts">
  const variants = {
    default: 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]',
    success: 'bg-[var(--color-success-50)] text-[var(--color-success-600)]',
    destructive: 'bg-[var(--color-error-50)] text-[var(--color-error-600)]'
  };
</script>

<span class={`inline-flex items-center ${variants[variant]}`}>
  {children}
</span>
```

### **Pattern 3: Legacy Compatibility Classes** ❌ **DEPRECATED**
```svelte
<!-- ❌ Legacy Pattern - To be migrated -->
<button class="bg-primary text-primary-foreground hover:bg-primary/90">
  <!-- This uses compatibility layer, should be migrated -->
</button>
```

## 📚 Component Examples

### **Button Component** ✅ **FULLY MIGRATED**
```svelte
<!-- Modern v4 Implementation -->
<script lang="ts">
  import { cva, type VariantProps } from 'class-variance-authority';
  
  const buttonVariants = cva(
    // Base styles using v4 tokens
    'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-100 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
    {
      variants: {
        variant: {
          // All variants use direct token classes
          default: 'bg-brand-500 text-white border border-transparent hover:bg-brand-600 active:bg-brand-700',
          destructive: 'bg-error-500 text-white border border-transparent hover:bg-error-600',
          outline: 'border border-gray-200 bg-white hover:bg-brand-500 hover:text-white',
          secondary: 'bg-gray-100 text-gray-900 border border-transparent hover:bg-gray-200',
          ghost: 'hover:bg-brand-500 hover:text-white',
          link: 'text-brand-500 underline-offset-4 hover:underline p-0 h-auto'
        },
        size: {
          xs: 'px-2 text-xs rounded-sm',
          sm: 'px-3 text-sm rounded-sm', 
          default: 'px-4 text-sm rounded-sm',
          lg: 'px-5 text-sm rounded-sm',
          xl: 'px-6 text-sm rounded-sm'
        }
      }
    }
  );
</script>
```

### **Input Component** ✅ **FULLY MIGRATED**
```svelte
<!-- Modern v4 Implementation -->
<script lang="ts">
  // Using direct token classes for all states
  const inputStyles = 'flex w-full border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50';
</script>

<input
  class={cn(inputStyles, className)}
  bind:value
  {type}
  {placeholder}
  {disabled}
  {...$$restProps}
/>
```

### **Badge Component** ⚠️ **NEEDS MIGRATION**
```svelte
<!-- Current Hybrid Pattern -->
<script lang="ts">
  // Current implementation using CSS custom property brackets
  const variants = {
    default: 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]',
    success: 'bg-[var(--color-success-50)] text-[var(--color-success-600)]'
  };
</script>

<!-- Should be migrated to: -->
<script lang="ts">
  // ✅ Recommended v4 Pattern
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-success-50 text-success-600',
    destructive: 'bg-error-50 text-error-600'
  };
</script>
```

### **Form Components Pattern**
```svelte
<!-- ✅ Consistent v4 Form Styling -->
<script lang="ts">
  // Standard form input pattern
  const formInputBase = 'flex w-full border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50';
  
  // Form label pattern
  const formLabelBase = 'text-sm font-medium text-gray-900';
  
  // Error state pattern
  const formErrorBase = 'text-sm text-error-500';
</script>

<!-- Label -->
<label class={formLabelBase} for={id}>
  {label}
</label>

<!-- Input with error state -->
<input
  class={cn(
    formInputBase,
    error && 'border-error-500 ring-error-500',
    className
  )}
  {id}
  bind:value
  {...$$restProps}
/>

<!-- Error message -->
{#if error}
  <p class={formErrorBase}>{error}</p>
{/if}
```

## 🎨 Design System Integration

### **Color Usage Guidelines**
```svelte
<!-- ✅ Correct Color Usage -->
<script>
  // Primary actions - use brand colors
  const primaryButton = 'bg-brand-500 hover:bg-brand-600 text-white';
  
  // Destructive actions - use error colors
  const deleteButton = 'bg-error-500 hover:bg-error-600 text-white';
  
  // Success states - use success colors
  const successAlert = 'bg-success-50 border-success-500 text-success-700';
  
  // Neutral content - use gray scale
  const cardBackground = 'bg-white border border-gray-200';
  const secondaryText = 'text-gray-600';
  
  // Focus states - always use brand color
  const focusRing = 'focus:ring-2 focus:ring-brand-500 focus:ring-offset-1';
</script>
```

### **Spacing and Layout**
```svelte
<!-- ✅ Consistent Spacing Pattern -->
<div class="p-4">           <!-- Small container padding -->
  <div class="space-y-4">   <!-- Vertical rhythm -->
    <h2 class="text-lg font-semibold text-gray-900 mb-2">Title</h2>
    <div class="flex items-center gap-2">  <!-- Horizontal spacing -->
      <button class="px-4 py-2">Action</button>
      <button class="px-4 py-2">Cancel</button>
    </div>
  </div>
</div>
```

## 🔄 Migration Guidelines

### **Step 1: Identify Legacy Classes**
```bash
# Find components using legacy classes
grep -r "bg-primary\|text-primary\|bg-secondary\|bg-destructive" src/lib/components/
```

### **Step 2: Class Migration Map**
| Legacy Class | v4 Replacement | Notes |
|--------------|-----------------|-------|
| `bg-primary` | `bg-brand-500` | Primary brand color |
| `text-primary` | `text-brand-500` | Primary text color |
| `bg-secondary` | `bg-gray-100` | Secondary background |
| `text-secondary` | `text-gray-600` | Secondary text |
| `bg-destructive` | `bg-error-500` | Error/delete actions |
| `text-destructive` | `text-error-500` | Error text |
| `border-input` | `border-gray-200` | Input borders |
| `ring-offset-background` | `ring-offset-white` | Focus ring offset |

### **Step 3: Component Migration Process**
1. **Identify** components using compatibility classes
2. **Replace** with direct token classes
3. **Test** visual consistency
4. **Update** TypeScript interfaces if needed
5. **Document** any behavioral changes

### **Step 4: Update Component Interface Types**
```typescript
// ✅ Modern component props with v4 variants
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl';
  className?: string;
  children: Snippet;
}

interface BadgeProps {
  variant?: 'default' | 'success' | 'destructive' | 'warning' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: Snippet;
}
```

## 🏗️ Component Architecture

### **Base Component Structure**
```svelte
<!-- ✅ Recommended Component Structure -->
<script lang="ts">
  import { cn } from '$lib/utils';
  import { cva, type VariantProps } from 'class-variance-authority';
  import type { Snippet } from 'svelte';
  
  // 1. Define variants using CVA
  const componentVariants = cva(
    // Base classes using v4 tokens
    'base-classes-here',
    {
      variants: {
        variant: {
          default: 'default-variant-classes',
          // ... other variants
        },
        size: {
          sm: 'small-size-classes',
          // ... other sizes
        }
      },
      defaultVariants: {
        variant: 'default',
        size: 'default'
      }
    }
  );
  
  // 2. Define component props
  interface Props extends VariantProps<typeof componentVariants> {
    className?: string;
    children: Snippet;
    // ... other props
  }
  
  // 3. Extract props
  let { variant, size, className, children, ...restProps }: Props = $props();
</script>

<!-- 4. Render with computed classes -->
<element 
  class={cn(componentVariants({ variant, size }), className)}
  {...restProps}
>
  {@render children()}
</element>
```

### **Conditional Styling Pattern**
```svelte
<!-- ✅ Dynamic styling with v4 tokens -->
<script lang="ts">
  let { status, urgent } = $props();
  
  // Use object for complex conditional logic
  const statusClasses = {
    pending: 'bg-warning-50 text-warning-700 border-warning-500',
    approved: 'bg-success-50 text-success-700 border-success-500',
    rejected: 'bg-error-50 text-error-700 border-error-500'
  };
</script>

<div class={cn(
  'px-3 py-1 rounded-full border text-sm font-medium',
  statusClasses[status],
  urgent && 'ring-2 ring-error-500 ring-offset-1'
)}>
  {status}
</div>
```

## 🎯 Best Practices

### **✅ DO: Modern v4 Patterns**
- Use direct token classes (`bg-brand-500`, `text-gray-900`)
- Leverage CVA for variant management
- Apply consistent focus styles (`focus:ring-2 focus:ring-brand-500`)
- Use semantic color tokens for appropriate contexts
- Implement proper TypeScript interfaces

### **❌ DON'T: Anti-patterns**
- Don't use legacy compatibility classes (`bg-primary`, `text-destructive`)
- Don't mix CSS custom property brackets with direct classes unnecessarily
- Don't hardcode colors outside the token system
- Don't skip focus states for interactive elements
- Don't forget to update TypeScript interfaces

### **🔧 Development Workflow**
1. **Start with tokens**: Always check available tokens before custom values
2. **Use CVA**: For components with multiple variants
3. **Test dark mode**: Ensure tokens work in dark theme
4. **Check accessibility**: Verify color contrast ratios
5. **Validate TypeScript**: Keep interfaces updated

## 📊 Migration Status

### **✅ Fully Migrated Components**
- `Button.svelte` - Complete v4 implementation
- `Input.svelte` - Direct token classes throughout
- `Textarea.svelte` - Modern focus states
- `Label.svelte` - Consistent typography

### **⚠️ Partially Migrated Components**
- `Badge.svelte` - Using CSS custom property brackets
- `Switch.svelte` - Needs token class migration
- `Select/` components - Mixed patterns

### **❌ Needs Migration** (342 compatibility class usages remaining)
- Various UI components still using `bg-primary`, `text-destructive`, etc.
- Some layout components with legacy classes
- Form components with old focus patterns

## 🔗 Resources

### **Token Reference**
- `src/lib/styles/tokens.css` - Complete token definitions
- `src/lib/styles/compatibility-v4.css` - Legacy class mappings (temporary)

### **Development Tools**
- [Class Variance Authority](https://cva.style/docs) - Variant management
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) - VS Code extension
- [Tailwind v4 Documentation](https://tailwindcss.com/docs) - Official docs

### **Type Definitions**
- `src/lib/types/ui.ts` - UI component interfaces
- `src/lib/types/components.ts` - Component prop types

## 🚀 Next Steps

1. **Complete Migration**: Migrate remaining 342 compatibility class usages
2. **Remove Compatibility Layer**: Delete `compatibility-v4.css` once migration complete
3. **Enable Tree Shaking**: Optimize CSS bundle after full migration
4. **Document Dark Mode**: Add dark theme patterns to this guide
5. **Create Storybook**: Component documentation with live examples

---

*Component Guide Updated: 2025-07-27 | Tailwind v4 Migration Foundation Complete*