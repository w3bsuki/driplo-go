# Driplo.bg System Architecture

## Overview

Driplo.bg is a modern e-commerce marketplace built with a focus on performance, security, and developer experience. The architecture follows a client-server model with real-time capabilities.

## Tech Stack

### Frontend
- **Framework**: SvelteKit 2.0 with Svelte 5
- **Styling**: Tailwind CSS v4 with OKLCH color system
- **UI Components**: bits-ui (headless component library)
- **State Management**: Svelte stores and runes
- **Type Safety**: TypeScript with comprehensive interfaces

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with 2FA
- **File Storage**: Supabase Storage
- **Payments**: Stripe
- **Real-time**: Supabase Realtime subscriptions

### Infrastructure
- **Error Tracking**: Sentry
- **Performance Monitoring**: Web Vitals
- **CAPTCHA**: Cloudflare Turnstile
- **Build Tool**: Vite with optimizations
- **Package Manager**: pnpm

## Application Architecture

### Directory Structure
```
src/
├── lib/
│   ├── components/          # UI components
│   │   ├── ui/             # Base UI components (bits-ui)
│   │   ├── auth/           # Authentication components
│   │   ├── listings/       # Listing-related components
│   │   ├── messaging/      # Real-time messaging
│   │   └── checkout/       # Payment flow components
│   ├── server/             # Server-side utilities
│   │   ├── auth.ts         # Auth helpers
│   │   ├── database.ts     # Database queries
│   │   └── stripe.ts       # Payment processing
│   ├── stores/             # Global state management
│   ├── types/              # TypeScript interfaces
│   └── utils/              # Shared utilities
├── routes/                 # SvelteKit pages and API routes
├── hooks.server.ts         # Server middleware
├── hooks.client.ts         # Client initialization
└── app.css                # Global styles and tokens
```

### Component Architecture

#### Design Principles
1. **Modular Components**: Break large components into smaller, focused pieces
2. **Composition Pattern**: Use slots and render props for flexibility
3. **Type Safety**: All props defined with TypeScript interfaces
4. **Lazy Loading**: Heavy components loaded on-demand

#### Component Hierarchy
```
+layout.svelte (App Shell)
├── Header
│   ├── SearchBar
│   ├── Navigation
│   └── UserMenu
├── Main Content (Page Components)
│   ├── ListingGrid
│   ├── ListingCard
│   └── Filters
└── Footer
```

### Data Flow

#### Server-Side Rendering (SSR)
1. All data fetching happens in `+page.server.ts` files
2. RLS policies enforce row-level security
3. Data passed to components via page data

#### Client-Side State
1. Auth state managed by auth context
2. UI state in component-local stores
3. Real-time updates via Supabase subscriptions

### Database Schema

#### Core Tables
- `profiles` - User profiles and settings
- `listings` - Product listings
- `categories` - Product categories
- `orders` - Purchase orders
- `messages` - User messaging
- `favorites` - Wishlist items

#### Key Features
- Row Level Security (RLS) on all tables
- Optimized indexes for common queries
- Full-text search on listings
- Materialized views for performance

### Authentication Flow

1. **Registration**
   - Email/password with CAPTCHA
   - Email verification required
   - Profile setup wizard

2. **Login**
   - Rate-limited authentication
   - Optional 2FA with TOTP
   - Session management via cookies

3. **Authorization**
   - RLS policies for data access
   - Server-side permission checks
   - Role-based access (user/brand/admin)

### Payment Processing

1. **Checkout Flow**
   - Cart management in localStorage
   - Stripe Payment Intents
   - Server-side payment validation

2. **Order Management**
   - Order status tracking
   - Automated seller notifications
   - Refund processing

### Performance Optimizations

#### Build-Time
- Code splitting by route and feature
- Tree shaking and minification
- CSS optimization with Tailwind v4
- Asset optimization and compression

#### Runtime
- Lazy loading for images and components
- Intersection Observer for visibility
- Optimized database queries (no N+1)
- Client-side caching strategies

#### Monitoring
- Web Vitals tracking (LCP, FID, CLS)
- Error boundary protection
- Sentry performance monitoring
- Custom performance metrics

### Security Architecture

#### Client Security
- XSS protection via framework
- CSRF tokens on forms
- Secure cookie settings
- Content Security Policy

#### Server Security
- Input validation and sanitization
- SQL injection prevention via parameterized queries
- Rate limiting on sensitive endpoints
- Authentication middleware

#### Data Security
- Encrypted at rest (Supabase)
- TLS for data in transit
- PII data protection
- GDPR compliance measures

### Deployment Architecture

#### Development
- Local Supabase instance
- Hot module replacement
- TypeScript checking
- ESLint and Prettier

#### Production
- Static site generation where possible
- Edge function deployment
- CDN for static assets
- Database connection pooling

### Scaling Considerations

1. **Database**
   - Read replicas for scaling reads
   - Connection pooling
   - Query optimization
   - Caching layer (future)

2. **Application**
   - Horizontal scaling capability
   - Stateless architecture
   - CDN for global distribution
   - Service worker for offline (future)

3. **Storage**
   - Image optimization pipeline
   - CDN delivery for media
   - Lazy loading strategies
   - Progressive image loading