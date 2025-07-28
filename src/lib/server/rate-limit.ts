import type { RequestEvent } from '@sveltejs/kit';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  message?: string; // Custom error message
}

interface RateLimitStore {
  requests: number;
  resetTime: number;
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitStore>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, max, message = 'Too many requests' } = config;

  return async function rateLimit(event: RequestEvent): Promise<Response | null> {
    // Get client identifier (IP address or user ID)
    const clientIp = event.getClientAddress();
    const userId = event.locals.session?.user?.id;
    const identifier = userId || clientIp;
    
    const now = Date.now();
    const resetTime = now + windowMs;

    // Get or create rate limit entry
    let limitData = rateLimitStore.get(identifier);
    
    if (!limitData || limitData.resetTime < now) {
      // Create new window
      limitData = {
        requests: 1,
        resetTime
      };
      rateLimitStore.set(identifier, limitData);
    } else {
      // Increment request count
      limitData.requests++;
    }

    // Check if limit exceeded
    if (limitData.requests > max) {
      const retryAfter = Math.ceil((limitData.resetTime - now) / 1000);
      
      return new Response(JSON.stringify({ error: message }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(limitData.resetTime).toISOString()
        }
      });
    }

    // Add rate limit headers to help clients
    event.setHeaders({
      'X-RateLimit-Limit': max.toString(),
      'X-RateLimit-Remaining': (max - limitData.requests).toString(),
      'X-RateLimit-Reset': new Date(limitData.resetTime).toISOString()
    });

    return null; // Continue with request
  };
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  // Strict limit for payment endpoints
  payment: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: 'Too many payment requests. Please try again later.'
  }),
  
  // Moderate limit for API endpoints
  api: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'Too many API requests. Please try again later.'
  }),
  
  // Strict limit for authentication
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again later.'
  }),
  
  // Very strict limit for webhooks (per IP)
  webhook: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 webhook calls per minute per IP
    message: 'Webhook rate limit exceeded.'
  }),
  
  // Rate limit for image uploads
  upload: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 uploads per minute
    message: 'Too many upload requests. Please wait a moment before uploading more images.'
  })
};