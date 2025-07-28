import { json, type RequestEvent } from '@sveltejs/kit';
import { logError, getErrorMessage, type AppError } from '$lib/utils/error-handling';
import { dev } from '$app/environment';

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
    errorId?: string;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    version?: string;
  };
}

/**
 * API error with status code
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Create a successful API response
 */
export function apiSuccess<T>(data: T, meta?: Partial<ApiResponse['meta']>): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0',
      ...meta
    }
  };
  
  return json(response);
}

/**
 * Create an error API response
 */
export function apiError(
  error: string | Error | ApiError,
  status: number = 500,
  event?: RequestEvent,
  details?: any
): Response {
  const errorId = `api-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  let message: string;
  let code: string | undefined;
  let errorDetails: any = details;
  
  if (error instanceof ApiError) {
    message = error.message;
    status = error.status;
    code = error.code;
    errorDetails = error.details || details;
  } else if (error instanceof Error) {
    message = getErrorMessage(error);
    code = (error as any).code;
  } else {
    message = String(error);
  }
  
  // Log error with context
  if (event) {
    logError(error, {
      handler: 'apiError',
      url: event.url.pathname,
      method: event.request.method,
      status,
      errorId,
      userAgent: event.request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });
  }
  
  const response: ApiResponse = {
    success: false,
    error: {
      message: dev ? message : getErrorMessage(error),
      code,
      errorId,
      ...(dev && errorDetails ? { details: errorDetails } : {})
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
  };
  
  return json(response, { status });
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function withErrorHandling<T = any>(
  handler: (event: RequestEvent) => Promise<Response>
) {
  return async (event: RequestEvent): Promise<Response> => {
    try {
      return await handler(event);
    } catch (error) {
      // Handle known API errors
      if (error instanceof ApiError) {
        return apiError(error, error.status, event);
      }
      
      // Handle Supabase errors
      if (error && typeof error === 'object' && 'message' in error) {
        const supabaseError = error as any;
        
        // Authentication errors
        if (supabaseError.message?.includes('JWT') || supabaseError.code === 'PGRST301') {
          return apiError('Authentication required', 401, event);
        }
        
        // Permission errors
        if (supabaseError.code === 'PGRST116' || supabaseError.message?.includes('permission')) {
          return apiError('Permission denied', 403, event);
        }
        
        // Rate limiting
        if (supabaseError.code === '429' || supabaseError.message?.includes('rate limit')) {
          return apiError('Too many requests', 429, event);
        }
        
        // Database constraint errors
        if (supabaseError.code?.startsWith('23')) {
          return apiError('Data validation error', 400, event);
        }
      }
      
      // Generic error handling
      console.error('Unhandled API error:', error);
      return apiError(
        dev ? error : 'Internal server error',
        500,
        event,
        dev ? { stack: (error as Error)?.stack } : undefined
      );
    }
  };
}

/**
 * Validate request method
 */
export function validateMethod(event: RequestEvent, allowedMethods: string[]): void {
  if (!allowedMethods.includes(event.request.method)) {
    throw new ApiError(
      `Method ${event.request.method} not allowed`,
      405,
      'METHOD_NOT_ALLOWED'
    );
  }
}

/**
 * Validate required body fields
 */
export async function validateBody<T = any>(
  event: RequestEvent,
  requiredFields: string[] = []
): Promise<T> {
  let body: any;
  
  try {
    body = await event.request.json();
  } catch (error) {
    throw new ApiError('Invalid JSON in request body', 400, 'INVALID_JSON');
  }
  
  // Check required fields
  const missingFields = requiredFields.filter(field => !(field in body));
  if (missingFields.length > 0) {
    throw new ApiError(
      `Missing required fields: ${missingFields.join(', ')}`,
      400,
      'MISSING_FIELDS',
      { missingFields }
    );
  }
  
  return body as T;
}

/**
 * Validate authentication
 */
export async function validateAuth(event: RequestEvent): Promise<{ user: any; session: any }> {
  const { user, session } = await event.locals.safeGetSession();
  
  if (!user || !session) {
    throw new ApiError('Authentication required', 401, 'UNAUTHENTICATED');
  }
  
  return { user, session };
}

/**
 * Rate limiting helper (to be used with database rate limiter)
 */
export async function checkRateLimit(
  event: RequestEvent,
  identifier: string,
  limit: number = 60,
  window: number = 60000
): Promise<void> {
  // This would integrate with your database rate limiter
  // For now, just a placeholder
  const userAgent = event.request.headers.get('user-agent') || 'unknown';
  const ip = event.getClientAddress();
  
  // In a real implementation, you'd check against your rate limiting storage
  // and throw an ApiError if limit exceeded
}

/**
 * CORS helper for API routes
 */
export function setCorsHeaders(response: Response, origins: string[] = ['*']): Response {
  if (origins.includes('*')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
  } else {
    // In production, you'd check the Origin header against allowed origins
    response.headers.set('Access-Control-Allow-Origin', origins[0]);
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}