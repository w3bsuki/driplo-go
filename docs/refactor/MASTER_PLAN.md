# Driplo Refactor Master Plan

## Executive Summary
This document outlines the complete refactoring strategy to eliminate technical debt and modernize the Driplo marketplace codebase. The refactor is divided into 5 phases that must be executed in order.

## Current State Assessment

### Critical Issues
1. **Component Duplication**: 4+ versions of CreateListingForm, multiple hero components
2. **Styling Chaos**: 5+ different design token systems, hardcoded values everywhere
3. **Bundle Bloat**: Unused dependencies, dead code, duplicate utilities
4. **Supabase Security**: Missing RLS policies, auth flow issues
5. **Performance**: Unoptimized images, large bundle size, no code splitting

### Impact
- Bundle size ~30-50% larger than necessary
- Maintenance nightmare with multiple component versions
- Security vulnerabilities in data access
- Poor Core Web Vitals scores

## Refactor Phases

### Phase 1: Component Deduplication ✅ 
**Duration**: 2-3 days  
**Risk**: Medium  
**Status**: Ready to execute

#### Objectives
- Identify which components are actually used in production
- Delete all unused component versions
- Consolidate duplicate functionality
- Update all imports

#### Execution Steps
1. Audit all components in `src/lib/components/listings/`
2. Check route imports to find active components
3. Test each major flow (create listing, view listing, etc.)
4. Delete unused versions
5. Update imports throughout codebase

#### Success Criteria
- Single version of each component
- All flows working correctly
- Bundle size reduced by 20%+

**Detailed Plan**: See [component-audit.md](component-audit.md)

### Phase 2: Styling System Unification 🔄
**Duration**: 2 days  
**Risk**: Medium  
**Status**: Plan ready

#### Objectives
- Create single source of truth in `app.css`
- Remove all hardcoded color values
- Delete redundant token systems
- Ensure dark mode compatibility

#### Execution Steps
1. Replace entire `app.css` with unified token system
2. Search and replace hardcoded values (#87CEEB, etc.)
3. Update Tailwind config for consistency
4. Test all components in light/dark mode
5. Delete old design system files

#### Success Criteria
- All styling from CSS variables
- Dark mode working throughout
- No hardcoded values remain

**Detailed Plan**: See [styling-cleanup.md](styling-cleanup.md)

### Phase 3: Supabase Security Hardening ⏳
**Duration**: 3 days  
**Risk**: High  
**Status**: Planning needed

#### Objectives
- Implement proper RLS policies
- Fix auth session handling
- Secure all API endpoints
- Add proper error handling

#### Key Tasks
- Audit all tables for RLS policies
- Implement row-level security
- Fix auth callback handling
- Add rate limiting
- Secure file uploads

**Detailed Plan**: See [supabase-fixes.md](supabase-fixes.md)

### Phase 4: Performance Optimization ⏳
**Duration**: 2-3 days  
**Risk**: Low  
**Status**: Planning needed

#### Objectives
- Optimize image loading
- Implement code splitting
- Reduce bundle size
- Improve Core Web Vitals

#### Key Tasks
- Implement image lazy loading
- Add dynamic imports for routes
- Remove unused dependencies
- Optimize Supabase queries
- Add caching strategies

### Phase 5: Code Quality & Testing ⏳
**Duration**: 2-3 days  
**Risk**: Low  
**Status**: Planning needed

#### Objectives
- Add comprehensive tests
- Improve TypeScript coverage
- Standardize code patterns
- Document critical flows

#### Key Tasks
- Write tests for critical paths
- Add TypeScript to remaining files
- Create component documentation
- Set up CI/CD checks

## Execution Strategy

### Prerequisites
1. Create feature branch: `git checkout -b refactor/phase-1-components`
2. Ensure all tests pass before starting
3. Set up monitoring to track performance impact

### Daily Workflow
1. Start with fresh context: Read MISSION_CONTROL.md
2. Execute planned tasks for current phase
3. Test thoroughly after each major change
4. Update MISSION_CONTROL.md with progress
5. Commit with descriptive messages

### Rollback Strategy
- Keep main branch stable
- Create restore points between phases
- Test on staging before production
- Have database backups ready

## Success Metrics

### Technical Metrics
- Bundle size: Reduce by 30%+
- Lighthouse performance: 90+ score
- TypeScript coverage: 95%+
- Test coverage: 80%+ for critical paths

### Business Metrics
- Page load time: <2s on 3G
- Error rate: <0.1%
- User engagement: Measure before/after

## Timeline
- **Week 1**: Phases 1-2 (Components + Styling)
- **Week 2**: Phase 3 (Supabase Security)
- **Week 3**: Phases 4-5 (Performance + Quality)

## Next Steps
1. Review and approve this plan
2. Start with Phase 1: Component Deduplication
3. Track progress in MISSION_CONTROL.md
4. Adjust timeline based on findings

---

**Remember**: This is a living document. Update it as you discover new issues or complete phases.