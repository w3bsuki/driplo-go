# Driplo.bg - Premium Second-Hand Designer Marketplace

A modern e-commerce platform for buying and selling luxury second-hand designer clothing. Built with SvelteKit, Supabase, and Tailwind CSS.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase and Stripe keys

# Start development server
pnpm run dev
```

## 📚 Documentation

### Essential Docs
- **[CLAUDE.md](./CLAUDE.md)** - AI assistant rules and patterns
- **[CONTEXT.md](./CONTEXT.md)** - Current project state and architecture
- **[MEMORY.md](./MEMORY.md)** - Key decisions and learnings
- **[TASK.md](./TASK.md)** - Active work and priorities

### Production Docs
- **[docs/PRODUCTION.md](./docs/PRODUCTION.md)** - Deployment checklist
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System design

## 🛠 Tech Stack

- **Frontend**: SvelteKit 2.0, Svelte 5
- **Styling**: Tailwind CSS v4 with OKLCH colors
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **Error Tracking**: Sentry
- **Type Safety**: TypeScript
- **Testing**: Vitest, Playwright

## 🏗 Project Structure

```
src/
├── lib/
│   ├── components/     # UI components (bits-ui based)
│   ├── server/         # Server utilities
│   ├── stores/         # Svelte stores
│   ├── types/          # TypeScript interfaces
│   └── utils/          # Shared utilities
├── routes/             # SvelteKit pages
├── app.css            # Global styles & tokens
└── hooks.*.ts         # SvelteKit hooks
```

## 🔧 Development

```bash
pnpm run dev       # Start dev server
pnpm run check     # TypeScript check
pnpm run lint      # ESLint
pnpm test          # Run tests
pnpm run build     # Production build
```

## 🚀 Features

- **User Authentication**: Email/password with 2FA support
- **Listing Management**: Create, edit, and manage product listings
- **Advanced Search**: Filter by brand, size, condition, price
- **Real-time Messaging**: Chat between buyers and sellers
- **Secure Payments**: Stripe integration with escrow
- **Image Optimization**: Automatic resizing and CDN delivery
- **Modern UI Components**: Mobile-first navigation, promotional banners, sticky search
- **Performance**: Lazy loading, code splitting, optimized queries

## 🔐 Security

- Server-side validation for all operations
- RLS (Row Level Security) policies
- CAPTCHA protection (Cloudflare Turnstile)
- Rate limiting on sensitive endpoints
- PII data protection and GDPR compliance

## 🤝 Contributing

1. Check `TASK.md` for current priorities
2. Follow patterns in `CLAUDE.md`
3. Use TypeScript interfaces from `/lib/types/`
4. Test thoroughly before submitting
5. Update documentation as needed

## 📄 License

Proprietary - All rights reserved