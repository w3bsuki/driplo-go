import { handleErrorWithSentry, replayIntegration } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';
import { SENTRY_CONFIG } from '$lib/config/sentry';
import type { HandleClientError } from '@sveltejs/kit';
import { initWebVitals } from '$lib/utils/webVitals';

// Try to get Sentry DSN from environment
const PUBLIC_SENTRY_DSN = import.meta.env.PUBLIC_SENTRY_DSN || '';

// Initialize Sentry only if DSN is provided
if (PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: PUBLIC_SENTRY_DSN,
    
    // Environment and release
    environment: SENTRY_CONFIG.environment,
    release: SENTRY_CONFIG.release,
    
    // Sampling rates
    tracesSampleRate: SENTRY_CONFIG.tracesSampleRate,
    profilesSampleRate: SENTRY_CONFIG.profilesSampleRate,
    replaysSessionSampleRate: SENTRY_CONFIG.replaysSessionSampleRate,
    replaysOnErrorSampleRate: SENTRY_CONFIG.replaysOnErrorSampleRate,
    
    // Privacy settings
    sendDefaultPii: SENTRY_CONFIG.sendDefaultPii,
    
    // Error filtering
    ignoreErrors: SENTRY_CONFIG.ignoreErrors,
    ignoreTransactions: SENTRY_CONFIG.ignoreTransactions,
    
    // Integrations
    integrations: [
      replayIntegration(SENTRY_CONFIG.integrations.replay),
      Sentry.browserTracingIntegration({
        // Enable navigation spans
        enableNavigationSpans: true,
        
        // Track initial page load
        enableInitialPageLoadSpan: true,
        
        // Track interactions
        enableInteractions: true,
        
        // Custom routing instrumentation for SvelteKit
        routingInstrumentation: Sentry.svelteKitRoutingInstrumentation(),
        
        // Track Web Vitals as part of transactions
        _experiments: {
          enableInteractions: true,
        },
      }),
      Sentry.httpClientIntegration({
        failedRequestStatusCodes: [[400, 499], [500, 599]],
        failedRequestTargets: [/\/api\//],
      }),
    ],
    
    // Hooks
    beforeSend: SENTRY_CONFIG.beforeSend,
    beforeSendTransaction: SENTRY_CONFIG.beforeSendTransaction,
    
    // Transport options
    transportOptions: {
      // Retry failed requests
      maxRetries: 3,
      
      // Custom headers (if needed)
      headers: {},
    },
    
    // Additional options
    autoSessionTracking: true,
    attachStacktrace: true,
    normalizeDepth: 5,
    maxBreadcrumbs: 100,
    
    // Debug mode in development
    debug: import.meta.env.DEV,
  });
  
  // Set initial user context if available
  const userDataElement = document.getElementById('sentry-user-data');
  if (userDataElement) {
    try {
      const userData = JSON.parse(userDataElement.textContent || '{}');
      if (userData.id) {
        Sentry.setUser({
          id: userData.id,
          email: userData.email,
          username: userData.username,
          account_type: userData.account_type,
        });
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }
}

// Initialize Web Vitals tracking
if (typeof window !== 'undefined') {
  // Wait for the page to be fully loaded before initializing Web Vitals
  if (document.readyState === 'complete') {
    initWebVitals();
  } else {
    window.addEventListener('load', () => {
      // Small delay to ensure all resources are loaded
      setTimeout(initWebVitals, 100);
    });
  }
}

// Handle client-side errors
export const handleError: HandleClientError = handleErrorWithSentry(({ error, event, status, message }) => {
  // Generate unique error ID
  const errorId = `client-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('Client error:', {
      error,
      errorId,
      status,
      message,
      url: event.url.pathname,
    });
  }
  
  // Add custom context to Sentry
  if (PUBLIC_SENTRY_DSN) {
    Sentry.setContext('error_details', {
      errorId,
      url: event.url.pathname,
      status,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Return sanitized error for display
  return {
    message: message || 'An unexpected error occurred',
    errorId,
  };
});