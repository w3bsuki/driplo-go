import { withRetry, AppError, getErrorMessage } from '$lib/utils/error-handling';

interface ApiOptions extends RequestInit {
  retry?: boolean;
  maxRetries?: number;
  timeout?: number;
}

// Enhanced fetch with automatic retry and error handling
export async function apiFetch(
  url: string,
  options: ApiOptions = {}
): Promise<Response> {
  const {
    retry = true,
    maxRetries = 3,
    timeout = 30000,
    ...fetchOptions
  } = options;

  // Add timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const doFetch = async () => {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorData: any = {};

        if (contentType?.includes('application/json')) {
          try {
            errorData = await response.json();
          } catch {
            // Ignore JSON parse errors
          }
        }

        throw new AppError(
          errorData.message || `HTTP ${response.status}`,
          errorData.code || 'http-error',
          response.status,
          errorData
        );
      }

      return response;
    };

    // Apply retry logic if enabled
    if (retry) {
      return await withRetry(doFetch, {
        maxAttempts: maxRetries,
        onRetry: (attempt, error) => {
          console.warn(`API call failed, retrying (${attempt}/${maxRetries})...`, error);
        }
      });
    } else {
      return await doFetch();
    }
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Handle abort/timeout
    if (error.name === 'AbortError') {
      throw new AppError('Request timed out', 'network/timeout', 408);
    }

    // Re-throw if already an AppError
    if (error instanceof AppError) {
      throw error;
    }

    // Wrap other errors
    throw new AppError(
      getErrorMessage(error),
      'network/error',
      500,
      { originalError: error }
    );
  }
}

// Convenience methods
export const api = {
  async get(url: string, options?: ApiOptions) {
    return apiFetch(url, { ...options, method: 'GET' });
  },

  async post(url: string, data?: any, options?: ApiOptions) {
    return apiFetch(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: data ? JSON.stringify(data) : undefined
    });
  },

  async put(url: string, data?: any, options?: ApiOptions) {
    return apiFetch(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: data ? JSON.stringify(data) : undefined
    });
  },

  async delete(url: string, options?: ApiOptions) {
    return apiFetch(url, { ...options, method: 'DELETE' });
  },

  async patch(url: string, data?: any, options?: ApiOptions) {
    return apiFetch(url, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: data ? JSON.stringify(data) : undefined
    });
  }
};

// Create a composable for Svelte components
export function createApiClient() {
  let abortController: AbortController | null = null;

  function abort() {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  }

  async function request(url: string, options: ApiOptions = {}) {
    abort(); // Cancel any pending requests
    
    abortController = new AbortController();
    
    try {
      return await apiFetch(url, {
        ...options,
        signal: abortController.signal
      });
    } finally {
      abortController = null;
    }
  }

  // Return API methods and cleanup function
  return {
    get: (url: string, options?: ApiOptions) => 
      request(url, { ...options, method: 'GET' }),
    
    post: (url: string, data?: any, options?: ApiOptions) =>
      request(url, {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers
        },
        body: data ? JSON.stringify(data) : undefined
      }),
    
    put: (url: string, data?: any, options?: ApiOptions) =>
      request(url, {
        ...options,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers
        },
        body: data ? JSON.stringify(data) : undefined
      }),
    
    delete: (url: string, options?: ApiOptions) =>
      request(url, { ...options, method: 'DELETE' }),
    
    patch: (url: string, data?: any, options?: ApiOptions) =>
      request(url, {
        ...options,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers
        },
        body: data ? JSON.stringify(data) : undefined
      }),
    
    abort
  };
}