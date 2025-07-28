<script lang="ts">
  import { Turnstile } from 'svelte-turnstile'
  import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public'
  
  interface Props {
    onVerify: (token: string) => void
    onExpire?: () => void
    onError?: () => void
    theme?: 'light' | 'dark' | 'auto'
    size?: 'normal' | 'compact'
    appearance?: 'always' | 'execute' | 'interaction-only'
  }
  
  let { 
    onVerify, 
    onExpire = () => {}, 
    onError = () => {},
    theme = 'light',
    size = 'normal',
    appearance = 'always'
  }: Props = $props()
  
  let turnstileInstance = $state<any>(null)
  
  // Use test keys if environment variables are not set
  const siteKey = PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'
  
  function handleCallback(token: { token: string }) {
    onVerify(token.token)
  }
  
  function handleExpire() {
    onExpire()
  }
  
  function handleError() {
    onError()
  }
  
  // Expose reset method
  export function reset() {
    if (turnstileInstance && turnstileInstance.reset) {
      turnstileInstance.reset()
    }
  }
  
  // Expose execute method for interaction-only mode
  export function execute() {
    if (turnstileInstance && turnstileInstance.execute) {
      turnstileInstance.execute()
    }
  }
</script>

<div class="turnstile-wrapper">
  <Turnstile
    bind:this={turnstileInstance}
    siteKey={siteKey}
    oncallback={handleCallback}
    onexpire={handleExpire}
    onerror={handleError}
    {theme}
    {size}
    {appearance}
    retry="auto"
    retryInterval={8000}
  />
  
  {#if import.meta.env.MODE === 'development' && siteKey === '1x00000000000000000000AA'}
    <p class="text-xs text-gray-500 mt-1">Using Turnstile test keys (always passes)</p>
  {/if}
</div>

<style>
  .turnstile-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }
  
  /* Ensure Turnstile is responsive on mobile */
  @media (max-width: 480px) {
    :global(.cf-turnstile) {
      transform: scale(0.95);
      transform-origin: center;
    }
  }
</style>