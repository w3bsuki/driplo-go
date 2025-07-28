# /refactor - Code Refactoring Command

Guides systematic refactoring of Driplo code following established patterns.

## Usage
```
/refactor [target] [pattern]
```

## Options

### Targets
- `component` - Refactor a specific component
- `store` - Refactor store implementation
- `api` - Refactor API endpoints
- `duplicate` - Refactor duplicate code

### Patterns
- `consolidate` - Merge duplicate implementations
- `modernize` - Update to latest patterns
- `optimize` - Improve performance
- `accessibility` - Enhance a11y support

## What it does:

1. **Analysis Phase**
   - Identifies current implementation
   - Detects anti-patterns
   - Maps dependencies
   - Assesses impact

2. **Planning Phase**
   - Creates refactoring plan
   - Lists required changes
   - Identifies risks
   - Estimates effort

3. **Implementation Phase**
   - Shows before/after code
   - Provides step-by-step guide
   - Updates imports/references
   - Maintains functionality

4. **Verification Phase**
   - Lists tests to run
   - Checks for regressions
   - Validates improvements
   - Measures impact

## Examples:

### Consolidate Image Components
```
/refactor component Image consolidate
```
Will merge OptimizedImage, ResponsiveImage, and Image.svelte into a single component.

### Modernize Store Pattern
```
/refactor store messages modernize
```
Updates the messages store to use the resource store factory pattern.

### Optimize List Performance
```
/refactor component ListingGrid optimize
```
Adds virtualization and lazy loading to improve performance.

### Enhance Accessibility
```
/refactor component Modal accessibility
```
Adds proper ARIA attributes, keyboard navigation, and focus management.

## Common Refactoring Tasks in Driplo

### 1. Image Component Consolidation
**Current State**: Three separate image components
**Target State**: Single unified Image component

```svelte
<!-- Before: Multiple components -->
<OptimizedImage src={url} />
<ResponsiveImage src={url} />
<Image src={url} />

<!-- After: Single component -->
<Image 
  src={url} 
  alt={description}
  loading="lazy"
  responsive={true}
  optimize={true}
/>
```

### 2. Store Factory Implementation
**Current State**: Repeated store patterns
**Target State**: Using createResourceStore factory

```typescript
// Before: Manual implementation
export const messagesStore = {
  subscribe,
  load: async () => { /* custom logic */ },
  create: async () => { /* custom logic */ }
}

// After: Using factory
export const messagesStore = createResourceStore<Message>('messages', {
  orderBy: 'created_at',
  filter: { deleted: false }
})
```

### 3. Form Validation Standardization
**Current State**: Mixed validation approaches
**Target State**: Consistent superforms + zod pattern

```typescript
// Before: Custom validation
if (!title || title.length < 3) {
  errors.title = 'Title too short'
}

// After: Schema validation
const listingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  price: z.number().positive('Price must be positive')
})
```

### 4. API Error Handling
**Current State**: Inconsistent error handling
**Target State**: Standardized ApiError pattern

```typescript
// Before: Mixed approaches
try {
  const res = await fetch('/api/listings')
  if (!res.ok) throw new Error('Failed')
} catch (e) {
  console.error(e)
}

// After: Consistent pattern
try {
  const data = await apiRequest<Listing[]>('/api/listings')
  return data
} catch (error) {
  if (error instanceof ApiError) {
    handleApiError(error)
  }
}
```

## Refactoring Principles

1. **Maintain Functionality**: Never break existing features
2. **Incremental Changes**: Small, testable steps
3. **Update References**: Fix all imports and usages
4. **Document Changes**: Explain what and why
5. **Test Thoroughly**: Verify nothing breaks

## Output Format

```markdown
## Refactoring Plan: [Component/Feature Name]

### Current Issues
- Issue 1: Description
- Issue 2: Description

### Proposed Changes
1. Step 1: Description
2. Step 2: Description

### Implementation

#### Before
```code
// Current implementation
```

#### After
```code
// Refactored implementation
```

### Migration Steps
1. Create new implementation
2. Update imports in X files
3. Test functionality
4. Remove old implementation

### Testing Checklist
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Performance verified
- [ ] Accessibility checked

### Impact Analysis
- **Files affected**: X
- **Breaking changes**: None/List
- **Performance impact**: Positive/Neutral
- **Bundle size**: -X KB
```