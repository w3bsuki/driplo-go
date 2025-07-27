import { browser } from '$app/environment';

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  'auth/invalid-credentials': 'Invalid email or password. Please try again.',
  'auth/user-not-found': 'No account found with this email address.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password should be at least 6 characters long.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/requires-recent-login': 'Please log in again to complete this action.',
  
  // Payment errors
  'payment/card-declined': 'Your card was declined. Please try another payment method.',
  'payment/insufficient-funds': 'Insufficient funds. Please try another card.',
  'payment/processing-error': 'Payment processing failed. Please try again.',
  'payment/invalid-card': 'Invalid card details. Please check and try again.',
  
  // Listing errors
  'listing/not-found': 'This listing is no longer available.',
  'listing/already-sold': 'This item has already been sold.',
  'listing/cannot-buy-own': 'You cannot purchase your own listing.',
  
  // Network errors
  'network/offline': 'You appear to be offline. Please check your connection.',
  'network/timeout': 'Request timed out. Please try again.',
  'network/server-error': 'Server error. Please try again later.',
  
  // Rate limiting
  'rate-limit/exceeded': 'Too many requests. Please wait a moment and try again.',
  
  // Generic errors
  'unknown': 'Something went wrong. Please try again.',
  'validation': 'Please check your input and try again.',
  'permission-denied': 'You don\'t have permission to do this.',
  'not-found': 'The requested resource was not found.'
};

// Map technical error codes to user-friendly ones
const ERROR_CODE_MAP: Record<string, string> = {
  'Invalid login credentials': 'auth/invalid-credentials',
  'User not found': 'auth/user-not-found',
  'card_declined': 'payment/card-declined',
  'insufficient_funds': 'payment/insufficient-funds',
  '404': 'not-found',
  '403': 'permission-denied',
  '429': 'rate-limit/exceeded',
  '500': 'network/server-error',
  '502': 'network/server-error',
  '503': 'network/server-error',
  '504': 'network/timeout'
};

export class AppError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(message: string, code: string = 'unknown', statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Get user-friendly error message
export function getErrorMessage(error: any): string {
  // Check if it's our custom AppError
  if (error instanceof AppError) {
    return ERROR_MESSAGES[error.code] || error.message || ERROR_MESSAGES['unknown'];
  }

  // Check for mapped error codes
  const errorString = error?.message || error?.code || String(error);
  for (const [key, code] of Object.entries(ERROR_CODE_MAP)) {
    if (errorString.toLowerCase().includes(key.toLowerCase())) {
      return ERROR_MESSAGES[code] || ERROR_MESSAGES['unknown'];
    }
  }

  // Check for network errors
  if (!browser || !navigator.onLine) {
    return ERROR_MESSAGES['network/offline'];
  }

  // Check for specific error patterns
  if (error?.status === 429 || errorString.includes('rate limit')) {
    return ERROR_MESSAGES['rate-limit/exceeded'];
  }

  if (error?.status >= 500 || errorString.includes('server')) {
    return ERROR_MESSAGES['network/server-error'];
  }

  // Default message
  return ERROR_MESSAGES.unknown;
}

// Retry configuration
interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoff?: boolean;
  onRetry?: (attempt: number, error: any) => void;
}

// Retry wrapper for API calls
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoff = true,
    onRetry
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry certain errors
      if (
        error?.status === 401 || // Unauthorized
        error?.status === 403 || // Forbidden
        error?.status === 404 || // Not found
        error?.code === 'auth/invalid-credentials' ||
        error?.code === 'payment/card-declined'
      ) {
        throw error;
      }

      // Check if we should retry
      if (attempt < maxAttempts) {
        const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;
        
        if (onRetry) {
          onRetry(attempt, error);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Global error logger (only in production)
export function logError(error: any, context?: Record<string, any>) {
  if (browser && import.meta.env['PROD']) {
    // Send to error tracking service (e.g., Sentry)
    console.error('Error:', error, 'Context:', context);
    
    // You would typically send to an error tracking service here
    // Example: Sentry.captureException(error, { extra: context });
  } else {
    // In development, just log to console
    console.error('Error:', error, 'Context:', context);
  }
}

// Create standardized error response
export function createErrorResponse(error: any) {
  const message = getErrorMessage(error);
  const statusCode = error?.status || error?.statusCode || 500;
  
  return {
    error: true,
    message,
    code: error?.code || 'unknown',
    statusCode
  };
}