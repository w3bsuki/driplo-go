import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { Session } from '@supabase/supabase-js';
import type { Tables } from '$lib/types/database.types';
import { z } from 'zod';
import { dev } from '$app/environment';

// Standard API response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
  requestId?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    nextPage?: number | null;
    prevPage?: number | null;
  };
}

// Error types for better error handling
export enum ApiErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL = 'INTERNAL_ERROR'
}

export class ApiError extends Error {
  constructor(
    public override message: string,
    public status: number,
    public type: ApiErrorType,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request context for better logging and debugging
export interface RequestContext {
  requestId: string;
  userId?: string;
  path: string;
  method: string;
  timestamp: string;
  ip?: string;
}

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Enhanced error response helper
export function apiError(
  message: string,
  status: number = 500,
  type: ApiErrorType = ApiErrorType.INTERNAL,
  details?: Record<string, unknown>,
  requestId?: string
) {
  const timestamp = new Date().toISOString();
  
  // Log the full error server-side for debugging
  console.error(`[${timestamp}] API Error [${status}]: ${message}`, {
    type,
    details,
    requestId,
    stack: new Error().stack
  });
  
  // Build client response
  const response: ApiResponse = {
    error: message,
    timestamp,
    requestId: requestId || generateRequestId()
  };
  
  // Only include safe details in development
  if (dev && details && !details['stack'] && !details['password'] && !details['token']) {
    response.details = details;
  }
  
  return json(response, { status });
}

// Enhanced success response helper
export function apiSuccess<T>(
  data: T,
  status: number = 200,
  requestId?: string
) {
  const response: ApiResponse<T> = {
    data,
    timestamp: new Date().toISOString(),
    requestId: requestId || generateRequestId()
  };
  return json(response, { status });
}

// Enhanced authentication check with better error handling
export async function requireAuth(
  locals: RequestEvent['locals'],
  options?: {
    allowExpired?: boolean;
    requireProfile?: boolean;
  }
): Promise<{ userId: string; session: Session; profile?: Tables<'profiles'> } | null> {
  try {
    // First get the session (without validation)
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.warn('No session found:', sessionError);
      return null;
    }
    
    // Check if session is expired (unless explicitly allowed)
    if (!options?.allowExpired && session.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      if (expiresAt < new Date()) {
        console.warn('Session expired:', session.expires_at);
        return null;
      }
    }
    
    // Now validate the JWT by calling getUser()
    const { data: { user }, error: userError } = await locals.supabase.auth.getUser();
    
    if (userError || !user) {
      console.warn('JWT validation failed:', userError);
      return null;
    }
    
    const result: { userId: string; session: Session; profile?: Tables<'profiles'> } = {
      userId: user.id,
      session
    };
    
    // Optionally fetch profile
    if (options?.requireProfile) {
      const { data: profile, error: profileError } = await locals.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profileError || !profile) {
        console.warn('Profile fetch failed:', profileError);
        return null;
      }
      
      result.profile = profile;
    }
    
    return result;
  } catch (error) {
    console.error('Auth check error:', error);
    return null;
  }
}

// Enhanced admin role check
export async function requireAdmin(
  locals: RequestEvent['locals']
): Promise<{ userId: string; session: Session; profile: Tables<'profiles'> } | null> {
  const auth = await requireAuth(locals, { requireProfile: true });
  if (!auth || !auth.profile) return null;
  
  if (auth.profile.role !== 'admin') {
    console.warn(`User ${auth.userId} attempted admin access without permission`);
    return null;
  }
  
  return auth as { userId: string; session: Session; profile: Tables<'profiles'> };
}

// Zod-based request validation
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      throw new ApiError(
        'Invalid request body',
        400,
        ApiErrorType.VALIDATION,
        { errors: result.error.flatten() }
      );
    }
    
    return result.data;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new ApiError(
        'Invalid JSON in request body',
        400,
        ApiErrorType.VALIDATION
      );
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      'Failed to parse request',
      400,
      ApiErrorType.VALIDATION
    );
  }
}

// Common validation schemas
export const schemas = {
  email: z.string().email(),
  uuid: z.string().uuid(),
  revtag: z.string().regex(/^@[a-zA-Z0-9_]+$/),
  positiveNumber: z.number().positive(),
  nonEmptyString: z.string().min(1).trim(),
  pagination: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20)
  }),
  dateRange: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional()
  })
};

// Enhanced pagination helper with validation
export function getPagination(url: URL, defaultLimit = 20) {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || String(defaultLimit))));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

// Enhanced paginated response
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  requestId?: string
): PaginatedResponse<T> {
  const hasNext = page * limit < total;
  const hasPrev = page > 1;
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      hasMore: hasNext,
      nextPage: hasNext ? page + 1 : null,
      prevPage: hasPrev ? page - 1 : null
    },
    timestamp: new Date().toISOString(),
    requestId: requestId || generateRequestId()
  };
}

// Enhanced database error handler with specific error messages
export function handleDatabaseError(error: unknown): never {
  console.error('Database error:', error);
  
  // Supabase/Postgres error codes
  const errorMap: Record<string, { message: string; status: number; type: ApiErrorType }> = {
    '23505': { message: 'This record already exists', status: 409, type: ApiErrorType.CONFLICT },
    '23503': { message: 'Referenced record not found', status: 400, type: ApiErrorType.VALIDATION },
    '23502': { message: 'Required field is missing', status: 400, type: ApiErrorType.VALIDATION },
    '22P02': { message: 'Invalid input format', status: 400, type: ApiErrorType.VALIDATION },
    '22001': { message: 'Input value too long', status: 400, type: ApiErrorType.VALIDATION },
    '42501': { message: 'Insufficient permissions', status: 403, type: ApiErrorType.AUTHORIZATION },
    '42P01': { message: 'Table does not exist', status: 500, type: ApiErrorType.DATABASE },
    '42703': { message: 'Column does not exist', status: 500, type: ApiErrorType.DATABASE },
    'PGRST301': { message: 'Record not found', status: 404, type: ApiErrorType.NOT_FOUND },
    'PGRST116': { message: 'The result contains 0 rows', status: 404, type: ApiErrorType.NOT_FOUND }
  };
  
  // Type guard for database errors
  const dbError = error as { code?: string; hint?: string; details?: unknown };
  
  const errorInfo = (dbError.code && errorMap[dbError.code]) || {
    message: 'Database operation failed',
    status: 500,
    type: ApiErrorType.DATABASE
  };
  
  throw new ApiError(errorInfo.message, errorInfo.status, errorInfo.type, {
    code: dbError.code,
    hint: dbError.hint,
    details: dbError.details
  });
}

// Enhanced rate limiting with Redis-like implementation
class RateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>();
  private cleanupInterval: NodeJS.Timeout;
  
  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }
  
  check(
    key: string,
    limit: number = 10,
    windowMs: number = 60000
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.store.get(key);
    const resetTime = now + windowMs;
    
    if (!record || record.resetTime < now) {
      this.store.set(key, {
        count: 1,
        resetTime
      });
      return { allowed: true, remaining: limit - 1, resetTime };
    }
    
    if (record.count >= limit) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }
    
    record.count++;
    return { allowed: true, remaining: limit - record.count, resetTime: record.resetTime };
  }
  
  reset(key: string) {
    this.store.delete(key);
  }
  
  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (record.resetTime < now) {
        this.store.delete(key);
      }
    }
  }
  
  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

export const rateLimiter = new RateLimiter();

// Rate limit middleware
export function checkRateLimit(
  key: string,
  limit?: number,
  windowMs?: number
): { allowed: boolean; remaining: number; resetTime: number } {
  return rateLimiter.check(key, limit, windowMs);
}

// CORS utility
export function corsHeaders(origin?: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

// Request sanitization
export function sanitizeInput<T extends Record<string, unknown>>(
  input: T,
  allowedFields: string[]
): Partial<T> {
  const sanitized: Partial<T> = {};
  
  for (const field of allowedFields) {
    if (field in input) {
      const value = input[field];
      
      // Basic XSS prevention for strings
      if (typeof value === 'string') {
        sanitized[field as keyof T] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .trim() as T[keyof T];
      } else {
        sanitized[field as keyof T] = value;
      }
    }
  }
  
  return sanitized;
}

// Performance monitoring
export class PerformanceMonitor {
  private startTime: number;
  private marks: Map<string, number> = new Map();
  
  constructor(private context: RequestContext) {
    this.startTime = performance.now();
  }
  
  mark(name: string) {
    this.marks.set(name, performance.now());
  }
  
  measure(name: string, startMark?: string): number {
    const endTime = performance.now();
    const startTime = startMark ? this.marks.get(startMark) || this.startTime : this.startTime;
    const duration = endTime - startTime;
    
    if (dev) {
      console.log(`[${this.context.requestId}] ${name}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
  
  getMetrics() {
    const totalDuration = performance.now() - this.startTime;
    return {
      totalDuration,
      marks: Object.fromEntries(this.marks),
      requestId: this.context.requestId
    };
  }
}

// Create request context
export function createRequestContext(event: RequestEvent): RequestContext {
  return {
    requestId: generateRequestId(),
    path: event.url.pathname,
    method: event.request.method,
    timestamp: new Date().toISOString(),
    ip: event.getClientAddress()
  };
}

// Wrapper for consistent error handling
export async function handleRequest<T>(
  event: RequestEvent,
  handler: (context: RequestContext) => Promise<T>
): Promise<Response> {
  const context = createRequestContext(event);
  const monitor = new PerformanceMonitor(context);
  
  try {
    monitor.mark('handler-start');
    const result = await handler(context);
    monitor.measure('handler', 'handler-start');
    
    if (dev) {
      console.log(`[${context.requestId}] Success:`, monitor.getMetrics());
    }
    
    return apiSuccess(result, 200, context.requestId);
  } catch (err) {
    if (dev) {
      console.error(`[${context.requestId}] Error:`, err, monitor.getMetrics());
    }
    
    if (err instanceof ApiError) {
      return apiError(err.message, err.status, err.type, err.details, context.requestId);
    }
    
    return apiError(
      'Internal server error',
      500,
      ApiErrorType.INTERNAL,
      dev ? { error: err?.toString() } : undefined,
      context.requestId
    );
  }
}

// Batch operation helper
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options?: {
    concurrency?: number;
    onError?: (error: Error, item: T) => void;
  }
): Promise<{ success: R[]; failed: Array<{ item: T; error: Error }> }> {
  const concurrency = options?.concurrency || 5;
  const results: R[] = [];
  const failures: Array<{ item: T; error: Error }> = [];
  
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(item => processor(item))
    );
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        const error = result.reason as Error;
        const item = batch[index];
        failures.push({ item, error });
        options?.onError?.(error, item);
      }
    });
  }
  
  return { success: results, failed: failures };
}

// Export common validators for backward compatibility
export const validators = {
  isNonEmptyString: (value: unknown): value is string => 
    typeof value === 'string' && value.trim().length > 0,
    
  isPositiveNumber: (value: unknown): value is number =>
    typeof value === 'number' && value > 0,
    
  isBoolean: (value: unknown): value is boolean =>
    typeof value === 'boolean',
    
  isArray: <T>(value: unknown, itemValidator?: (item: unknown) => item is T): value is T[] =>
    Array.isArray(value) && (!itemValidator || value.every(itemValidator)),
    
  isObject: (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value)
};

// Validation helpers
export function validateEmail(email: string): boolean {
  return schemas.email.safeParse(email).success;
}

export function validateRevtag(revtag: string): boolean {
  return schemas.revtag.safeParse(revtag).success;
}

export function validateUUID(uuid: string): boolean {
  return schemas.uuid.safeParse(uuid).success;
}

// Legacy function for backward compatibility
export async function parseRequestBody<T>(
  request: Request,
  validator?: (data: unknown) => data is T
): Promise<T> {
  try {
    const body = await request.json();
    
    if (validator && !validator(body)) {
      throw new ApiError('Invalid request body', 400, ApiErrorType.VALIDATION);
    }
    
    return body as T;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new ApiError('Invalid JSON in request body', 400, ApiErrorType.VALIDATION);
    }
    throw err;
  }
}