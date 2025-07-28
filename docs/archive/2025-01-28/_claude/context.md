# Driplo Marketplace - Project Context

**Last Updated**: 2025-01-23  
**Stack**: SvelteKit 2.0, Supabase, Tailwind CSS, TypeScript  
**Package Manager**: pnpm (ONLY)  
**Status**: Active refactor to eliminate technical debt

## Project Overview
Driplo is a premium marketplace for second-hand designer clothing (think Vinted meets luxury).
Currently functional but needs major cleanup: component duplication, styling chaos, and performance issues.

## Current Project State

### ✅ Completed
- Phase 1: File structure cleanup (100+ files deleted)
- Phase 2: Styling system unification (all hardcoded colors replaced)
- Phase 3: Component modernization (core UI components fixed)
- Phase 4: Dependency cleanup (6 unused packages removed)
- Phase 5: Code quality (70% complete - utilities consolidated, naming standardized)
- TypeScript improvements: i18n.ts, currency.ts, date.ts, regions.ts converted
- Logging infrastructure: logger service implemented, console statements replaced

### 🔄 In Progress
- Manual TypeScript error fixes (1502 errors remaining, down from 1515)
- Component prop interface additions
- Error handling improvements

### ⏳ Pending
- Fix duplicate CreateListingForm components (4+ versions)
- Consolidate design token systems into single app.css
- Update all hardcoded color values
- Optimize bundle size

## Key Architecture Decisions
- **Components**: Use existing shadcn-ui components in src/lib/components/ui/
- **Styling**: CSS variables in app.css + Tailwind utilities (NO new token systems)
- **Data Loading**: Server-side only (+page.server.ts pattern)
- **Imports**: Always use $lib/* paths, never relative imports
- **State**: Svelte 5 stores in src/lib/stores/

## Project Structure
```
src/
├── lib/
│   ├── components/     # 85+ existing components - CHECK before creating
│   │   ├── ui/        # shadcn-ui base components
│   │   └── listings/  # Feature components (needs cleanup)
│   ├── utils/         # Shared utilities
│   └── stores/        # State management
└── routes/            # SvelteKit pages
    ├── (app)/        # Main app routes
    └── api/          # API endpoints

docs/
├── refactor/         # Refactoring guides and audits
├── patterns/         # Code patterns and best practices
├── performance/      # Optimization guides
├── architecture/     # System design docs
├── deployment/       # Production configs
└── styling/          # Design system docs

_claude/              # AI assistant context
├── context.md        # This file - project state
├── memory.md         # Decisions and learnings
├── rules.md          # Coding standards
└── current_task.md   # Active work tracking
```

## Critical Files & Their Purpose
- `src/app.css` - SINGLE source of truth for all design tokens
- `tailwind.config.js` - Tailwind configuration (keep minimal)
- `src/lib/components/ui/` - Base UI components (shadcn-ui)
- `src/lib/utils/cn.ts` - Class name utility (keep unchanged)
- `docs/refactor/MISSION_CONTROL.md` - Live refactor tracking

## Known Issues & Technical Debt
1. **Component Duplication** - Multiple versions of CreateListingForm, hero components
2. **Styling Chaos** - 5+ different token systems, hardcoded colors everywhere
3. **Bundle Bloat** - Unused dependencies, duplicate code
4. **Supabase Security** - SECURITY DEFINER views, long OTP expiry
5. **Performance** - No image optimization, missing indexes

## Development Commands
```bash
pnpm install          # Install dependencies
pnpm run dev          # Start dev server (http://localhost:5173)
pnpm run check        # TypeScript validation (MUST pass)
pnpm run lint         # ESLint check (MUST pass)
pnpm test             # Run tests
```

## Environment Variables Required
- SUPABASE_URL
- SUPABASE_ANON_KEY
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY

## Testing Requirements
- Run actual tests, no mocks
- Test mobile viewport (375px)
- Verify error states render
- Check loading states display
- Validate Supabase RLS policies work