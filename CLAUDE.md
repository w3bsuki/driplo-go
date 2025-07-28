# CLAUDE.md - AI Assistant Rules for Driplo.bg

## Core Principles
- Ship working code fast
- Use subagents for complex tasks
- Keep documentation minimal but current
- Test everything before marking complete

## Project Context
- **Stack:** SvelteKit 2, Svelte 5, Supabase, Tailwind CSS v4
- **State:** Check `CONTEXT.md` for current status
- **Memory:** Check `MEMORY.md` for past decisions
- **Task:** Check `TASK.md` for active work

## Subagent Usage Patterns

### When to Use Subagents
```
ALWAYS use subagents for:
- Finding and fixing all instances of a pattern
- Large refactoring tasks (>10 files)
- Complex analysis or audits
- Systematic cleanup operations

Example: "Find ALL on:click and convert to onclick"
```

### Subagent Instructions Template
```
Task: [Clear, specific goal]
Context: [Relevant project info]
Success Criteria: [Measurable outcomes]
```

## Code Standards

### Svelte 5 - CRITICAL ⚠️
- ✅ `onclick` NOT `on:click`
- ✅ `{@render children()}` NOT `<slot>`
- ✅ `$state()` for reactive values
- ✅ `$props()` NOT `export let`

### File Creation
- Check if component exists before creating
- Use existing patterns from similar files
- Update CONTEXT.md after structural changes

### Imports & Paths
- Always use `$lib/*` imports
- Check `package.json` before adding dependencies
- Follow existing import patterns

## Quick Commands
```bash
pnpm run dev          # Start dev
pnpm run check        # TypeScript check
pnpm run lint         # Linting
pnpm run build        # Production build
```

## Memory System
- Log only MAJOR decisions in MEMORY.md
- Keep TASK.md updated with active work
- Archive completed work, don't accumulate

## Production Checklist
See `docs/PRODUCTION.md` for deployment requirements

## Critical Reminders
1. **NEVER** use old Svelte event syntax (on:click)
2. **ALWAYS** prefer editing existing files over creating new ones
3. **NEVER** create documentation unless explicitly requested
4. **ALWAYS** test before marking complete