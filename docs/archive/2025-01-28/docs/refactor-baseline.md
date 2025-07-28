# UI Refactor Baseline Documentation

**Date:** 2025-07-27
**Branch:** fix/ui-refactor-production-ready

## Current State

### Build Status
- ✅ Build succeeds without errors
- Build time: Approximately 2-3 minutes
- Output: Clean build with all assets generated

### TypeScript Status
- ❌ 1583 TypeScript errors
- 178 warnings
- 277 files with issues
- Main issues:
  - Unused variables and imports
  - Type mismatches
  - Missing ARIA attributes
  - Event handler warnings

### Key Issues to Address
1. **Mixed Svelte 5 event syntax** - Need to fix all `on:click` → `onclick`
2. **Inline styles** - 41 instances across 27 files
3. **Custom components** - Duplicating bits-ui functionality
4. **Monolithic components** - Header.svelte (1000+ lines), ListingCard.svelte (287 lines)
5. **Accessibility** - Missing ARIA attributes, improper interactive elements

### Critical Files
- `src/lib/components/layout/Header.svelte` - 1000+ lines, needs breakdown
- `src/lib/components/listings/ListingCard.svelte` - 287 lines, mixed concerns
- `src/lib/components/ui/button.svelte` - Custom implementation needs bits-ui
- `src/lib/components/ui/input.svelte` - Has inline height styling
- `src/lib/components/ui/textarea.svelte` - Has inline min-height styling

### Next Steps
1. Set up visual regression testing
2. Fix all Svelte 5 event handlers
3. Fix reactive statements
4. Clean up styling foundation