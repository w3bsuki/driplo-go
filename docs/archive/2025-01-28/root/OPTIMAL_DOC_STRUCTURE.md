# Optimal Documentation Structure for Driplo

## 🎯 Design Principles
1. **Most-used files in root** - Zero navigation needed
2. **Clear naming** - Know what's inside without opening
3. **Single source of truth** - No duplicate info
4. **AI-first design** - Optimized for Claude/subagents

## 📁 Proposed Structure

### Root Directory (4 AI-Critical Files)
```
/
├── CLAUDE.md          # AI rules & patterns (used every session)
├── CONTEXT.md         # Current project state (checked constantly)
├── MEMORY.md          # Decision log & learnings (referenced often)
├── TASK.md            # What we're working on NOW (updated frequently)
└── README.md          # Standard project overview
```

### /docs Directory (Production & Reference)
```
/docs/
├── PRODUCTION.md      # Deployment checklist & requirements
├── ARCHITECTURE.md    # System design & tech decisions
└── /archive/          # Historical docs (hidden from daily use)
```

## 🚀 Why This Structure Works

### Root Benefits
- **Zero clicks** to access critical files
- **Tab completion** works instantly (CL→CLAUDE.md, CO→CONTEXT.md)
- **Visible reminders** of what needs updating
- **Git changes** show doc updates prominently

### Naming Convention
- **CAPS.md** = Active use docs (stands out)
- **lowercase.md** = Standard files (README)
- **Clear purpose** in filename

### No _claude Directory Because
- Hidden directories = forgotten docs
- Extra navigation = friction
- Subagents work faster with root access

## 📋 Migration Plan

### Step 1: Create New Structure
```bash
# Create active docs in root
mv _claude/context.md ./CONTEXT.md
mv _claude/current_task.md ./TASK.md
mv _claude/memory.md ./MEMORY.md
cp CLAUDE_MD_DRAFT.md ./CLAUDE.md

# Create production docs
mkdir -p docs
echo "# Production Checklist" > docs/PRODUCTION.md
echo "# Architecture Guide" > docs/ARCHITECTURE.md
```

### Step 2: Archive Everything Else
```bash
# Archive old docs
mkdir -p docs/archive/2025-01-28
mv *.md docs/archive/2025-01-28/ # except our new ones
mv docs/*.md docs/archive/2025-01-28/docs/
mv _claude/*.md docs/archive/2025-01-28/_claude/
```

### Step 3: Clean Memory.md
- Keep only major decisions
- Remove day-to-day updates
- Target: <5000 tokens

### Step 4: Update References
- Fix any hardcoded paths
- Update CLAUDE.md with new locations

## 📊 Success Metrics
- Find any doc in <2 seconds
- No "where is that file?" moments
- Subagents work without path confusion
- New devs understand structure immediately

## 🎯 Final Structure
```
driplo.bg/
├── CLAUDE.md          # "How to work with this codebase"
├── CONTEXT.md         # "What is the current state"
├── MEMORY.md          # "What have we learned"
├── TASK.md            # "What are we doing now"
├── README.md          # "What is this project"
├── docs/
│   ├── PRODUCTION.md  # "How to deploy this"
│   ├── ARCHITECTURE.md # "How is this built"
│   └── archive/       # "Historical reference"
└── [rest of codebase]
```

---

**Ready to execute with subagent?** This structure puts everything at your fingertips!