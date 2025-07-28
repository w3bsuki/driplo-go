# Technology Stack

## Frontend Framework
**SvelteKit 2.0** - Full-stack framework with SSR/SSG capabilities
- Server-side rendering for SEO and performance
- File-based routing
- Built-in form actions and data loading
- TypeScript support out of the box

## UI Components
**shadcn-ui** - Copy-paste component library
- Accessible components built on Radix UI primitives
- Fully customizable with Tailwind CSS
- TypeScript support
- No runtime dependencies

## Styling
**Tailwind CSS 3.4** - Utility-first CSS framework
- Design tokens via CSS variables in app.css
- Responsive design utilities
- Dark mode support
- PostCSS for processing

## Backend & Database
**Supabase** - Open source Firebase alternative
- PostgreSQL database with real-time subscriptions
- Built-in authentication (email, social providers)
- Row Level Security (RLS) for authorization
- Storage for images and files
- Edge Functions for serverless compute

## Payment Processing
**Stripe** - Payment infrastructure
- Secure payment processing
- Support for multiple currencies
- Webhook integration for payment events
- Strong Customer Authentication (SCA) compliant

## Deployment
**Vercel** - Deployment platform
- Automatic deployments from Git
- Edge network for global performance
- Environment variable management
- Preview deployments for PRs

## Development Tools
- **TypeScript 5.2** - Type safety and better DX
- **pnpm** - Fast, disk space efficient package manager
- **Vite** - Build tool and dev server
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing framework

## Internationalization
**Paraglide** - i18n solution
- Type-safe translations
- Tree-shakeable messages
- Support for English and Bulgarian

## State Management
**Svelte 5 Stores** - Built-in reactivity
- Runes for reactive state ($state, $derived)
- Context API for component communication
- No external state management needed

## Image Optimization
- Supabase Storage with transformation API
- Lazy loading with native loading="lazy"
- Responsive images with srcset
- WebP format with fallbacks

## Why These Choices?

### SvelteKit over Next.js/Remix
- Smaller bundle sizes
- Better performance out of the box
- Simpler mental model
- Great TypeScript support

### Supabase over custom backend
- Rapid development with built-in auth
- Real-time subscriptions included
- Open source and self-hostable
- Great developer experience

### shadcn-ui over Material UI
- No vendor lock-in
- Fully customizable
- Smaller bundle size
- Better Tailwind integration

### Tailwind over CSS modules
- Consistent design system
- Rapid prototyping
- No CSS naming conflicts
- Great responsive utilities