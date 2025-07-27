# Tailwind v4 Component Class Mapping Guide

## Color Class Mappings

### Primary Colors
| Old Class (HSL) | New Class (Token) | Usage |
|-----------------|-------------------|--------|
| `bg-primary` | `bg-brand-500` | Primary buttons, CTAs |
| `hover:bg-primary/90` | `hover:bg-brand-600` | Primary hover states |
| `text-primary` | `text-brand-500` | Primary text color |
| `text-primary-foreground` | `text-white` | Text on primary bg |
| `border-primary` | `border-brand-500` | Primary borders |
| `ring-primary` | `ring-brand-500` | Focus rings |

### Secondary Colors
| Old Class (HSL) | New Class (Token) | Usage |
|-----------------|-------------------|--------|
| `bg-secondary` | `bg-gray-100` | Secondary backgrounds |
| `hover:bg-secondary/80` | `hover:bg-gray-200` | Secondary hover |
| `text-secondary` | `text-gray-600` | Secondary text |
| `text-secondary-foreground` | `text-gray-900` | Text on secondary bg |
| `border-secondary` | `border-gray-300` | Secondary borders |

### Semantic Colors
| Old Class (HSL) | New Class (Token) | Usage |
|-----------------|-------------------|--------|
| `bg-destructive` | `bg-error-500` | Error states, delete buttons |
| `text-destructive` | `text-error-500` | Error text |
| `text-destructive-foreground` | `text-white` | Text on destructive bg |
| `bg-success` | `bg-success-500` | Success states |
| `text-success-foreground` | `text-white` | Text on success bg |
| `bg-warning` | `bg-warning-500` | Warning states |
| `text-warning-foreground` | `text-gray-900` | Text on warning bg |

### Neutral Colors
| Old Class (HSL) | New Class (Token) | Usage |
|-----------------|-------------------|--------|
| `bg-background` | `bg-white` | Main backgrounds |
| `text-foreground` | `text-gray-900` | Main text color |
| `bg-card` | `bg-white` | Card backgrounds |
| `text-card-foreground` | `text-gray-900` | Card text |
| `bg-popover` | `bg-white` | Popover backgrounds |
| `text-popover-foreground` | `text-gray-900` | Popover text |
| `bg-muted` | `bg-gray-50` | Muted backgrounds |
| `bg-muted/50` | `bg-gray-50/50` | Semi-transparent muted |
| `text-muted-foreground` | `text-gray-500` | Muted text |

### Accent Colors
| Old Class (HSL) | New Class (Token) | Usage |
|-----------------|-------------------|--------|
| `bg-accent` | `bg-brand-500` | Accent elements |
| `text-accent-foreground` | `text-white` | Text on accent bg |

### Border & Input Colors
| Old Class (HSL) | New Class (Token) | Usage |
|-----------------|-------------------|--------|
| `border` | `border-gray-200` | Default borders |
| `border-input` | `border-gray-200` | Input borders |
| `ring` | `ring-brand-500` | Focus rings |

### Radius Utilities
| Old Class | New Class | Usage |
|-----------|-----------|--------|
| `rounded-radius` | `rounded-lg` | Default radius (0.5rem) |
| `rounded-radius-sm` | `rounded` | Small radius (0.25rem) |
| `rounded-radius-md` | `rounded-md` | Medium radius (0.375rem) |
| `rounded-radius-lg` | `rounded-lg` | Large radius (0.5rem) |

## Dark Mode Mappings

### Dark Mode Colors
| Old Class (HSL) | New Class (Token) | Usage |
|-----------------|-------------------|--------|
| `dark:bg-background` | `dark:bg-gray-950` | Dark backgrounds |
| `dark:text-foreground` | `dark:text-gray-50` | Dark mode text |
| `dark:bg-card` | `dark:bg-gray-900` | Dark card bg |
| `dark:bg-muted` | `dark:bg-gray-800` | Dark muted bg |
| `dark:border` | `dark:border-gray-800` | Dark borders |

## Component-Specific Mappings

### Button Component
```diff
- <button class="bg-primary text-primary-foreground hover:bg-primary/90">
+ <button class="bg-brand-500 text-white hover:bg-brand-600">

- <button class="bg-secondary text-secondary-foreground">
+ <button class="bg-gray-100 text-gray-900">

- <button class="bg-destructive text-destructive-foreground">
+ <button class="bg-error-500 text-white">
```

### Input Component
```diff
- <input class="border-input bg-background">
+ <input class="border-gray-200 bg-white">

- <input class="focus:ring-ring">
+ <input class="focus:ring-brand-500">
```

### Badge Component
```diff
- <span class="bg-secondary text-secondary-foreground">
+ <span class="bg-gray-100 text-gray-900">

- <span class="bg-destructive text-destructive-foreground">
+ <span class="bg-error-500 text-white">

- <span class="bg-success text-success-foreground">
+ <span class="bg-success-500 text-white">
```

### Card Component
```diff
- <div class="bg-card text-card-foreground border">
+ <div class="bg-white text-gray-900 border-gray-200">
```

### Header Component
```diff
- <header class="bg-background border-b border-border">
+ <header class="bg-white border-b border-gray-200">
```

## Condition Badge Colors (Special Case)
| Old Variable | New Token | Usage |
|--------------|-----------|--------|
| `--color-condition-new` | `bg-success-500` | New condition |
| `--color-condition-very-good` | `bg-warning-500` | Very good condition |
| `--color-condition-good` | `bg-orange-500` | Good condition |
| `--color-condition-fair` | `bg-error-500` | Fair condition |

## Migration Strategy

### Phase 1: Add Compatibility Layer
Create temporary utility classes that map old names to new tokens:
```css
/* Temporary compatibility layer */
.bg-primary { @apply bg-brand-500; }
.text-primary { @apply text-brand-500; }
.bg-secondary { @apply bg-gray-100; }
/* ... etc ... */
```

### Phase 2: Update Components
Update components one by one using the mapping table above.

### Phase 3: Remove Compatibility Layer
Once all components are updated, remove:
1. The HSL variables (lines 69-159)
2. The temporary compatibility classes
3. The HSL-based utilities

## Testing Checklist
- [ ] Button colors (all variants)
- [ ] Form input styling
- [ ] Badge colors (all conditions)
- [ ] Card backgrounds
- [ ] Header styling
- [ ] Focus states
- [ ] Hover states
- [ ] Dark mode
- [ ] Mobile responsive