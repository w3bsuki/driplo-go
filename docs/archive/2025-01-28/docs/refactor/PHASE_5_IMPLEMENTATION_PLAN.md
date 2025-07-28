# Phase 5 Implementation Plan: Code Quality & Structure

## Current Status

### ✅ Completed
1. **Duplicate Utilities Removal** - All major duplicates eliminated
2. **Naming Conventions Phase 1** - 58 UI components renamed to PascalCase

### 🚧 In Progress
- Naming conventions standardization (4 more phases)

### 📋 Pending Tasks
1. **Naming Conventions** (Phases 2-5)
2. **TypeScript Coverage** - 1411 errors to address
3. **Error Handling & Logging**
4. **TODO Comments Review** - 8 items
5. **Commented Code Cleanup** - 190 files

## Critical Analysis

### 🚨 High Priority Issues

1. **TypeScript Errors (1411!)**
   - Missing types in .js files (currency.js, date.js, regions.js)
   - Type mismatches in components
   - Implicit 'any' parameters
   - This is blocking type safety across the entire codebase

2. **Event Handler Naming Chaos**
   - Mix of `onEvent`, `handleEvent`, and plain names
   - Inconsistent prop interfaces
   - Makes component APIs unpredictable

3. **No Error Handling Infrastructure**
   - Using console.error everywhere
   - No error boundaries
   - No monitoring/logging service
   - Production errors are invisible

## Implementation Strategy

### Phase 5.2: Event Handler Naming Standardization

**Goal**: Establish consistent event naming patterns

**Conventions**:
```typescript
// Props (what parent passes): onEventName
interface Props {
  onSubmit: () => void;
  onClick: (e: MouseEvent) => void;
  onChange: (value: string) => void;
}

// Internal handlers: handleEventName
function handleSubmit() {
  // validate...
  props.onSubmit();
}

// DOM events: handleElementEvent
<button onclick={handleButtonClick}>
```

**Implementation Steps**:
1. Extend `standardize-naming.js` script with Phase 2
2. Scan for all event-related props and functions
3. Create rename map following conventions
4. Update all components systematically
5. Update TypeScript interfaces

**Files to Update** (estimated ~50-60 components):
- All form components (CreateListingForm/, auth forms, etc.)
- Interactive components (dropdowns, modals, etc.)
- Layout components with interactions

### Phase 5.3: Critical TypeScript Fixes

**Goal**: Reduce errors from 1411 to <100

**Priority Fixes**:
1. **Convert critical .js files to .ts**:
   - `currency.js` → `currency.ts`
   - `date.js` → `date.ts`
   - `regions.js` → `regions.ts`
   - `i18n.js` → `i18n.ts`

2. **Fix RPC type mismatch**:
   - `get_category_top_sellers` vs `get_top_category_sellers`
   - Update either the database function or the code

3. **Add missing component prop types**:
   - Create proper interfaces for all component props
   - Replace implicit 'any' with explicit types

4. **Fix unused imports**:
   - Remove or use imported symbols
   - Clean up development artifacts

**Migration Strategy**:
```typescript
// Before (currency.js)
export function formatCurrency(amount, locale) {
  const currency = locale === 'bg' ? 'BGN' : 'USD';
  ...
}

// After (currency.ts)
export function formatCurrency(amount: number, locale: string): string {
  const currency = locale === 'bg' ? 'BGN' : 'USD';
  ...
}
```

### Phase 5.4: Basic Error Handling Service

**Goal**: Replace console.error with proper logging

**Implementation**:
```typescript
// src/lib/services/logger.ts
export interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

export class Logger {
  private static instance: Logger;
  
  log(level: LogLevel, message: string, data?: any) {
    // In development: console
    // In production: could send to monitoring service
    
    if (import.meta.env.DEV) {
      console[level](message, data);
    } else {
      // Queue for batch sending to monitoring
      this.logQueue.push({ level, message, data, timestamp: Date.now() });
    }
  }
  
  error(message: string, error?: Error) {
    this.log('error', message, {
      stack: error?.stack,
      message: error?.message
    });
  }
}

export const logger = Logger.getInstance();
```

**Replace Pattern**:
```typescript
// Before
console.error('Failed to fetch listings:', error);

// After
logger.error('Failed to fetch listings', error);
```

### Phase 5.5: TODO Documentation

**Quick Win**: Document all 8 TODOs in a single file

Create `docs/refactor/TODO_DECISIONS_NEEDED.md`:
- List each TODO with context
- Explain what decision is needed
- Suggest recommended approach
- Mark priority level

## Execution Order

### Week 1 (Immediate)
1. **Day 1-2**: Event handler naming (Phase 5.2)
   - Update script
   - Run migration
   - Test thoroughly
   
2. **Day 3-4**: Critical TypeScript fixes
   - Convert .js utilities to .ts
   - Fix RPC type mismatch
   - Add basic prop interfaces

3. **Day 5**: Logger service
   - Implement basic logger
   - Replace high-impact console.errors
   - Add error boundaries to critical components

### Week 2 (Follow-up)
1. Complete remaining naming phases (3-5)
2. Continue TypeScript improvements
3. Expand error handling
4. Review and document TODOs

## Success Metrics

### Immediate Goals
- [ ] Event handler naming consistent across all components
- [ ] TypeScript errors reduced to <500
- [ ] Logger service implemented and used in 10+ files
- [ ] All 8 TODOs documented

### End State Goals
- [ ] All naming conventions standardized
- [ ] TypeScript errors <100 (only legitimate complex types)
- [ ] Comprehensive error handling in place
- [ ] Clean, maintainable codebase

## Risk Mitigation

1. **Breaking Changes**
   - Run full test suite after each phase
   - Test all major user flows manually
   - Keep changes atomic and reversible

2. **Import Errors**
   - Use automated tools to update imports
   - Verify build after each batch of changes
   - Have rollback plan ready

3. **Type Safety Issues**
   - Start with 'unknown' instead of 'any' when unsure
   - Add types incrementally
   - Don't block on perfect types initially

## Next Immediate Action

Run Phase 2 of the naming standardization script to fix event handler naming. This maintains momentum from Phase 1 and addresses a significant consistency issue.

```bash
# Extend the script first, then:
node scripts/standardize-naming.js --phase=2
```