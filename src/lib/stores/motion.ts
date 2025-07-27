import { writable, derived } from 'svelte/store'
import { browser } from '$app/environment'

// Motion preference store
function createMotionStore() {
  const { subscribe, set, update } = writable<boolean>(true)
  
  // Check system preference on initialization
  if (browser) {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    set(!mediaQuery.matches)
    
    // Listen for changes to system preference
    const handleChange = (e: MediaQueryListEvent) => {
      set(!e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
  }
  
  return {
    subscribe,
    set,
    update,
    toggle: () => update(n => !n),
    enable: () => set(true),
    disable: () => set(false)
  }
}

export const motionEnabled = createMotionStore()

// Derived store for animation duration based on motion preference
export const animationDuration = derived(
  motionEnabled,
  $motionEnabled => ({
    instant: $motionEnabled ? 0 : 0,
    fast: $motionEnabled ? 150 : 0,
    normal: $motionEnabled ? 200 : 0,
    slow: $motionEnabled ? 300 : 0,
    slower: $motionEnabled ? 400 : 0,
    lazy: $motionEnabled ? 600 : 0
  })
)

// Utility function to respect motion preference in animations
export function withMotion<T extends (...args: any[]) => any>(
  animationFn: T,
  fallbackFn?: T
): T {
  return ((...args: Parameters<T>) => {
    let motionAllowed = true
    
    const unsubscribe = motionEnabled.subscribe(value => {
      motionAllowed = value
    })
    
    const result = motionAllowed 
      ? animationFn(...args) 
      : fallbackFn ? fallbackFn(...args) : { duration: 0 }
    
    unsubscribe()
    
    return result
  }) as T
}

// Animation helper that respects motion preference
export function createMotionSafeAnimation(
  animationConfig: {
    duration?: number
    delay?: number
    easing?: (t: number) => number
    css?: (t: number, u: number) => string
  }
) {
  return (_node: HTMLElement, params: any = {}) => {
    let duration = animationConfig.duration || 200
    
    const unsubscribe = motionEnabled.subscribe(value => {
      duration = value ? (animationConfig.duration || 200) : 0
    })
    
    const animation = {
      ...animationConfig,
      ...params,
      duration
    }
    
    // Cleanup on destroy
    if (typeof animation === 'object' && 'destroy' in animation) {
      const originalDestroy = animation.destroy
      animation.destroy = () => {
        unsubscribe()
        if (originalDestroy) originalDestroy()
      }
    }
    
    return animation
  }
}