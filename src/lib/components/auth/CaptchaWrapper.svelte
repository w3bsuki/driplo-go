<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  
  export let onVerify: (token: string) => void
  export let onExpire: () => void = () => {}
  export let onError: () => void = () => {}
  
  // You'll need to add this to your .env file:
  // PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_v2_site_key
  const siteKey = import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY || ''
  
  let recaptchaContainer: HTMLDivElement
  let widgetId: number | null = null
  
  onMount(() => {
    if (!siteKey) {
      console.warn('reCAPTCHA site key not configured - CAPTCHA will be disabled')
      // In development, auto-verify with a test token
      if (import.meta.env.MODE === 'development') {
        onVerify('development-test-token')
      }
      return
    }
    
    // Load reCAPTCHA script
    const script = document.createElement('script')
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit'
    script.async = true
    script.defer = true
    
    // Define callback for when reCAPTCHA loads
    window.onRecaptchaLoad = () => {
      if (window.grecaptcha && recaptchaContainer) {
        try {
          widgetId = window.grecaptcha.render(recaptchaContainer, {
            sitekey: siteKey,
            callback: (token: string) => {
              onVerify(token)
            },
            'expired-callback': () => {
              onExpire()
            },
            'error-callback': () => {
              onError()
            }
          })
        } catch (error) {
          console.error('Failed to render reCAPTCHA:', error)
        }
      }
    }
    
    document.head.appendChild(script)
  })
  
  onDestroy(() => {
    // Clean up
    if (window.grecaptcha && widgetId !== null) {
      try {
        window.grecaptcha.reset(widgetId)
      } catch (error) {
        // Widget might already be destroyed
      }
    }
    
    // Remove the global callback
    if (window.onRecaptchaLoad) {
      delete window.onRecaptchaLoad
    }
  })
  
  // Expose reset method
  export function reset() {
    if (window.grecaptcha && widgetId !== null) {
      window.grecaptcha.reset(widgetId)
    }
  }
</script>

{#if siteKey}
  <div bind:this={recaptchaContainer} class="g-recaptcha"></div>
{:else if import.meta.env.MODE === 'development'}
  <div class="text-xs text-gray-500 text-center p-2 border border-gray-200 rounded bg-gray-50">
    CAPTCHA disabled in development mode
  </div>
{/if}

<style>
  /* Ensure reCAPTCHA is centered on mobile */
  @media (max-width: 480px) {
    :global(.g-recaptcha) {
      transform: scale(0.9);
      transform-origin: center;
    }
  }
</style>