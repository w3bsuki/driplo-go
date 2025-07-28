# Phase 1 Refactoring Plan - Production Ready Cleanup

**Date:** 2025-07-28  
**Goal:** Complete all critical fixes to make the application production-ready  
**Approach:** Methodical, subagent-assisted execution with verification after each task

## 🎯 Phase 1 Objectives

1. Fix all Svelte 5 syntax issues preventing clean builds
2. Remove all remaining inline styles
3. Consolidate duplicate components
4. Fix TypeScript errors blocking compilation
5. Ensure all pages load without errors

## 📋 Task List (Execute with Subagents)

### Task 1: Svelte 5 Syntax Migration ⚡ Priority: CRITICAL
**Subagent Type:** general-purpose  
**Instructions:**
- [ ] Find ALL `<slot>` usage and convert to `{@render children()}`
- [ ] Find ALL `<svelte:component>` and convert to dynamic components
- [ ] Find ALL reactive statements `$:` and convert to `$derived`
- [ ] Find ALL non-reactive state and convert to `$state()`
- [ ] Fix ALL event handlers still using `on:` syntax
- [ ] Verify build has zero Svelte deprecation warnings

**Files to Focus:**
- All layout files (+layout.svelte)
- All route pages (+page.svelte)
- Component files with dynamic rendering

### Task 2: Remove Inline Styles 🎨 Priority: HIGH
**Subagent Type:** general-purpose  
**Instructions:**
- [ ] Search for all `style=` attributes in Svelte files
- [ ] Create utility classes or use existing Tailwind classes
- [ ] Update components to use class-based styling
- [ ] Add missing CSS variables to `src/app.css` if needed
- [ ] Verify no inline styles remain except for truly dynamic values

**Expected Impact:** ~50-100 inline styles to remove

### Task 3: Component Consolidation 🔧 Priority: HIGH
**Subagent Type:** general-purpose  
**Instructions:**
- [ ] Audit all duplicate/similar components
- [ ] Consolidate CreateListingForm variants (4+ versions exist)
- [ ] Merge similar modal/dialog components
- [ ] Remove unused component files
- [ ] Update all imports to use consolidated versions
- [ ] Test each consolidated component thoroughly

**Known Duplicates:**
- CreateListingForm (4+ versions)
- Modal/Dialog components
- Card components (verify actual duplication)

### Task 4: TypeScript Error Resolution 📝 Priority: MEDIUM
**Subagent Type:** general-purpose  
**Instructions:**
- [ ] Run `pnpm run check` and capture all errors
- [ ] Fix top 100 most critical TypeScript errors
- [ ] Add missing type definitions and interfaces
- [ ] Ensure all component props are properly typed
- [ ] Fix any import resolution issues
- [ ] Verify build passes with no blocking errors

**Current State:** 1502 TypeScript errors (focus on blockers only)

### Task 5: Page Load Verification ✅ Priority: HIGH
**Subagent Type:** general-purpose  
**Instructions:**
- [ ] Test all main routes for runtime errors
- [ ] Fix any undefined variable errors
- [ ] Ensure all API calls have proper error handling
- [ ] Verify all images load correctly
- [ ] Test mobile responsiveness on key pages
- [ ] Document any remaining issues for Phase 2

**Critical Pages to Test:**
- Homepage (/)
- Browse/Search (/browse)
- Listing Details (/listings/[id])
- User Profile (/profile)
- Create Listing (/sell)
- Checkout Flow

## 🚀 Execution Strategy

1. **Use Subagents:** Each task should be executed by a specialized subagent
2. **Verify After Each Task:** Run build/tests after completing each task
3. **Update This File:** Mark tasks complete with ✅ as they finish
4. **Document Issues:** Any blockers or discoveries go in the Notes section

## 📊 Success Metrics

- [ ] Zero Svelte 5 deprecation warnings
- [ ] Zero inline styles (except dynamic values)
- [ ] No duplicate component files
- [ ] <100 blocking TypeScript errors
- [ ] All main pages load without console errors
- [ ] Build completes successfully
- [ ] No white screens or crashes

## 📝 Notes & Discoveries

_This section will be updated as tasks are completed_

---

## Phase 2 Preview (After Phase 1 Completion)

1. **Performance Optimization**
   - Bundle size reduction
   - Image optimization
   - Code splitting

2. **Accessibility Improvements**
   - ARIA labels and roles
   - Keyboard navigation
   - Screen reader support

3. **UI/UX Polish**
   - Animation consistency
   - Loading states
   - Error boundaries

4. **Security Hardening**
   - API validation
   - RLS policies
   - Input sanitization

---

**Next Step:** Execute Task 1 with subagent to fix all Svelte 5 syntax issues