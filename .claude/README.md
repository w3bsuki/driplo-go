# Claude Context Engineering System

This directory contains custom commands and configurations for Claude to better understand and work with the Driplo project.

## Available Commands

### `/analyze`
Performs comprehensive code analysis for components, files, features, or migrations.

**Usage:**
```
/analyze file src/lib/components/listings/ListingCard.svelte
/analyze component ProfileHeader
/analyze feature messaging
/analyze migration add_listings_table
```

### `/verify`
Verifies code changes, migrations, and functionality before deployment.

**Usage:**
```
/verify migration 20240315_add_messaging_system
/verify rls listings
/verify api create-listing
/verify types Profile
/verify mobile ListingCard
```

### `/duplicate-check`
Detects duplicate code, components, and functionality across the codebase.

**Usage:**
```
/duplicate-check components
/duplicate-check functions formatPrice
/duplicate-check styles button
/duplicate-check api listings
/duplicate-check types User Profile
```

## How Commands Work

1. **Trigger**: Type `/` followed by the command name
2. **Context**: Claude automatically loads the command's instructions
3. **Execution**: Claude performs the requested analysis/verification
4. **Output**: Structured results with actionable recommendations

## Command Structure

Each command file in the `commands/` directory follows this structure:

```markdown
# /command-name - Description

## Usage
How to use the command with examples

## Options
Available parameters and flags

## What it does
Detailed explanation of functionality

## Examples
Real-world usage examples

## Output Format
What to expect in the response
```

## Creating New Commands

To add a new command:

1. Create a new `.md` file in the `commands/` directory
2. Name it after your command (e.g., `optimize.md` for `/optimize`)
3. Follow the structure template above
4. Test the command to ensure it works as expected

## Integration with Project

These commands are designed specifically for Driplo and understand:

- Project structure and conventions
- Tech stack (SvelteKit, Supabase, Tailwind)
- Common patterns and anti-patterns
- Database schema and RLS policies
- Component architecture

## Best Practices

1. **Use commands early**: Run `/analyze` before making changes
2. **Verify before deploy**: Always `/verify` migrations and RLS
3. **Check for duplicates**: Run `/duplicate-check` before creating new components
4. **Chain commands**: Combine multiple commands for comprehensive checks

## Maintenance

- Update commands when project patterns change
- Add new commands for recurring tasks
- Document any command modifications
- Share useful commands with the team