<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { getErrorMessage, logError } from '$lib/utils/error-handling';
  import * as m from '$lib/paraglide/messages.js';

  export let error: any = null;
  export let reset: (() => void) | null = null;

  let errorMessage = '';
  let showDetails = false;

  $: if (error) {
    errorMessage = getErrorMessage(error);
    logError(error, {
      url: $page.url.pathname,
      errorBoundary: true
    });
  }

  function handleReset() {
    if (reset) {
      reset();
    } else {
      // Fallback: reload the page
      window.location.reload();
    }
  }

  onMount(() => {
    // Set up global error handler for uncaught errors
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      error = event.error;
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      error = event.reason;
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  });
</script>

{#if error}
  <div class="min-h-[400px] flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div class="flex items-center mb-4">
        <div class="flex-shrink-0">
          <svg class="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
            {m.error_boundary_title()}
          </h3>
        </div>
      </div>

      <div class="mt-2">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {errorMessage}
        </p>
      </div>

      {#if import.meta.env['DEV'] && error}
        <div class="mt-4">
          <button
            on:click={() => showDetails = !showDetails}
            class="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            {showDetails ? 'Hide' : 'Show'} technical details
          </button>
          
          {#if showDetails}
            <pre class="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto max-h-48">
{JSON.stringify(error, null, 2)}
            </pre>
          {/if}
        </div>
      {/if}

      <div class="mt-6 flex gap-3">
        <button
          on:click={handleReset}
          class="flex-1 bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700 transition-colors"
        >
          {m.error_boundary_retry()}
        </button>
        <a
          href="/"
          class="flex-1 text-center bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          {m.error_boundary_home()}
        </a>
      </div>
    </div>
  </div>
{:else}
  <slot />
{/if}