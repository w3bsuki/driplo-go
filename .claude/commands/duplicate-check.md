# /duplicate-check - Duplicate Detection Command

Checks for duplicate code, components, and functionality in the Driplo project.

## Usage
```
/duplicate-check [scope]
```

## Options
- `components` - Check for duplicate components
- `functions` - Check for duplicate utility functions
- `styles` - Check for duplicate CSS/Tailwind classes
- `api` - Check for duplicate API endpoints
- `types` - Check for duplicate type definitions

## What it does:
1. **Component Duplication**
   - Identifies similar components
   - Finds overlapping functionality
   - Suggests consolidation opportunities
   - Maps component relationships

2. **Function Duplication**
   - Detects similar utility functions
   - Identifies repeated logic patterns
   - Suggests shared utilities
   - Reviews helper functions

3. **Style Duplication**
   - Finds repeated Tailwind patterns
   - Identifies similar component styles
   - Suggests style consolidation
   - Reviews theme consistency

4. **API Duplication**
   - Detects similar endpoints
   - Identifies repeated queries
   - Suggests API consolidation
   - Reviews data fetching patterns

5. **Type Duplication**
   - Finds similar type definitions
   - Identifies overlapping interfaces
   - Suggests type unification
   - Reviews type inheritance

## Examples:
```
/duplicate-check components
/duplicate-check functions formatPrice
/duplicate-check styles button
/duplicate-check api listings
/duplicate-check types User Profile
```

## Known Duplicates in Driplo:
- **Image Components**: OptimizedImage, ResponsiveImage, Image.svelte
- **Form Validation**: Multiple validation patterns across forms
- **API Utils**: Repeated error handling patterns
- **Button Styles**: Similar button styling across components

## Output Format:
- **Duplicates Found**: List of similar code
- **Similarity Score**: Percentage match
- **Impact**: Files and components affected
- **Recommendation**: How to consolidate
- **Example**: Code snippet showing consolidation