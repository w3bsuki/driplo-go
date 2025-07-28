<script lang="ts">
  import { page } from '$app/stores';
  import { getErrorMessage } from '$lib/utils/error-handling';
  import * as m from '$lib/paraglide/messages.js';

  // Get error details from page store
  let error = $derived($page.error);
  let status = $derived($page.status);
  let errorMessage = $derived(error ? getErrorMessage(error) : 'An unexpected error occurred');

  // Determine error type based on status code
  let errorType = $derived((() => {
    if (status === 404) return 'not-found';
    if (status === 403) return 'forbidden';
    if (status === 500) return 'server-error';
    if (status >= 400 && status < 500) return 'client-error';
    if (status >= 500) return 'server-error';
    return 'unknown';
  })());

  // Error-specific content
  let errorContent = $derived((() => {
    switch (errorType) {
      case 'not-found':
        return {
          title: 'Page Not Found',
          description: 'The page you\'re looking for doesn\'t exist or has been moved.',
          icon: 'search',
          showHome: true,
          showBack: true
        };
      case 'forbidden':
        return {
          title: 'Access Denied',
          description: 'You don\'t have permission to access this page.',
          icon: 'lock',
          showHome: true,
          showLogin: true
        };
      case 'server-error':
        return {
          title: 'Server Error',
          description: 'Something went wrong on our end. We\'ve been notified and are working on it.',
          icon: 'server',
          showHome: true,
          showRetry: true
        };
      default:
        return {
          title: 'Something Went Wrong',
          description: errorMessage,
          icon: 'alert',
          showHome: true,
          showRetry: true
        };
    }
  })());

  function handleRetry() {
    window.location.reload();
  }

  function handleBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  }
</script>

<svelte:head>
  <title>Error {status} - Driplo</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
  <div class="max-w-md w-full text-center">
    <!-- Error Icon -->
    <div class="mx-auto mb-6">
      {#if errorContent.icon === 'search'}
        <svg class="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      {:else if errorContent.icon === 'lock'}
        <svg class="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      {:else if errorContent.icon === 'server'}
        <svg class="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      {:else}
        <svg class="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      {/if}
    </div>

    <!-- Error Details -->
    <div class="mb-8">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {errorContent.title}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 text-sm">
        {errorContent.description}
      </p>
      {#if status}
        <p class="text-xs text-gray-500 dark:text-gray-500 mt-2">
          Error {status}
        </p>
      {/if}
    </div>

    <!-- Action Buttons -->
    <div class="space-y-3">
      {#if errorContent.showRetry}
        <button
          onclick={handleRetry}
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-sm hover:bg-blue-700 transition-colors duration-100 text-sm"
        >
          Try Again
        </button>
      {/if}

      {#if errorContent.showBack}
        <button
          onclick={handleBack}
          class="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2 px-4 rounded-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-100 text-sm"
        >
          Go Back
        </button>
      {/if}

      {#if errorContent.showHome}
        <a
          href="/"
          class="block w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-100 text-sm"
        >
          Back to Home
        </a>
      {/if}

      {#if errorContent.showLogin}
        <a
          href="/login"
          class="block w-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 py-2 px-4 rounded-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors duration-100 text-sm"
        >
          Sign In
        </a>
      {/if}
    </div>

    <!-- Development Info -->
    {#if import.meta.env.DEV && error}
      <details class="mt-8 text-left">
        <summary class="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
          Technical details (dev only)
        </summary>
        <pre class="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded-sm text-xs overflow-auto max-h-48 text-gray-600 dark:text-gray-400">
{JSON.stringify({ error: error.message || String(error), status, url: $page.url.pathname }, null, 2)}
        </pre>
      </details>
    {/if}
  </div>
</div>