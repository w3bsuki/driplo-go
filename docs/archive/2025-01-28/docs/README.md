# Driplo Documentation

Welcome to the Driplo marketplace documentation. This guide will help you navigate the codebase and understand our development practices.

## 🚀 Quick Start
1. Read [CLAUDE.md](../CLAUDE.md) in the project root for development context
2. Check [MISSION_CONTROL.md](refactor/MISSION_CONTROL.md) for current refactor status
3. Review relevant pattern guides before implementing features

## 📁 Documentation Structure

### 🔧 Active Refactoring
Track and execute the ongoing technical debt cleanup:
- [MISSION_CONTROL.md](refactor/MISSION_CONTROL.md) - Live progress tracking
- [component-audit.md](refactor/component-audit.md) - Component duplication cleanup
- [styling-cleanup.md](refactor/styling-cleanup.md) - Design token unification
- [supabase-fixes.md](refactor/supabase-fixes.md) - Auth and security improvements

### 📝 Code Patterns
Reusable patterns and best practices:
- [data-loading.md](patterns/data-loading.md) - Server-side data fetching
- [component-structure.md](patterns/component-structure.md) - Component templates
- [error-handling.md](patterns/error-handling.md) - Error management strategies

### 🏗️ Architecture
System design and technical decisions:
- [tech-stack.md](architecture/tech-stack.md) - Technology choices
- [folder-structure.md](architecture/folder-structure.md) - Project organization
- [design-decisions.md](architecture/design-decisions.md) - Key architectural choices

### ⚡ Performance
Optimization guides and strategies:
- [optimization-guide.md](performance/optimization-guide.md) - Overall performance strategy
- [image-optimization.md](performance/image-optimization.md) - Image handling
- [bundle-analysis.md](performance/bundle-analysis.md) - Code splitting

### 🚀 Deployment
Production configuration and setup:
- [supabase-config.md](deployment/supabase-config.md) - Supabase production settings
- [vercel-config.md](deployment/vercel-config.md) - Vercel deployment
- [environment-vars.md](deployment/environment-vars.md) - Environment setup
- [auth-checklist.md](deployment/auth-checklist.md) - Auth configuration

## 🎯 Current Priorities
1. **Component Deduplication** - Multiple versions exist for CreateListingForm, hero components
2. **Styling System** - Consolidate 5+ token systems into single source
3. **Supabase Security** - Fix RLS policies and auth flow
4. **Performance** - Image optimization and bundle reduction

## 🛠️ Development Workflow
```bash
# Start development
pnpm install
pnpm run dev

# Run checks before committing
pnpm run check    # TypeScript
pnpm run lint     # ESLint
pnpm test         # Tests
```

## 📚 Additional Resources
- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn-ui Components](https://www.shadcn-svelte.com/)

## 🤝 Contributing
1. Always check existing components before creating new ones
2. Follow patterns documented in the patterns/ directory
3. Update MISSION_CONTROL.md when making significant changes
4. Test on mobile viewport (375px) before committing
5. Ensure all checks pass before creating PRs