# /analyze - Code Analysis Command

Performs comprehensive code analysis for the Driplo project.

## Usage
```
/analyze [target]
```

## Options
- `file` - Analyze a specific file
- `component` - Analyze a component and its dependencies
- `feature` - Analyze an entire feature area
- `migration` - Analyze database migrations

## What it does:
1. **Structure Analysis**
   - Identifies patterns and anti-patterns
   - Checks component organization
   - Validates TypeScript types
   - Reviews import structure

2. **Dependency Analysis**
   - Maps component dependencies
   - Identifies circular dependencies
   - Checks for unused imports
   - Validates $lib path usage

3. **Database Analysis**
   - Reviews RLS policies
   - Checks indexes and performance
   - Validates snake_case conventions
   - Ensures migration safety

4. **Performance Analysis**
   - Identifies N+1 queries
   - Checks for unnecessary re-renders
   - Reviews bundle size impact
   - Validates SSR/CSR balance

## Examples:
```
/analyze file src/lib/components/listings/ListingCard.svelte
/analyze component ProfileHeader
/analyze feature messaging
/analyze migration add_listings_table
```

## Output Format:
- **✅ Good Practices**: What's done well
- **⚠️ Warnings**: Minor issues to consider
- **❌ Issues**: Problems that need fixing
- **💡 Suggestions**: Improvement recommendations