# Driplo Marketplace - Project Context

**Last Updated**: 2025-01-28  
**Stack**: SvelteKit 2.0, Supabase, Tailwind CSS v4, TypeScript  
**Package Manager**: pnpm (ONLY)  
**Status**: Active development

## Project Overview
Driplo is a premium marketplace for second-hand designer clothing (think Vinted meets luxury).
Currently functional with ongoing improvements to performance and code quality.

## Current Project State

### ✅ Recently Completed
- Header component fixes (2025-01-28)
- ListingCard refactoring into modular components
- Comprehensive error boundary system
- TypeScript interfaces implementation (1,500+ lines)
- Basic test coverage (177 tests)
- Sentry error tracking integration
- Web Vitals performance monitoring
- N+1 query optimization (95% reduction)
- Image lazy loading implementation

### 🔄 Active Issues
- TypeScript errors: ~700 remaining (mostly RPC function mismatches)
- Some component duplication remains
- Performance optimization ongoing

### ⏳ Pending
- Complete TypeScript migration
- Full Playwright E2E test suite
- Dark mode implementation
- Mobile app development

## Key Architecture Decisions
- **Components**: Use existing shadcn-ui components in src/lib/components/ui/
- **Styling**: Tailwind v4 with OKLCH colors and design tokens
- **Data Loading**: Server-side only (+page.server.ts pattern)
- **State**: Svelte 5 stores and runes
- **Error Handling**: Enterprise-grade error boundaries
- **Performance**: Lazy loading, code splitting, optimized queries

## Critical Files & Their Purpose
- `src/app.css` - Design tokens and global styles
- `tailwind.config.js` - Tailwind v4 configuration
- `src/lib/components/ui/` - Base UI components (bits-ui based)
- `src/lib/types/` - TypeScript interfaces
- `src/lib/config/sentry.ts` - Error tracking configuration

## Development Commands
```bash
pnpm install          # Install dependencies
pnpm run dev          # Start dev server (http://localhost:5173)
pnpm run check        # TypeScript validation
pnpm run lint         # ESLint check
pnpm test             # Run tests
pnpm run build        # Production build
```

## Environment Variables Required
- SUPABASE_URL
- SUPABASE_ANON_KEY
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- PUBLIC_SENTRY_DSN (optional but recommended)
- PUBLIC_TURNSTILE_SITE_KEY (for CAPTCHA)