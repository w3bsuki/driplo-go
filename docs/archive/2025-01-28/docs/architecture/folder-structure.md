# Project Folder Structure

## Root Directory
```
driplo-blue-main/
├── src/                    # Source code
├── static/                 # Static assets
├── supabase/              # Database migrations and config
├── docs/                  # Documentation
├── tests/                 # Test files
├── .svelte-kit/           # SvelteKit generated files (gitignored)
├── node_modules/          # Dependencies (gitignored)
└── [config files]         # Various configuration files
```

## Source Directory Structure
```
src/
├── app.html               # HTML template
├── app.css                # Global styles and design tokens
├── app.d.ts               # Global TypeScript definitions
├── hooks.server.ts        # Server hooks (auth, etc.)
├── lib/                   # Shared code
│   ├── components/        # Reusable components
│   ├── stores/           # Svelte stores
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript types
│   ├── schemas/          # Validation schemas
│   └── server/           # Server-only utilities
└── routes/               # SvelteKit routes
```

## Components Organization
```
src/lib/components/
├── ui/                    # Base UI components (shadcn-ui)
│   ├── button.svelte
│   ├── input.svelte
│   ├── card.svelte
│   └── ...
├── layout/               # Layout components
│   ├── Header.svelte
│   ├── Footer.svelte
│   └── Navigation.svelte
├── listings/             # Listing-related components
│   ├── ListingCard.svelte
│   ├── ListingGrid.svelte
│   └── CreateListingForm.svelte
├── auth/                 # Authentication components
│   ├── LoginForm.svelte
│   └── RegisterForm.svelte
└── shared/              # Shared/common components
    ├── SEO.svelte
    └── ErrorBoundary.svelte
```

## Routes Structure
```
src/routes/
├── +layout.svelte        # Root layout
├── +layout.server.ts     # Root server data
├── +page.svelte          # Homepage
├── +error.svelte         # Error page
├── (app)/                # App routes (with auth)
│   ├── dashboard/
│   ├── listings/
│   ├── profile/
│   └── settings/
├── (auth)/               # Auth routes
│   ├── login/
│   ├── register/
│   └── callback/
├── (category)/           # Category routes
│   └── [category]/
└── api/                  # API endpoints
    ├── webhooks/
    └── upload/
```

## Naming Conventions

### Files
- **Components**: PascalCase (e.g., `ListingCard.svelte`)
- **Utilities**: camelCase (e.g., `formatCurrency.ts`)
- **Types**: PascalCase with `.types.ts` suffix
- **Schemas**: camelCase with `.schema.ts` suffix
- **Server files**: Include `.server.ts` suffix

### Directories
- Use lowercase with hyphens for multi-word names
- Group by feature, not by file type
- Use route groups `(name)` for organization without affecting URLs

## Import Aliases
Always use `$lib/*` imports:
```typescript
// ✅ Good
import { Button } from '$lib/components/ui/button.svelte';
import { formatCurrency } from '$lib/utils/format';

// ❌ Bad
import { Button } from '../../../components/ui/button.svelte';
import { Button } from './button.svelte';
```

## Special Files

### Route Files
- `+page.svelte` - Page component
- `+page.server.ts` - Server-side data loading
- `+page.ts` - Universal data loading (rarely used)
- `+layout.svelte` - Layout component
- `+error.svelte` - Error boundary
- `+server.ts` - API endpoint

### Configuration Files
- `.env.local` - Local environment variables
- `.env.example` - Example environment variables
- `tailwind.config.js` - Tailwind configuration
- `vite.config.js` - Vite configuration
- `svelte.config.js` - SvelteKit configuration

## Best Practices
1. **Colocate related files** - Keep components with their styles, tests
2. **Use route groups** - Organize without affecting URLs
3. **Separate concerns** - Server code in `.server.ts` files
4. **Consistent naming** - Follow conventions strictly
5. **Avoid deep nesting** - Max 3-4 levels deep
6. **Feature-based structure** - Group by feature, not file type