# Driplo Project Rules & Standards

## 🚨 CRITICAL: TAILWIND CSS v4 (ALPHA)
**THIS PROJECT USES TAILWIND CSS v4 - DO NOT CHANGE THE IMPORT SYNTAX**
- ✅ CORRECT: `@import 'tailwindcss';` 
- ❌ WRONG: `@tailwind base/components/utilities` (that's v3 syntax)
- NEVER comment out or modify the design system imports in app.css
- The files in `/src/lib/styles/` are ESSENTIAL - they contain the entire design system

## 🚨 Critical Rules (NEVER BREAK THESE)

1. **Package Manager**: Use `pnpm` ONLY (not npm, not yarn)
2. **Imports**: Always use `$lib/*` paths, never relative imports
3. **Styling**: Use CSS variables from app.css + Tailwind (NO new token systems)
4. **Components**: Check existing before creating new (85+ components exist)
5. **Data Loading**: Server-side only in +page.server.ts files

## 📁 File Organization

### Naming Conventions
- Components: PascalCase (e.g., `CreateListingForm.svelte`)
- Utilities: camelCase (e.g., `formatPrice.ts`)
- Routes: kebab-case (e.g., `create-listing`)
- Types: PascalCase with descriptive names (e.g., `ListingFormData`)

### File Locations
```
src/lib/components/ui/      # Base shadcn components (don't modify)
src/lib/components/[feature]/  # Feature-specific components
src/lib/stores/             # Svelte stores (.svelte.ts files)
src/lib/utils/              # Shared utilities
src/lib/types/              # TypeScript type definitions
src/routes/(app)/           # Main app routes
src/routes/(auth)/          # Auth-related routes
src/routes/api/             # API endpoints
```

## 💅 Styling Standards

### CSS Variable Usage
```css
/* ✅ Good */
color: var(--color-primary-500);
background: hsl(var(--primary));

/* ❌ Bad */
color: #87CEEB;
background: rgb(135, 206, 235);
```

### Tailwind Classes
```svelte
<!-- ✅ Good - semantic color classes -->
<div class="bg-primary text-primary-foreground">

<!-- ❌ Bad - hardcoded colors -->
<div class="bg-[#87CEEB] text-white">
```

### Responsive Design
- Mobile-first approach (start with mobile, add desktop with sm:, md:, lg:)
- Test at 375px (mobile) and 1440px (desktop) minimum
- Use Tailwind's responsive prefixes consistently

## 🧩 Component Standards

### Component Structure
```svelte
<script lang="ts">
  import { cn } from '$lib/utils/cn';
  import type { ComponentProps } from './$types';
  
  interface Props {
    // Define all props with TypeScript
    variant?: 'default' | 'primary';
    class?: string;
  }
  
  let { 
    variant = 'default',
    class: className = '',
    ...restProps
  }: Props = $props();
</script>

<!-- Template here -->

<style>
  /* Only if absolutely necessary - prefer Tailwind */
</style>
```

### Event Handlers (Svelte 5)
# 🚨🚨🚨 CRITICAL: SVELTE 5 EVENT SYNTAX 🚨🚨🚨
# THIS PROJECT USES SVELTE 5 - NEVER USE OLD EVENT SYNTAX!
# MIXING OLD AND NEW SYNTAX CAUSES BUILD FAILURES!

```svelte
<!-- ✅ CORRECT - Svelte 5 syntax (ALWAYS USE THIS) -->
<button onclick={() => handleClick()}>Click me</button>
<input oninput={(e) => handleInput(e)} />
<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>

<!-- ❌ WRONG - Svelte 4 syntax (NEVER USE THIS) -->
<button on:click={() => handleClick()}>Click me</button>
<input on:input={(e) => handleInput(e)} />
<form on:submit|preventDefault={handleSubmit}>

<!-- ❌ FATAL ERROR - Mixed syntax (BUILD WILL FAIL) -->
<button onclick={() => handleClick()}>Click</button>
<input on:input={(e) => handleInput(e)} />  <!-- ERROR: Mixed event handler syntaxes -->
```

**🔴 MANDATORY EVENT HANDLER CONVERSIONS:**
- ✅ `onclick` ❌ ~~on:click~~
- ✅ `oninput` ❌ ~~on:input~~
- ✅ `onchange` ❌ ~~on:change~~
- ✅ `onsubmit` ❌ ~~on:submit~~
- ✅ `onfocus` ❌ ~~on:focus~~
- ✅ `onblur` ❌ ~~on:blur~~
- ✅ `onkeydown` ❌ ~~on:keydown~~
- ✅ `onkeyup` ❌ ~~on:keyup~~
- ✅ `onmouseenter` ❌ ~~on:mouseenter~~
- ✅ `onmouseleave` ❌ ~~on:mouseleave~~
- ✅ `onmouseover` ❌ ~~on:mouseover~~
- ✅ `onmouseout` ❌ ~~on:mouseout~~

**⚠️ WHEN UPDATING A COMPONENT:**
1. Search for ALL `on:` prefixes
2. Convert ALL of them to new syntax
3. NEVER leave any old syntax behind
4. Test the component still works

### Props Rules
- Always use TypeScript interfaces
- Provide sensible defaults
- Use descriptive names
- Document complex props with JSDoc

## 🔄 State Management

### Svelte 5 Stores
```typescript
// ✅ Good - .svelte.ts file
// src/lib/stores/user.svelte.ts
export function createUserStore() {
  let user = $state<User | null>(null);
  
  return {
    get user() { return user; },
    setUser: (u: User) => { user = u; }
  };
}
```

### Form Handling
- Use SvelteKit form actions for submissions
- Progressive enhancement with `use:enhance`
- Show loading states during submission
- Display validation errors inline

## 🗄️ Database & Supabase

### Query Patterns
```typescript
// ✅ Good - with error handling
const { data, error } = await supabase
  .from('listings')
  .select('*, profiles!seller_id(*)')
  .order('created_at', { ascending: false });

if (error) {
  console.error('Query failed:', error);
  throw error(500, 'Failed to load listings');
}

// ❌ Bad - no error handling
const { data } = await supabase.from('listings').select('*');
```

### RLS Policies
- Always verify RLS is enabled on tables
- Test policies with different user roles
- Use service role key only when absolutely necessary

## 🧪 Testing Standards

### What to Test
1. Form submissions work correctly
2. Error states display properly
3. Loading states show
4. Mobile responsive behavior
5. Dark mode compatibility

### Test Commands
```bash
pnpm run check   # Must pass before commit
pnpm run lint    # Must pass before commit
pnpm test        # Run all tests
```

## 📋 Code Review Checklist

Before submitting code:
- [ ] No hardcoded colors or spacing values
- [ ] All imports use $lib/* paths
- [ ] TypeScript types defined for all data
- [ ] Error handling in place
- [ ] Loading states implemented
- [ ] Mobile responsive tested
- [ ] No console.log statements
- [ ] Form validation works
- [ ] Accessibility considered (ARIA labels, etc.)

## 🚫 Common Mistakes to Avoid

1. **Creating duplicate components** - Always search first
2. **Using relative imports** - Use $lib/* instead
3. **Hardcoding values** - Use design tokens
4. **Skipping error handling** - Always handle failures
5. **Ignoring TypeScript** - Define all types properly
6. **Client-side data fetching** - Use server-side loading
7. **Inline styles** - Use Tailwind classes
8. **Creating new token systems** - Use existing app.css

## 🎯 Performance Guidelines

1. **Images**: Use lazy loading and proper sizes
2. **Bundles**: Check for duplicate imports
3. **Queries**: Use proper indexes and limits
4. **Components**: Avoid unnecessary re-renders
5. **Assets**: Optimize before adding to repo

## 🔐 Security Rules

1. Never commit .env files
2. Validate all user inputs
3. Use parameterized queries
4. Check auth state server-side
5. Sanitize file uploads
6. Use HTTPS for all external APIs
7. Keep dependencies updated

## 📝 Documentation Standards

- Update MISSION_CONTROL.md after major changes
- Add JSDoc comments for complex functions
- Update README if adding new setup steps
- Document breaking changes clearly
- Keep _claude/ files current