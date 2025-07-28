import { dev } from '$app/environment';

// Sentry configuration constants
export const SENTRY_CONFIG = {
  // Environment configuration
  environment: dev ? 'development' : (import.meta.env.VERCEL_ENV || 'production'),
  
  // Sample rates
  tracesSampleRate: dev ? 1.0 : 0.1, // 100% in dev, 10% in production
  profilesSampleRate: dev ? 1.0 : 0.1, // 100% in dev, 10% in production
  replaysSessionSampleRate: dev ? 1.0 : 0.1, // 100% in dev, 10% in production
  replaysOnErrorSampleRate: 1.0, // Always capture replays on errors
  
  // User privacy
  sendDefaultPii: false, // Don't send personally identifiable information by default
  
  // Release tracking
  release: import.meta.env.VERCEL_GIT_COMMIT_SHA || 'development',
  
  // Error filtering
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'chrome-extension://',
    'moz-extension://',
    
    // Common non-errors
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured',
    
    // Network errors that are expected
    'NetworkError',
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    
    // User-caused errors
    'NotAllowedError: Permission denied',
    'NotAllowedError: The request is not allowed',
    
    // Safari specific
    'Non-Error promise rejection captured with value: Object Not Found Matching Id',
  ],
  
  // Transaction filtering
  ignoreTransactions: [
    // Health check endpoints
    '/api/health',
    '/api/health/all',
    
    // Static assets
    '/_app/',
    '/favicon',
    
    // External resources
    'https://cdn.supabase.co',
    'https://js.stripe.com',
  ],
  
  // Integrations configuration
  integrations: {
    // HTTP integration
    http: {
      tracing: true,
      breadcrumbs: true,
    },
    
    // Replay integration
    replay: {
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: false,
      
      // Privacy - mask sensitive elements
      mask: [
        '[data-sentry-mask]',
        'input[type="password"]',
        'input[type="email"]',
        'input[type="tel"]',
        'input[name*="card"]',
        'input[name*="cvv"]',
        '.stripe-card-element',
      ],
      
      // Don't record these elements at all
      block: [
        '[data-sentry-block]',
        '.sensitive-data',
      ],
    },
  },
  
  // Before send hook for additional filtering
  beforeSend: (event: any, hint: any) => {
    // Filter out 404 errors
    if (event.exception?.values?.[0]?.value?.includes('404')) {
      return null;
    }
    
    // Filter out expected authentication errors
    if (event.exception?.values?.[0]?.value?.includes('Invalid login credentials')) {
      return null;
    }
    
    // Remove sensitive data from URLs
    if (event.request?.url) {
      event.request.url = event.request.url.replace(/\/api\/auth\/.*/, '/api/auth/[redacted]');
      event.request.url = event.request.url.replace(/payment_intent_[^/]+/, 'payment_intent_[redacted]');
    }
    
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
      delete event.request.headers['x-supabase-auth'];
    }
    
    // Remove sensitive data from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb: any) => {
        if (breadcrumb.data?.url) {
          breadcrumb.data.url = breadcrumb.data.url.replace(/\/api\/auth\/.*/, '/api/auth/[redacted]');
        }
        if (breadcrumb.data?.request?.headers) {
          delete breadcrumb.data.request.headers['authorization'];
          delete breadcrumb.data.request.headers['cookie'];
        }
        return breadcrumb;
      });
    }
    
    return event;
  },
  
  // Before send transaction hook
  beforeSendTransaction: (event: any) => {
    // Filter out health checks and static assets
    if (event.transaction?.includes('/api/health') || 
        event.transaction?.includes('/_app/')) {
      return null;
    }
    
    // Sanitize transaction names
    if (event.transaction) {
      // Remove IDs from URLs
      event.transaction = event.transaction
        .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '/[id]')
        .replace(/\/\d+/g, '/[id]');
    }
    
    return event;
  },
};

// Helper to set user context
export function setSentryUser(user: any) {
  if (typeof window !== 'undefined' && window.Sentry) {
    if (user) {
      window.Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
        account_type: user.account_type,
      });
    } else {
      window.Sentry.setUser(null);
    }
  }
}

// Helper to add breadcrumb
export function addSentryBreadcrumb(message: string, category: string, data?: any) {
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.addBreadcrumb({
      message,
      category,
      level: 'info',
      timestamp: Date.now() / 1000,
      data,
    });
  }
}

// Helper to capture custom event
export function captureSentryMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', extra?: any) {
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureMessage(message, {
      level,
      extra,
    });
  }
}

// Helper to capture exception with context
export function captureSentryException(error: any, context?: any) {
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureException(error, {
      contexts: {
        custom: context,
      },
    });
  }
}

// Helper to start a transaction
export function startSentryTransaction(name: string, op: string) {
  if (typeof window !== 'undefined' && window.Sentry) {
    return window.Sentry.startTransaction({
      name,
      op,
    });
  }
  return null;
}

// Type definitions for window.Sentry
declare global {
  interface Window {
    Sentry: any;
  }
}