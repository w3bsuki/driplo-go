import type { RequestEvent } from '@sveltejs/kit';
import { createAdminClient } from './supabase-admin';

interface RateLimitConfig {
  windowMinutes: number; // Time window in minutes
  max: number; // Max requests per window
  message?: string; // Custom error message
  action: string; // Action identifier (auth, api, payment, etc.)
}

interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  resetAt: string;
  retryAfterSeconds: number;
}

export function createDatabaseRateLimiter(config: RateLimitConfig) {
  const { windowMinutes, max, message = 'Too many requests', action } = config;

  return async function rateLimit(event: RequestEvent): Promise<Response | null> {
    try {
      // Get client identifier (IP address or user ID)
      const clientIp = event.getClientAddress();
      const userId = event.locals.session?.user?.id;
      const identifier = userId || clientIp;
      
      // Check rate limit using database function
      const supabaseAdmin = createAdminClient();
      const { data, error } = await supabaseAdmin
        .rpc('check_rate_limit', {
          p_identifier: identifier,
          p_action: action,
          p_max_requests: max,
          p_window_minutes: windowMinutes
        });

      if (error) {
        console.error('Rate limit check error:', error);
        // On error, allow the request but log it
        return null;
      }

      const result = data as RateLimitResult;

      // Check if limit exceeded
      if (!result.allowed) {
        return new Response(JSON.stringify({ error: message }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': result.retryAfterSeconds.toString(),
            'X-RateLimit-Limit': max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetAt
          }
        });
      }

      // Add rate limit headers to help clients
      const remaining = Math.max(0, max - result.currentCount);
      event.setHeaders({
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': result.resetAt
      });

      return null; // Continue with request
    } catch (err) {
      console.error('Rate limiter error:', err);
      // On error, allow the request but log it
      return null;
    }
  };
}

// Pre-configured rate limiters for different endpoints
export const databaseRateLimiters = {
  // Strict limit for payment endpoints
  payment: createDatabaseRateLimiter({
    windowMinutes: 1, // 1 minute
    max: 10, // 10 requests per minute
    message: 'Too many payment requests. Please try again later.',
    action: 'payment'
  }),
  
  // Moderate limit for API endpoints
  api: createDatabaseRateLimiter({
    windowMinutes: 1, // 1 minute
    max: 60, // 60 requests per minute
    message: 'Too many API requests. Please try again later.',
    action: 'api'
  }),
  
  // Strict limit for authentication
  auth: createDatabaseRateLimiter({
    windowMinutes: 15, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again later.',
    action: 'auth'
  }),
  
  // Very strict limit for webhooks (per IP)
  webhook: createDatabaseRateLimiter({
    windowMinutes: 1, // 1 minute
    max: 100, // 100 webhook calls per minute per IP
    message: 'Webhook rate limit exceeded.',
    action: 'webhook'
  }),
  
  // Rate limit for image uploads
  upload: createDatabaseRateLimiter({
    windowMinutes: 1, // 1 minute
    max: 20, // 20 uploads per minute
    message: 'Too many upload requests. Please wait a moment before uploading more images.',
    action: 'upload'
  })
};

// Function to clean up expired rate limits (call this periodically)
export async function cleanupExpiredRateLimits() {
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.rpc('cleanup_expired_rate_limits');
    
    if (error) {
      console.error('Failed to cleanup rate limits:', error);
      return 0;
    }
    
    return data || 0;
  } catch (err) {
    console.error('Cleanup error:', err);
    return 0;
  }
}