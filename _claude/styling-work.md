# 🎨 Styling System Implementation Plan

> **Created**: 2025-01-24  
> **Status**: Planning Phase  
> **Priority**: High  
> **Stack**: SvelteKit + shadcn-svelte + TailwindCSS v4

## 📋 Executive Summary

This plan outlines the complete implementation of our compact design system across the Driplo codebase. We need to:
1. Finish updating existing components with the new design tokens
2. Add missing UI components from shadcn-svelte
3. Ensure consistent styling across all components
4. Set up proper TailwindCSS v4 configuration

## 🎯 Goals

- **Complete** the partial styling implementation
- **Standardize** all components to use design tokens
- **Add** missing essential UI components
- **Eliminate** style inconsistencies
- **Improve** user experience with compact, fast UI

## 📊 Current State Analysis

### ✅ Already Updated
- `ListingCard.svelte` - Product cards (fully updated)
- `Button.svelte` - Using new height tokens
- `Input.svelte` - Compact heights applied
- `Card.svelte` - Proper spacing implemented

### ❌ Needs Work
- `Header.svelte` - Mixed old/new styles
- `HeroSearch.svelte` - Inconsistent styling
- `CategoryDropdown.svelte` - Check styling consistency
- `MobileCategorySheet.svelte` - New file, needs review
- All other existing components

### 🗑️ Deleted (Need Recreation)
- Progress components
- Skeleton components  
- Spinner components
- Toast components
- Alert components

## 🛠️ Implementation Plan

### Phase 1: Setup & Configuration (Day 1)

#### 1.1 Install shadcn-svelte
```bash
npx shadcn-svelte@latest init
```
- Choose style: "New York" (compact style)
- Base color: "Slate" 
- CSS variables: Yes
- Configure paths properly

#### 1.2 Update TailwindCSS Configuration
- Ensure all design tokens from `styling.md` are mapped
- Add CSS variables for semantic colors
- Configure animation tokens
- Set up proper content paths

#### 1.3 Create Token Files
- [ ] Create `/src/lib/styles/tokens.css` with all design tokens
- [ ] Create `/src/lib/styles/base.css` with reset styles
- [ ] Create `/src/lib/styles/utilities.css` with utility classes
- [ ] Create `/src/lib/styles/animations.css` with animation utilities
- [ ] Update `app.css` to import all token files

### Phase 2: Core Component Updates (Day 2-3)

#### 2.1 Navigation Components
- [ ] **Header.svelte**
  - Replace hardcoded colors with token variables
  - Update to h-14 or h-16 height
  - Use consistent rounded-md
  - Apply fast transitions (duration-100)
  - Fix mobile menu styling

- [ ] **MobileMenu.svelte** (if exists)
  - Update sheet/drawer styling
  - Consistent spacing tokens
  - Proper animation timing

#### 2.2 Search Components  
- [ ] **HeroSearch.svelte**
  - Standardize rounded values to rounded-md
  - Update all spacing to use tokens
  - Fix input heights to h-9
  - Apply consistent colors

- [ ] **SearchBar.svelte** (if separate)
  - Match HeroSearch styling
  - Consistent heights and spacing

#### 2.3 Category Components
- [ ] **CategoryDropdown.svelte**
  - Review current implementation
  - Apply compact dropdown styling
  - Ensure proper spacing (px-3 py-2 for items)

- [ ] **MobileCategorySheet.svelte**
  - Style consistent with mobile patterns
  - Proper sheet padding (p-6)
  - Smooth animations

### Phase 3: Add Missing UI Components (Day 4-5)

Using shadcn-svelte, add these essential components:

#### 3.1 Feedback Components
- [ ] **Progress**
  ```bash
  npx shadcn-svelte@latest add progress
  ```
  - Customize heights: h-1 (sm), h-2 (default), h-3 (lg)
  - Add value display option
  - Support indeterminate state

- [ ] **Skeleton**
  ```bash
  npx shadcn-svelte@latest add skeleton
  ```
  - Add pulse animation
  - Create variants: text, rectangular, circular
  - Match our gray color tokens

- [ ] **Spinner**
  - Create custom component
  - Sizes: h-3 to h-12
  - Variants: default (gray), primary (brand), white
  - Use animate-spin utility

#### 3.2 Notification Components
- [ ] **Toast**
  ```bash
  npx shadcn-svelte@latest add toast
  ```
  - Position options (6 positions)
  - Variants: default, success, error, warning, info
  - Auto-dismiss with duration
  - Swipe to dismiss on mobile

- [ ] **Alert**
  ```bash
  npx shadcn-svelte@latest add alert
  ```
  - Compact padding (p-4)
  - Icon support
  - Variants: default, destructive, warning, info

#### 3.3 Data Display Components
- [ ] **Table**
  ```bash
  npx shadcn-svelte@latest add table
  ```
  - Compact cell padding (p-3)
  - Hover states
  - Responsive scroll wrapper

- [ ] **Badge**
  ```bash
  npx shadcn-svelte@latest add badge
  ```
  - Ultra-compact size (px-2.5 py-0.5)
  - Text-xs font size
  - Multiple variants

### Phase 4: Form Components (Day 6)

#### 4.1 Enhanced Inputs
- [ ] **Select**
  ```bash
  npx shadcn-svelte@latest add select
  ```
  - Height h-9 to match inputs
  - Proper dropdown shadow
  - Smooth open/close animation

- [ ] **Checkbox**
  ```bash
  npx shadcn-svelte@latest add checkbox
  ```
  - Size h-4 w-4
  - Brand color when checked
  - Smooth check animation

- [ ] **Radio Group**
  ```bash
  npx shadcn-svelte@latest add radio-group
  ```
  - Consistent with checkbox sizing
  - Proper spacing between options

- [ ] **Switch**
  ```bash
  npx shadcn-svelte@latest add switch
  ```
  - Compact size (h-5 w-9)
  - Smooth toggle animation
  - Brand color when on

#### 4.2 Specialized Inputs
- [ ] **Date Picker**
  - Use native date input with custom styling
  - Add calendar icon button
  - Height h-9

- [ ] **Search Input**
  - Create with search icon
  - Clear button option
  - Proper padding for icons

### Phase 5: Layout Components (Day 7)

- [ ] **Separator**
  ```bash
  npx shadcn-svelte@latest add separator
  ```
  - 1px height/width
  - Subtle color (gray-200)

- [ ] **Scroll Area**
  ```bash
  npx shadcn-svelte@latest add scroll-area
  ```
  - Custom scrollbar styling
  - Smooth scroll behavior

- [ ] **Aspect Ratio**
  ```bash
  npx shadcn-svelte@latest add aspect-ratio
  ```
  - Common ratios support
  - Responsive behavior

### Phase 6: Audit & Polish (Day 8)

#### 6.1 Component Audit
- [ ] Review EVERY component in `/src/lib/components`
- [ ] Create checklist of components needing updates
- [ ] Prioritize by user visibility

#### 6.2 Consistency Checks
- [ ] All buttons use btn-* classes
- [ ] All inputs are h-9 (36px)
- [ ] All borders use rounded-md
- [ ] All transitions are duration-100 or less
- [ ] All focus states use ring-brand-500

#### 6.3 Dark Mode
- [ ] Verify all components work in dark mode
- [ ] Update any hardcoded colors
- [ ] Test color contrast

### Phase 7: Documentation (Day 9)

- [ ] Create component usage guide
- [ ] Document all design tokens
- [ ] Add Storybook or similar for component preview
- [ ] Update CLAUDE.md with component standards

### Phase 8: Performance & Testing (Day 10)

- [ ] Run Lighthouse tests
- [ ] Ensure all animations are 60fps
- [ ] Check bundle size impact
- [ ] Test on mobile devices
- [ ] Verify tap target sizes (min 44px)

## 📁 File Structure

```
/src
├── app.css                    # Import all style files
├── lib/
│   ├── styles/
│   │   ├── tokens.css        # Design tokens
│   │   ├── base.css          # Reset styles
│   │   ├── utilities.css     # Utility classes
│   │   └── animations.css    # Animation utilities
│   └── components/
│       ├── ui/               # All UI components
│       │   ├── button/
│       │   ├── input/
│       │   ├── card/
│       │   ├── toast/
│       │   ├── progress/
│       │   ├── skeleton/
│       │   ├── spinner/
│       │   └── ...
│       └── shared/           # Business components
```

## 🚨 Critical Success Factors

1. **No Mixed Styles** - Components must use ONLY design tokens
2. **Consistent Heights** - Buttons/inputs must use defined heights
3. **Fast Animations** - Nothing over 100ms except page transitions
4. **Compact Spacing** - Follow the tight spacing scale
5. **Mobile First** - Ensure touch targets are accessible

## 📈 Success Metrics

- [ ] 100% of components using design tokens
- [ ] 0 hardcoded color values
- [ ] All animations under 100ms
- [ ] Lighthouse performance score > 95
- [ ] Consistent styling across all pages

## 🔄 Migration Strategy

### For Existing Components:
1. Start with most visible (Header, HeroSearch)
2. Update one component fully before moving to next
3. Test each component after update
4. Commit after each component is complete

### For New Components:
1. Install from shadcn-svelte
2. Customize to match our tokens
3. Test in isolation
4. Integrate into pages
5. Remove any duplicates

## 📝 Checklist Template

For each component update:
- [ ] Heights use token values (h-8, h-9, etc.)
- [ ] Spacing uses token values (p-2, gap-4, etc.)
- [ ] Colors use CSS variables (var(--color-*))
- [ ] Borders use rounded-md (or other tokens)
- [ ] Transitions use duration-100 or duration-fast
- [ ] Focus states have proper ring styling
- [ ] Active states have scale transform
- [ ] Dark mode tested and working
- [ ] No hardcoded values
- [ ] Component documented

## 🎯 Priority Order

1. **Header.svelte** - Most visible navigation
2. **HeroSearch.svelte** - Main search interface  
3. **Toast/Alert** - User feedback (missing)
4. **Progress/Skeleton/Spinner** - Loading states (missing)
5. **Form components** - Checkout/auth forms
6. **Table** - Admin/dashboard views
7. **All other components** - Systematic review

## 💡 Notes

- Use shadcn-svelte CLI for consistency
- Always customize to match our compact design
- Test on real devices, not just browser
- Keep animations minimal and fast
- Document as you go

## 🚀 Next Steps

1. Get approval for this plan
2. Set up shadcn-svelte
3. Start with Phase 1 setup
4. Execute phases in order
5. Daily progress updates in `_claude/current_task.md`

---

**Remember**: The goal is a cohesive, fast, compact design system that improves the user experience and makes the codebase maintainable.