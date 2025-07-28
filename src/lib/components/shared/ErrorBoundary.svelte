<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { getErrorMessage, logError, type AppError } from '$lib/utils/error-handling';
  import { captureSentryException } from '$lib/config/sentry';
  import * as m from '$lib/paraglide/messages.js';

  // Component props
  let { 
    error = null,
    reset = null,
    fallback = null,
    level = 'detailed',
    isolate = false,
    onError = null,
    resetKeys = [],
    children
  }: {
    error?: any;
    reset?: (() => void) | null;
    fallback?: string | null;
    level?: 'minimal' | 'detailed' | 'custom';
    isolate?: boolean;
    onError?: ((error: any, errorInfo: any) => void) | null;
    resetKeys?: any[];
    children?: any;
  } = $props();

  // Internal state
  let errorMessage = $state('');
  let showDetails = $state(false);
  let errorId = $state('');
  let errorCount = $state(0);

  // Error boundary state management
  let hasError = false;
  let lastResetKeys = [...resetKeys];

  // Reset error when resetKeys change
  $effect(() => {
    const keysChanged = resetKeys.length !== lastResetKeys.length || 
      resetKeys.some((key, index) => key !== lastResetKeys[index]);
    
    if (keysChanged && hasError) {
      error = null;
      hasError = false;
      errorCount = 0;
    }
    lastResetKeys = [...resetKeys];
  });

  // Process error when it changes
  $effect(() => {
    if (error && !hasError) {
      hasError = true;
      errorCount++;
      errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      errorMessage = getErrorMessage(error);
      
      // Log error with context
      const errorContext = {
        url: $page.url.pathname,
        errorBoundary: true,
        level,
        isolate,
        errorId,
        errorCount,
        userAgent: browser ? navigator.userAgent : '',
        timestamp: new Date().toISOString()
      };
      
      logError(error, errorContext);
      
      // Send to Sentry
      captureSentryException(error, errorContext);
      
      // Call custom error handler
      if (onError) {
        try {
          onError(error, errorContext);
        } catch (handlerError) {
          console.error('Error in onError handler:', handlerError);
        }
      }
    }
  });

  function handleReset() {
    try {
      if (reset) {
        reset();
      }
      
      // Reset internal state
      error = null;
      hasError = false;
      errorMessage = '';
      showDetails = false;
      
    } catch (resetError) {
      console.error('Error during reset:', resetError);
      // Fallback: reload the page
      if (browser) {
        window.location.reload();
      }
    }
  }

  function handleReload() {
    if (browser) {
      window.location.reload();
    }
  }

  // Global error handlers (only if not isolated)
  let removeErrorHandlers: (() => void) | null = null;

  onMount(() => {
    if (!isolate && browser) {
      const handleError = (event: ErrorEvent) => {
        event.preventDefault();
        error = event.error || new Error(event.message);
      };

      const handleRejection = (event: PromiseRejectionEvent) => {
        event.preventDefault();
        error = event.reason || new Error('Unhandled promise rejection');
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleRejection);

      removeErrorHandlers = () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleRejection);
      };
    }
  });

  onDestroy(() => {
    if (removeErrorHandlers) {
      removeErrorHandlers();
    }
  });
</script>

{#if error}
  {#if level === 'minimal'}
    <!-- Minimal error display -->
    <div class="p-4 bg-red-50 border border-red-200 rounded-sm">
      <div class="flex items-center">
        <svg class="h-4 w-4 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm text-red-800">{errorMessage}</p>
        <button 
          onclick={handleReset}
          class="ml-auto text-sm text-red-600 hover:text-red-500 underline"
        >
          Try again
        </button>
      </div>
    </div>
  {:else if level === 'custom' && fallback}
    <!-- Custom fallback -->
    {@html fallback}
  {:else}
    <!-- Detailed error display (default) -->
    <div class="min-h-[400px] flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-sm shadow-lg p-6">
        <!-- Error Icon and Title -->
        <div class="flex items-center mb-4">
          <div class="flex-shrink-0">
            <svg class="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
              {m.error_boundary_title()}
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Error ID: {errorId}
            </p>
          </div>
        </div>

        <!-- Error Message -->
        <div class="mt-2">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {errorMessage}
          </p>
          
          {#if errorCount > 1}
            <p class="text-xs text-amber-600 dark:text-amber-400 mt-1">
              This error has occurred {errorCount} times.
            </p>
          {/if}
        </div>

        <!-- Development Details -->
        {#if import.meta.env['DEV'] && error}
          <div class="mt-4">
            <button
              onclick={() => showDetails = !showDetails}
              class="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors duration-100"
            >
              {showDetails ? 'Hide' : 'Show'} technical details
            </button>
            
            {#if showDetails}
              <div class="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded-sm">
                <div class="space-y-2">
                  <div>
                    <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">Error:</span>
                    <pre class="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-24">{error.message || String(error)}</pre>
                  </div>
                  {#if error.stack}
                    <div>
                      <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">Stack:</span>
                      <pre class="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-32">{error.stack}</pre>
                    </div>
                  {/if}
                  <div>
                    <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">Page:</span>
                    <span class="text-xs text-gray-600 dark:text-gray-400">{$page.url.pathname}</span>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Action Buttons -->
        <div class="mt-6 flex gap-3">
          <button
            onclick={handleReset}
            class="flex-1 bg-blue-600 text-white rounded-sm px-4 py-2 hover:bg-blue-700 transition-colors duration-100 text-sm"
          >
            {m.error_boundary_retry()}
          </button>
          <button
            onclick={handleReload}
            class="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-sm px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-100 text-sm"
          >
            Reload page
          </button>
          <a
            href="/"
            class="flex-1 text-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-sm px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-100 text-sm"
          >
            {m.error_boundary_home()}
          </a>
        </div>
      </div>
    </div>
  {/if}
{:else}
  {@render children?.()}
{/if}