<script lang="ts">
  import { page } from '$app/stores';
  import { getErrorMessage } from '$lib/utils/error-handling';
  import Header from '$lib/components/layout/Header.svelte';
  import * as m from '$lib/paraglide/messages.js';

  export let data;

  // Get error details from page store
  $: error = $page.error;
  $: status = $page.status;
  $: errorMessage = error ? getErrorMessage(error) : 'Something went wrong';

  // App-specific error handling
  $: appErrorContent = (() => {
    const errorString = error?.message || String(error || '').toLowerCase();
    const pathname = $page.url.pathname;
    
    // Payment/checkout errors
    if (pathname.includes('checkout') || pathname.includes('payment')) {
      return {
        title: 'Payment Error',
        description: 'There was an issue processing your payment. Your card was not charged.',
        icon: 'credit-card',
        showRetry: true,
        showSupport: true,
        category: 'payment'
      };
    }
    
    // Listing/product errors
    if (pathname.includes('listings') || pathname.includes('sell')) {
      if (status === 404) {
        return {
          title: 'Listing Not Found',
          description: 'This listing may have been sold or removed.',
          icon: 'search',
          showBrowse: true,
          showHome: true,
          category: 'listing'
        };
      }
      return {
        title: 'Listing Error',
        description: 'There was an issue with this listing.',
        icon: 'package',
        showRetry: true,
        showBrowse: true,
        category: 'listing'
      };
    }
    
    // Profile/account errors
    if (pathname.includes('profile') || pathname.includes('settings')) {
      if (status === 403) {
        return {
          title: 'Access Denied',
          description: 'You don\'t have permission to view this profile.',
          icon: 'user-x',
          showHome: true,
          category: 'profile'
        };
      }
      return {
        title: 'Profile Error',
        description: 'There was an issue loading this profile.',
        icon: 'user',
        showRetry: true,
        showHome: true,
        category: 'profile'
      };
    }
    
    // Messaging errors
    if (pathname.includes('messages')) {
      return {
        title: 'Messaging Error',
        description: 'There was an issue with messaging.',
        icon: 'message-circle',
        showRetry: true,
        showHome: true,
        category: 'messaging'
      };
    }
    
    // Orders errors
    if (pathname.includes('orders')) {
      return {
        title: 'Order Error',
        description: 'There was an issue loading your orders.',
        icon: 'shopping-bag',
        showRetry: true,
        showSupport: true,
        category: 'orders'
      };
    }
    
    // Browse/search errors
    if (pathname.includes('browse') || pathname.includes('search')) {
      return {
        title: 'Search Error',
        description: 'There was an issue with your search.',
        icon: 'search',
        showRetry: true,
        showHome: true,
        category: 'browse'
      };
    }
    
    // Default app error
    return {
      title: 'Something Went Wrong',
      description: errorMessage,
      icon: 'alert-triangle',
      showRetry: true,
      showHome: true,
      category: 'general'
    };
  })();

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

<!-- Include header for app context -->
{#if data?.categories}
  <Header categories={data.categories} supabase={data.supabase} />
{/if}

<main class="min-h-screen bg-background py-12 px-4">
  <div class="max-w-2xl mx-auto text-center">
    <!-- Error Icon with category-specific styling -->
    <div class="mx-auto mb-8">
      {#if appErrorContent.icon === 'credit-card'}
        <div class="h-20 w-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
          <svg class="h-10 w-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
      {:else if appErrorContent.icon === 'package'}
        <div class="h-20 w-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
          <svg class="h-10 w-10 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
      {:else if appErrorContent.icon === 'user' || appErrorContent.icon === 'user-x'}
        <div class="h-20 w-20 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto">
          <svg class="h-10 w-10 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      {:else if appErrorContent.icon === 'message-circle'}
        <div class="h-20 w-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
          <svg class="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
      {:else if appErrorContent.icon === 'shopping-bag'}
        <div class="h-20 w-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto">
          <svg class="h-10 w-10 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
      {:else if appErrorContent.icon === 'search'}
        <div class="h-20 w-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
          <svg class="h-10 w-10 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      {:else}
        <div class="h-20 w-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
          <svg class="h-10 w-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      {/if}
    </div>

    <!-- Error Content -->
    <div class="mb-8">
      <h1 class="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {appErrorContent.title}
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-400 mb-2">
        {appErrorContent.description}
      </p>
      {#if status}
        <p class="text-sm text-gray-500 dark:text-gray-500">
          Error {status} • {appErrorContent.category}
        </p>
      {/if}
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
      {#if appErrorContent.showRetry}
        <button
          onclick={handleRetry}
          class="flex-1 bg-blue-600 text-white py-3 px-6 rounded-sm hover:bg-blue-700 transition-colors duration-100 text-sm font-medium"
        >
          Try Again
        </button>
      {/if}

      {#if appErrorContent.showBrowse}
        <a
          href="/browse"
          class="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-3 px-6 rounded-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-100 text-sm font-medium text-center"
        >
          Browse Listings
        </a>
      {/if}

      {#if appErrorContent.showHome}
        <a
          href="/"
          class="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-100 text-sm font-medium text-center"
        >
          Back to Home
        </a>
      {/if}

      {#if appErrorContent.showSupport}
        <a
          href="/contact"
          class="flex-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 py-3 px-6 rounded-sm hover:bg-orange-200 dark:hover:bg-orange-900/40 transition-colors duration-100 text-sm font-medium text-center"
        >
          Contact Support
        </a>
      {/if}
    </div>

    <!-- Back button -->
    <div class="mt-6">
      <button
        onclick={handleBack}
        class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-100"
      >
        ← Go back
      </button>
    </div>

    <!-- Development Info -->
    {#if import.meta.env.DEV && error}
      <details class="mt-8 text-left max-w-md mx-auto bg-white dark:bg-gray-800 rounded-sm p-4">
        <summary class="text-xs text-gray-500 cursor-pointer hover:text-gray-700 mb-2">
          Technical details (dev only)
        </summary>
        <pre class="p-3 bg-gray-100 dark:bg-gray-900 rounded-sm text-xs overflow-auto max-h-48 text-gray-600 dark:text-gray-400">
{JSON.stringify({ 
  error: error.message || String(error), 
  status, 
  url: $page.url.pathname,
  category: appErrorContent.category
}, null, 2)}
        </pre>
      </details>
    {/if}
  </div>
</main>