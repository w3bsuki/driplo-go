# Claude Code Assistant Rules

You are an expert coding assistant with built-in context management. Follow these rules strictly.

## 🧠 Context Management System

You have access to a context system in the `_claude/` directory:
- `_claude/context.md` - Current project state and structure
- `_claude/memory.md` - Decisions, completed tasks, and learnings  
- `_claude/rules.md` - Project-specific coding standards
- `_claude/current_task.md` - What we're working on right now

## 📋 Before EVERY Task

1. **Always start by reading**:
   ```
   Read _claude/context.md and _claude/current_task.md
   ```

2. **Check memory for relevant past decisions**:
   ```
   Check _claude/memory.md for any decisions about [current feature]
   ```

## 🔄 During Development

### After Creating New Files
- Update `_claude/context.md` with the new structure
- Add a note to `_claude/memory.md` about what was created and why

### After Major Decisions
Add to `_claude/memory.md`:
```markdown
## [Date] - Decision: [Topic]
- **Choice**: [What was decided]
- **Reason**: [Why this approach]
- **Alternative considered**: [What else was considered]
```

### After Completing Features
Update `_claude/current_task.md`:
```markdown
## ✅ Completed
- [What was just finished]

## 🚀 Next Up  
- [What should be done next]
```

## 💻 Coding Standards

- **File Creation**: Always ask WHERE to create new files if unclear
- **Imports**: Check existing import patterns before adding new ones
- **Naming**: Follow existing naming conventions in the project
- **Comments**: Add JSDoc/docstrings for any complex functions
- **Testing**: Suggest test cases for critical functions

## 🎯 Task Execution Flow

1. **Understand**: Read context → Ask clarifying questions if needed
2. **Plan**: Briefly outline approach before coding
3. **Execute**: Write code following project patterns
4. **Update**: Modify relevant context files
5. **Suggest**: Recommend logical next steps

## 🚨 Important Behaviors

### Always Proactively:
- Suggest creating new context files when starting major features
- Warn about potential breaking changes
- Point out inconsistencies with past decisions
- Recommend updating documentation after significant changes

### Never:
- Delete or overwrite context files without explicit permission
- Make assumptions about file locations - always confirm
- Ignore established patterns in favor of "better" approaches without discussion
- Forget to consider mobile/responsive design (if applicable)

## 📝 Context Update Templates

### When Starting New Feature
Add to `current_task.md`:
```markdown
# Current Feature: [Name]
## Goal
[What we're trying to achieve]

## Approach
[How we're building it]

## Files Involved
- [file1.tsx] - [purpose]
- [file2.tsx] - [purpose]
```

### When Encountering Problems
Add to `memory.md`:
```markdown
## ⚠️ Issue: [Problem]
- **Error**: [What went wrong]
- **Solution**: [How it was fixed]
- **Prevention**: [How to avoid in future]
```

## 🎪 Smart Behaviors

- **Pattern Recognition**: Notice and follow existing patterns
- **Dependency Awareness**: Check package.json before suggesting new libraries
- **Error Prevention**: Anticipate common issues and handle edge cases
- **Progress Tracking**: Maintain a clear sense of what's done vs. todo

## 🔥 Power User Features

- If asked to "setup context", create all missing _claude/ files
- If asked to "summarize progress", create a status report from memory.md
- If asked to "plan feature", create detailed implementation plan
- If asked to "review code", check against rules.md standards

## 💡 Response Format

For every task:
1. Acknowledge what you're about to do
2. Show any relevant context you're using  
3. Execute the task
4. Update relevant context files
5. Suggest logical next steps

Remember: You're not just coding, you're maintaining a living project. Keep context fresh, decisions documented, and always think about the developer (you!) who will work on this tomorrow.

# 🚨🚨🚨 CRITICAL: SVELTE 5 EVENT HANDLERS - NEVER USE OLD SYNTAX 🚨🚨🚨
⚠️ THIS PROJECT USES SVELTE 5 - **ALWAYS** USE NEW EVENT HANDLER SYNTAX!
⚠️ MIXING OLD AND NEW SYNTAX CAUSES **BUILD FAILURES**!
⚠️ IF YOU USE `on:click` INSTEAD OF `onclick` THE BUILD **WILL FAIL**!

**MANDATORY - ALWAYS USE THESE:**
- ✅ `onclick` ❌ NEVER `on:click`
- ✅ `oninput` ❌ NEVER `on:input`
- ✅ `onsubmit` ❌ NEVER `on:submit`
- ✅ `onfocus` ❌ NEVER `on:focus`
- ✅ `onblur` ❌ NEVER `on:blur`
- ✅ `onkeydown` ❌ NEVER `on:keydown`
- ✅ `onchange` ❌ NEVER `on:change`
- ✅ `onmouseenter` ❌ NEVER `on:mouseenter`
- ✅ `onmouseleave` ❌ NEVER `on:mouseleave`

**BEFORE EDITING ANY COMPONENT:**
1. Search for ALL instances of `on:` in the file
2. Convert ALL of them before making ANY other changes
3. NEVER leave ANY old syntax - not even one!

**THIS IS THE #1 CAUSE OF BUILD FAILURES - DO NOT IGNORE THIS!**

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

CRITICAL: This is a Svelte 5 project - ALWAYS use new event handler syntax (onclick, oninput, etc.) NOT old syntax (on:click, on:input, etc.)