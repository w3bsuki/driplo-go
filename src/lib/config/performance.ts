/**
 * Performance optimization configuration
 * Manages code splitting, lazy loading, and bundle optimization strategies
 */

// Routes that should be preloaded based on user behavior
export const ROUTE_PRELOAD_CONFIG = {
    // Preload after initial page load
    delayedPreload: [
        { route: '/messages', delay: 3000 },
        { route: '/sell', delay: 5000 }
    ],
    
    // Preload on hover/focus of navigation links
    hoverPreload: [
        '/checkout',
        '/profile',
        '/listings'
    ],
    
    // Routes that should never be preloaded (admin, etc)
    excludePreload: [
        '/admin',
        '/api'
    ]
};

// Component lazy loading configuration
export const LAZY_COMPONENTS = {
    // Heavy components that should always be lazy loaded
    alwaysLazy: [
        'CreateListingForm',
        'CheckoutFlow',
        'ProfileSetupWizard',
        'MessageThread'
    ],
    
    // Components to preload based on route
    routeBasedPreload: {
        '/': ['HeroSearch', 'ListingGrid'],
        '/messages': ['MessageThread', 'ConversationList'],
        '/sell': ['CreateListingForm'],
        '/profile': ['ProfileSettings', 'OrderHistory']
    }
};

// Image optimization settings
export const IMAGE_CONFIG = {
    // Lazy load images below the fold
    lazyLoadOffset: '50px',
    
    // Image formats to use
    formats: ['webp', 'avif'],
    
    // Breakpoints for responsive images
    breakpoints: [320, 640, 768, 1024, 1280, 1536],
    
    // Quality settings
    quality: {
        thumbnail: 70,
        standard: 85,
        high: 90
    }
};

// Third-party script loading configuration
export const SCRIPT_LOADING = {
    // Scripts to load immediately
    critical: [
        'supabase-auth'
    ],
    
    // Scripts to defer
    deferred: [
        'analytics',
        'monitoring'
    ],
    
    // Scripts to load on interaction
    interaction: [
        'stripe',
        'turnstile'
    ]
};

// Bundle size targets
export const BUNDLE_TARGETS = {
    // Initial load (critical path)
    initial: {
        js: 150, // KB
        css: 50  // KB
    },
    
    // Total application
    total: {
        js: 400,  // KB
        css: 100  // KB
    },
    
    // Individual chunk limits
    chunk: {
        vendor: 100,  // KB
        feature: 50   // KB
    }
};

// Performance monitoring thresholds
export const PERFORMANCE_METRICS = {
    // Core Web Vitals targets
    LCP: 2500,  // Largest Contentful Paint (ms)
    FID: 100,   // First Input Delay (ms)
    CLS: 0.1,   // Cumulative Layout Shift
    
    // Custom metrics
    TTI: 3500,  // Time to Interactive (ms)
    FCP: 1800   // First Contentful Paint (ms)
};

// Resource hints configuration
export const RESOURCE_HINTS = {
    // DNS prefetch for external domains
    dnsPrefetch: [
        'https://cdn.supabase.co',
        'https://js.stripe.com'
    ],
    
    // Preconnect for critical domains
    preconnect: [
        { url: 'https://cdn.supabase.co', crossorigin: true },
        { url: 'https://fonts.googleapis.com', crossorigin: true }
    ],
    
    // Prefetch critical resources
    prefetch: [
        '/api/categories',
        '/api/featured'
    ]
};