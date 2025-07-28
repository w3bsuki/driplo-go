<script lang="ts">
  import { page } from '$app/stores';
  import { getErrorMessage } from '$lib/utils/error-handling';
  import * as m from '$lib/paraglide/messages.js';

  // Get error details from page store
  let error = $derived($page.error);
  let status = $derived($page.status);
  let errorMessage = $derived(error ? getErrorMessage(error) : 'Authentication error occurred');

  // Auth-specific error handling
  let authErrorContent = $derived((() => {
    const errorString = error?.message || String(error || '').toLowerCase();
    
    if (status === 429 || errorString.includes('rate limit')) {
      return {
        title: 'Too Many Attempts',
        description: 'Please wait a moment before trying again.',
        icon: 'clock',
        showRetry: true,
        retryDelay: true
      };
    }
    
    if (errorString.includes('invalid') || errorString.includes('credentials')) {
      return {
        title: 'Sign In Failed',
        description: 'Please check your email and password and try again.',
        icon: 'key',
        showRetry: true,
        showForgotPassword: true
      };
    }
    
    if (errorString.includes('email') && errorString.includes('use')) {
      return {
        title: 'Account Already Exists',
        description: 'An account with this email already exists. Try signing in instead.',
        icon: 'user',
        showLogin: true
      };
    }
    
    if (errorString.includes('verification') || errorString.includes('confirm')) {
      return {
        title: 'Email Verification Required',
        description: 'Please check your email and click the verification link.',
        icon: 'mail',
        showResendVerification: true
      };
    }
    
    if (status === 403) {
      return {
        title: 'Access Denied',
        description: 'Your account may be suspended or you don\'t have permission.',
        icon: 'shield',
        showSupport: true
      };
    }
    
    // Default auth error
    return {
      title: 'Authentication Error',
      description: errorMessage,
      icon: 'alert',
      showRetry: true,
      showHome: true
    };
  })());

  let retryCountdown = $state(0);
  let retryTimer: number;

  function handleRetry() {
    if (authErrorContent.retryDelay && retryCountdown > 0) return;
    
    // For rate limiting, show countdown
    if (authErrorContent.retryDelay) {
      retryCountdown = 30;
      retryTimer = setInterval(() => {
        retryCountdown--;
        if (retryCountdown <= 0) {
          clearInterval(retryTimer);
        }
      }, 1000);
    }
    
    window.location.reload();
  }

  function handleResendVerification() {
    // Implementation would go here to resend verification email
    console.log('Resending verification email...');
  }
</script>

<svelte:head>
  <title>Authentication Error - Driplo</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<!-- Auth-specific error page with branded styling -->
<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
  <div class="max-w-md w-full">
    <!-- Logo -->
    <div class="text-center mb-8">
      <a href="/" class="inline-block">
        <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">Driplo</span>
      </a>
    </div>

    <!-- Error Card -->
    <div class="bg-white dark:bg-gray-800 rounded-sm shadow-lg p-6">
      <!-- Error Icon -->
      <div class="text-center mb-6">
        {#if authErrorContent.icon === 'clock'}
          <svg class="h-12 w-12 text-amber-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        {:else if authErrorContent.icon === 'key'}
          <svg class="h-12 w-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        {:else if authErrorContent.icon === 'user'}
          <svg class="h-12 w-12 text-blue-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        {:else if authErrorContent.icon === 'mail'}
          <svg class="h-12 w-12 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        {:else if authErrorContent.icon === 'shield'}
          <svg class="h-12 w-12 text-orange-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        {:else}
          <svg class="h-12 w-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        {/if}
      </div>

      <!-- Error Content -->
      <div class="text-center mb-6">
        <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {authErrorContent.title}
        </h1>
        <p class="text-gray-600 dark:text-gray-400 text-sm">
          {authErrorContent.description}
        </p>
        {#if status}
          <p class="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Error {status}
          </p>
        {/if}
      </div>

      <!-- Action Buttons -->
      <div class="space-y-3">
        {#if authErrorContent.showRetry}
          <button
            onclick={handleRetry}
            disabled={retryCountdown > 0}
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-100 text-sm"
          >
            {#if retryCountdown > 0}
              Try Again ({retryCountdown}s)
            {:else}
              Try Again
            {/if}
          </button>
        {/if}

        {#if authErrorContent.showLogin}
          <a
            href="/login"
            class="block w-full bg-blue-600 text-white py-2 px-4 rounded-sm hover:bg-blue-700 transition-colors duration-100 text-sm text-center"
          >
            Sign In Instead
          </a>
        {/if}

        {#if authErrorContent.showForgotPassword}
          <a
            href="/forgot-password"
            class="block w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2 px-4 rounded-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-100 text-sm text-center"
          >
            Forgot Password?
          </a>
        {/if}

        {#if authErrorContent.showResendVerification}
          <button
            onclick={handleResendVerification}
            class="w-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 py-2 px-4 rounded-sm hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors duration-100 text-sm"
          >
            Resend Verification Email
          </button>
        {/if}

        {#if authErrorContent.showSupport}
          <a
            href="/contact"
            class="block w-full bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 py-2 px-4 rounded-sm hover:bg-orange-200 dark:hover:bg-orange-900/40 transition-colors duration-100 text-sm text-center"
          >
            Contact Support
          </a>
        {/if}

        {#if authErrorContent.showHome}
          <a
            href="/"
            class="block w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-100 text-sm text-center"
          >
            Back to Home
          </a>
        {/if}
      </div>
    </div>

    <!-- Development Info -->
    {#if import.meta.env.DEV && error}
      <details class="mt-4 bg-white dark:bg-gray-800 rounded-sm p-3">
        <summary class="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
          Technical details (dev only)
        </summary>
        <pre class="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded-sm text-xs overflow-auto max-h-32 text-gray-600 dark:text-gray-400">
{JSON.stringify({ error: error.message || String(error), status, url: $page.url.pathname }, null, 2)}
        </pre>
      </details>
    {/if}
  </div>
</div>