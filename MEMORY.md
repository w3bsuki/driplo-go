# Memory - Driplo Project

## [2025-01-28] - Documentation Cleanup
- **Decision**: Consolidated 80+ MD files into 6 essential docs
- **Structure**: 5 files in root (CLAUDE, CONTEXT, MEMORY, TASK, README) + 2 in /docs
- **Archive**: All old docs preserved in docs/archive/2025-01-28/

## [2025-01-28] - Header Component Fixed
- **Issue**: Header broken after decomposition from 1000+ lines
- **Fixed**: Missing CSS variables, reactivity bugs, hardcoded colors
- **Result**: Fully functional modular header architecture

## [2025-01-27] - Major Performance Wins
- **N+1 Queries**: 95% reduction (41 queries → 2 on browse page)
- **Build Speed**: 10x improvement with Tailwind v4 Vite plugin
- **Bundle Size**: Reduced from 1.5MB to ~450KB with code splitting
- **Image Loading**: Lazy loading with intersection observer

## [2025-01-27] - Enterprise Features Added
- **Error Boundaries**: Bulletproof error handling preventing crashes
- **TypeScript Interfaces**: 1,500+ lines of type definitions
- **Test Coverage**: 177 tests for critical flows
- **Sentry Integration**: Production error tracking
- **Web Vitals**: Performance monitoring

## Critical Technical Decisions

### Styling System
- **Choice**: Tailwind v4 with OKLCH colors and design tokens
- **Reason**: Better color science, modern syntax, 10x build performance
- **Pattern**: All components use CSS variables, zero hardcoded values

### Component Architecture
- **Choice**: Modular component decomposition
- **Pattern**: Components split into logical sub-components with hooks
- **Example**: ListingCard → 4 components + 1 hook

### Database Optimization
- **Choice**: RPC functions for complex queries
- **Pattern**: Single query with joins instead of N+1
- **Impact**: 2.3s → 350ms page load time

### Error Handling
- **Choice**: Enterprise-grade error boundaries
- **Pattern**: Route-level + component-level protection
- **Result**: No more white screens on errors

### Authentication
- **Choice**: Supabase Auth with 2FA support
- **Security**: Turnstile CAPTCHA, rate limiting, session management
- **Pattern**: Server-side validation for all auth operations

## Key Patterns Established

### Svelte 5 Syntax (CRITICAL)
- ALWAYS use `onclick` not `on:click`
- Use `$state()` and `$props()` not old syntax
- Use `{@render children()}` not `<slot>`

### File Organization
- Components in feature directories with index re-exports
- Shared types in `/lib/types/`
- Server utilities in `/lib/server/`
- Hooks for complex logic extraction

### Performance Patterns
- Lazy load heavy components
- Use intersection observer for images
- Code split by route and feature
- Optimize database queries with indexes

### Testing Strategy
- Unit tests for utilities and hooks
- Integration tests for API endpoints
- Component tests for critical UI
- E2E tests for user journeys

## Lessons Learned

### What Works
- Subagents excel at comprehensive analysis
- Modular architecture improves maintainability
- Design tokens ensure consistency
- Server-side validation prevents security issues

### What to Avoid
- Creating new files when editing suffices
- Working on multiple tasks in parallel
- Ignoring existing patterns
- Skipping error boundary protection

## Next Major Milestones
1. Complete TypeScript migration (~700 errors)
2. Full E2E test coverage
3. Dark mode implementation
4. Mobile app development
5. Internationalization improvements