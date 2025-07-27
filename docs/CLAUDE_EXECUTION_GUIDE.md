# Claude Code Execution Guide

## Quick Start for New Sessions

### 1. Read Context (2 minutes)
```bash
# Start here every time:
1. Read CLAUDE.md (project overview)
2. Check docs/refactor/MISSION_CONTROL.md (current status)
3. Review relevant phase document
```

### 2. Pick Your Task
Based on MISSION_CONTROL.md status, work on the current phase:
- **Phase 1**: Component deduplication → `docs/refactor/component-audit.md`
- **Phase 2**: Styling cleanup → `docs/refactor/styling-cleanup.md`
- **Phase 3**: Supabase security → `docs/refactor/supabase-fixes.md`
- **Phase 4**: Performance → `docs/performance/optimization-guide.md`

### 3. Execute with Context
The documentation is designed so you can jump straight to coding:
1. The current phase document has exact steps
2. Pattern documents show how to implement
3. Technical debt inventory shows what to fix

## Optimal Session Structure

### Short Session (30-60 minutes)
Perfect for focused component work:
```
1. Read MISSION_CONTROL.md (2 min)
2. Pick one component to deduplicate (3 min)
3. Execute consolidation (40 min)
4. Test thoroughly (10 min)
5. Update MISSION_CONTROL.md (5 min)
```

### Medium Session (2-3 hours)
Good for completing a phase section:
```
1. Context review (5 min)
2. Plan phase objectives (10 min)
3. Execute multiple related tasks (2 hours)
4. Comprehensive testing (20 min)
5. Documentation updates (10 min)
```

### Long Session (4+ hours)
Complete an entire phase:
```
1. Full documentation review (15 min)
2. Create detailed execution plan (20 min)
3. Systematic implementation (3+ hours)
4. Full regression testing (30 min)
5. Update all relevant docs (15 min)
```

## Context-Driven Development Flow

### Starting Fresh
When starting with no prior context:
1. `pnpm install && pnpm run dev` - Get environment running
2. Read `CLAUDE.md` - Understand project basics
3. Check `MISSION_CONTROL.md` - See what needs doing
4. Pick highest priority task from current phase

### Continuing Work
When resuming previous work:
1. Check git status - See uncommitted changes
2. Read last entry in `MISSION_CONTROL.md`
3. Continue from documented stopping point
4. Run tests to ensure nothing broke

### Discovering Issues
When you find new problems:
1. Document in `TECHNICAL_DEBT_INVENTORY.md`
2. Assess if it blocks current work
3. Fix if critical, otherwise continue phase
4. Create todo for future session

## Efficient Execution Patterns

### Component Deduplication
```bash
# 1. Find all versions
find src/lib/components -name "*ComponentName*"

# 2. Check which is used
grep -r "ComponentName" src/routes/

# 3. Compare functionality
# Open each version and identify differences

# 4. Consolidate to single version
# Merge best features from all versions

# 5. Update all imports
# Use search and replace across codebase

# 6. Delete unused versions
# Remove old files

# 7. Test thoroughly
pnpm run check && pnpm run dev
```

### Styling Cleanup
```bash
# 1. Search for hardcoded values
grep -r "#87CEEB\|#[0-9a-fA-F]\{6\}" src/

# 2. Replace with tokens
# Use CSS variables from app.css

# 3. Test in both themes
# Toggle between light/dark mode

# 4. Verify consistency
# Check all major components
```

### Quick Wins Checklist
When you have limited time, focus on these:
- [ ] Delete one unused component (15 min)
- [ ] Fix hardcoded colors in one file (20 min)
- [ ] Add lazy loading to one route (30 min)
- [ ] Write tests for one critical path (45 min)
- [ ] Update TypeScript for one component (20 min)

## Testing Protocol

### After Every Change
```bash
pnpm run check      # TypeScript must pass
pnpm run lint       # No linting errors
pnpm run dev        # Visual check
```

### Before Committing
```bash
# Full test suite
pnpm test

# Check all main routes work
- Homepage loads
- Can create listing
- Auth flow works
- Search functions

# Test responsive design
- 375px (mobile)
- 768px (tablet)
- 1920px (desktop)
```

## Documentation Updates

### Always Update MISSION_CONTROL.md
After each work session, add:
```markdown
### [Today's Date] - [Your Focus Area]

**Completed**:
- Specific task 1
- Specific task 2

**Issues Found**:
- Problem description
- How it was resolved

**Next Steps**:
- What to work on next
- Any blockers

**Files Changed**:
- src/lib/components/[...]
- [other files]
```

### When to Update Other Docs
- **TECHNICAL_DEBT_INVENTORY.md**: When finding new issues
- **Pattern docs**: When establishing new patterns
- **MASTER_PLAN.md**: When timeline needs adjustment

## Common Pitfalls to Avoid

### Don't
- Start coding without reading context
- Create new components (check existing first)
- Add new dependencies without discussion
- Skip testing "because it's quick"
- Work on multiple phases simultaneously

### Do
- Follow the phase order strictly
- Test after every significant change
- Update documentation as you go
- Commit with descriptive messages
- Ask for clarification when unsure

## Success Metrics
Track these to ensure progress:
- Components deleted (target: 20+)
- Bundle size reduction (target: -30%)
- TypeScript coverage (target: 95%)
- Test coverage (target: 80%)
- Lighthouse score (target: 90+)

## Emergency Procedures

### If Build Breaks
```bash
git stash              # Save current work
git checkout main      # Return to stable
pnpm install          # Fresh dependencies
pnpm run dev          # Verify it works
```

### If Confused
1. Re-read CLAUDE.md
2. Check MISSION_CONTROL.md
3. Look for patterns in docs/patterns/
4. Search codebase for similar examples

### If Blocked
1. Document the blocker clearly
2. Try alternative approach
3. Move to different task in same phase
4. Update MISSION_CONTROL.md with blocker

---

**Remember**: The documentation is your map. Trust it, follow it, and update it as you learn. Each session builds on the last, so good documentation ensures continuous progress.