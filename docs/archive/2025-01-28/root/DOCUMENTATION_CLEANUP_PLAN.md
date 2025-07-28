# Documentation Cleanup Plan

**Current State:** 80+ MD files across project (complete chaos!)  
**Target State:** 3-5 essential MD files  
**Goal:** Clear, actionable documentation that actually gets used

## 📁 Current Documentation Audit

### Root Directory (22 files) - TOO MANY!
- Multiple refactor plans (6+ different plans)
- Multiple audit reports (5+ audits)
- Duplicate styling guides
- Old/outdated reports

### /docs Directory (50+ files) - BLOATED!
- Nested folders 4 levels deep
- Many duplicate/overlapping guides
- Historical documents no longer relevant
- Multiple "master plans" and "final summaries"

### /_claude Directory (8 files) - GOOD but needs optimization
- context.md - Project state (good)
- memory.md - Decisions log (30k+ tokens, needs cleanup)
- current_task.md - Active work (good)
- rules.md - Standards (needs update)
- Multiple styling guides (redundant)

## 🎯 Proposed Structure (3-5 Essential Files)

### 1. **CLAUDE.md** (Root) - AI Assistant Instructions
```
- Clear, concise rules for Claude/subagents
- How to use memory system
- Smart patterns for efficient coding
- NO duplicate content from other files
```

### 2. **README.md** (Root) - Project Overview
```
- What is Driplo?
- Quick start (setup, run, deploy)
- Tech stack summary
- Links to other docs
```

### 3. **_claude/CONTEXT.md** - Living Project State
```
- Current architecture
- Active refactoring status
- Known issues
- Next priorities
```

### 4. **_claude/MEMORY.md** - Decision Log (Cleaned Up)
```
- Major decisions only (not every tiny change)
- Patterns discovered
- What works/doesn't work
- Searchable format
```

### 5. **docs/PRODUCTION_CHECKLIST.md** - Launch Requirements
```
- Security checklist
- Performance requirements
- Deployment steps
- Environment configs
```

## 🗑️ Files to Archive/Delete

### Delete Immediately (Redundant/Outdated):
- All UI_REFACTOR_*.md files (keep learnings in memory)
- All *_REPORT.md files (outdated audits)
- All PHASE_*.md plans (completed work)
- Duplicate styling guides
- Old implementation guides

### Archive to /docs/archive/:
- Historical refactor plans (for reference only)
- Completed audit reports
- Old technical decisions

## 🚀 Execution Plan

### Step 1: Backup Everything
```bash
mkdir -p docs/archive/2025-01-28-cleanup
cp *.md docs/archive/2025-01-28-cleanup/
cp -r docs/* docs/archive/2025-01-28-cleanup/docs/
```

### Step 2: Clean _claude Directory
- Merge styling guides into CONTEXT.md
- Clean up MEMORY.md (reduce from 30k to <5k tokens)
- Update current_task.md with new structure

### Step 3: Rewrite CLAUDE.md
- Focus on subagent usage patterns
- Clear rules for code generation
- Memory system usage
- Remove all fluff

### Step 4: Consolidate docs/
- Keep only production-critical docs
- Move everything else to archive
- Create single PRODUCTION_CHECKLIST.md

### Step 5: Clean Root Directory
- Delete all report/audit files
- Keep only CLAUDE.md and README.md
- Archive everything else

## 📋 Success Criteria

- [ ] Only 3-5 MD files in active use
- [ ] CLAUDE.md under 100 lines
- [ ] Memory.md under 5k tokens
- [ ] Clear purpose for each remaining file
- [ ] No duplicate information
- [ ] Easy to find what you need

## 🎯 Benefits

1. **Clarity:** Know exactly where to look
2. **Speed:** Subagents work faster with clean docs
3. **Maintenance:** Easy to keep updated
4. **Onboarding:** New devs understand immediately

---

**Ready to execute with subagent?** This will be a one-time cleanup that makes everything else easier.