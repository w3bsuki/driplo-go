/**
 * Performance utilities for throttling, debouncing, and memoization
 * These help optimize expensive operations and prevent excessive renders
 */

import { browser } from '$app/environment';

/**
 * Throttle function execution to at most once per specified time period
 * Useful for scroll handlers, resize events, and continuous input
 * 
 * @example
 * const throttledScroll = throttle((e) => console.log('Scrolled!'), 200);
 * window.addEventListener('scroll', throttledScroll);
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastResult: ReturnType<T>;
  
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      lastResult = fn.apply(this, args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
    
    return lastResult;
  };
}

/**
 * Advanced throttle with leading and trailing edge control
 * 
 * @example
 * const throttled = throttleAdvanced(updateUI, 300, { leading: true, trailing: true });
 */
export function throttleAdvanced<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  
  const { leading = true, trailing = true } = options;
  
  const later = () => {
    previous = leading === false ? 0 : Date.now();
    timeout = null;
    if (trailing && lastArgs) {
      fn.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    }
  };
  
  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    
    if (!previous && leading === false) {
      previous = now;
    }
    
    const remaining = wait - (now - previous);
    lastArgs = args;
    lastThis = this;
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      fn.apply(this, args);
      lastArgs = null;
      lastThis = null;
    } else if (!timeout && trailing) {
      timeout = setTimeout(later, remaining);
    }
  };
}

/**
 * Debounce function execution until after wait milliseconds have elapsed
 * since the last time the debounced function was invoked
 * 
 * @example
 * const debouncedSearch = debounce((query) => searchAPI(query), 300);
 * input.addEventListener('input', (e) => debouncedSearch(e.target.value));
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  const debounced = function (this: any, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      fn.apply(this, args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
  
  // Add cancel method
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  return debounced;
}

/**
 * Advanced debounce with immediate option
 * 
 * @example
 * const debounced = debounceAdvanced(saveData, 1000, { immediate: true });
 */
export function debounceAdvanced<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  options: { immediate?: boolean; maxWait?: number } = {}
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let maxTimeout: NodeJS.Timeout | null = null;
  let lastCallTime: number | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let result: ReturnType<T>;
  
  const { immediate = false, maxWait } = options;
  
  const invokeFunc = (time: number) => {
    const args = lastArgs;
    const thisArg = lastThis;
    
    lastArgs = null;
    lastThis = null;
    lastCallTime = time;
    
    if (args) {
      result = fn.apply(thisArg, args);
    }
    
    return result;
  };
  
  const startTimer = (wait: number, timerExpired: () => void) => {
    return setTimeout(timerExpired, wait);
  };
  
  const remainingWait = (time: number) => {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeWaiting = wait - timeSinceLastCall;
    
    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastCall)
      : timeWaiting;
  };
  
  const timerExpired = () => {
    const time = Date.now();
    
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    
    timeout = startTimer(remainingWait(time), timerExpired);
  };
  
  const shouldInvoke = (time: number) => {
    const timeSinceLastCall = time - (lastCallTime || 0);
    
    return (
      lastCallTime === null ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastCall >= maxWait)
    );
  };
  
  const trailingEdge = (time: number) => {
    timeout = null;
    
    if (lastArgs) {
      return invokeFunc(time);
    }
    
    lastArgs = null;
    lastThis = null;
    return result;
  };
  
  const debounced = function (this: any, ...args: Parameters<T>) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);
    
    lastArgs = args;
    lastThis = this;
    lastCallTime = time;
    
    if (isInvoking) {
      if (timeout === null && immediate) {
        return invokeFunc(time);
      }
      
      if (maxWait !== undefined) {
        timeout = startTimer(wait, timerExpired);
        maxTimeout = startTimer(maxWait, () => invokeFunc(Date.now()));
        return result;
      }
    }
    
    if (timeout === null) {
      timeout = startTimer(wait, timerExpired);
    }
    
    return result;
  };
  
  debounced.cancel = () => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    if (maxTimeout !== null) {
      clearTimeout(maxTimeout);
    }
    lastCallTime = null;
    timeout = null;
    maxTimeout = null;
    lastArgs = null;
    lastThis = null;
  };
  
  debounced.flush = () => {
    return timeout === null ? result : trailingEdge(Date.now());
  };
  
  return debounced;
}

/**
 * Simple memoization for expensive pure functions
 * Caches results based on stringified arguments
 * 
 * @example
 * const expensiveCalc = memoize((n: number) => {
 *   console.log('Computing...');
 *   return n * n;
 * });
 * 
 * expensiveCalc(5); // Computing... 25
 * expensiveCalc(5); // 25 (cached)
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options?: {
    maxSize?: number;
    ttl?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
  }
): T {
  const { maxSize = 100, ttl, keyGenerator } = options || {};
  const cache = new Map<string, { value: ReturnType<T>; timestamp?: number }>();
  
  const defaultKeyGenerator = (...args: Parameters<T>) => JSON.stringify(args);
  const getKey = keyGenerator || defaultKeyGenerator;
  
  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = getKey(...args);
    const cached = cache.get(key);
    
    // Check if cached value exists and is still valid
    if (cached) {
      if (!ttl || Date.now() - (cached.timestamp || 0) < ttl) {
        return cached.value;
      }
      // Expired entry, remove it
      cache.delete(key);
    }
    
    // Compute new value
    const value = fn.apply(this, args);
    
    // Implement LRU eviction if cache is too large
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    // Store in cache
    cache.set(key, {
      value,
      timestamp: ttl ? Date.now() : undefined
    });
    
    return value;
  } as T;
}

/**
 * Advanced memoization with WeakMap for object arguments
 * Automatically garbage collects when objects are no longer referenced
 * 
 * @example
 * const getUserPermissions = memoizeWeak((user: User) => {
 *   return calculatePermissions(user);
 * });
 */
export function memoizeWeak<
  T extends (arg: WeakKey, ...args: any[]) => any
>(fn: T): T {
  const cache = new WeakMap<WeakKey, ReturnType<T>>();
  
  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const [firstArg] = args;
    
    if (!firstArg || (typeof firstArg !== 'object' && typeof firstArg !== 'function')) {
      // Can't use WeakMap for primitive values
      return fn.apply(this, args);
    }
    
    // Use first object argument as key
    const key = firstArg as WeakKey;
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const value = fn.apply(this, args);
    cache.set(key, value);
    
    return value;
  } as T;
}

/**
 * Request Animation Frame throttle for smooth animations
 * Ensures function runs at most once per frame
 * 
 * @example
 * const smoothScroll = rafThrottle((scrollY) => {
 *   element.style.transform = `translateY(${scrollY}px)`;
 * });
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;
  
  const throttled = function (this: any, ...args: Parameters<T>) {
    lastArgs = args;
    
    if (rafId === null && browser) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) {
          fn.apply(this, lastArgs);
        }
        rafId = null;
        lastArgs = null;
      });
    }
  };
  
  throttled.cancel = () => {
    if (rafId !== null && browser) {
      cancelAnimationFrame(rafId);
      rafId = null;
      lastArgs = null;
    }
  };
  
  return throttled;
}

/**
 * Idle callback debounce - runs when browser is idle
 * Perfect for non-critical updates
 * 
 * @example
 * const updateAnalytics = idleDebounce(() => {
 *   sendAnalytics();
 * });
 */
export function idleDebounce<T extends (...args: any[]) => any>(
  fn: T,
  options?: IdleRequestOptions
): (...args: Parameters<T>) => void {
  let handle: number | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  
  const debounced = function (this: any, ...args: Parameters<T>) {
    lastArgs = args;
    lastThis = this;
    
    if (handle !== null && browser) {
      cancelIdleCallback(handle);
    }
    
    if (browser && 'requestIdleCallback' in window) {
      handle = requestIdleCallback(() => {
        if (lastArgs) {
          fn.apply(lastThis, lastArgs);
        }
        handle = null;
        lastArgs = null;
        lastThis = null;
      }, options);
    } else {
      // Fallback for browsers without requestIdleCallback
      handle = window.setTimeout(() => {
        if (lastArgs) {
          fn.apply(lastThis, lastArgs);
        }
        handle = null;
        lastArgs = null;
        lastThis = null;
      }, 1);
    }
  };
  
  debounced.cancel = () => {
    if (handle !== null && browser) {
      if ('cancelIdleCallback' in window) {
        cancelIdleCallback(handle);
      } else {
        clearTimeout(handle);
      }
      handle = null;
      lastArgs = null;
      lastThis = null;
    }
  };
  
  return debounced;
}

/**
 * Create a function that can be called multiple times but only
 * executes after being called n times
 * 
 * @example
 * const logAfter3 = after(3, () => console.log('Called 3 times!'));
 * logAfter3(); // nothing
 * logAfter3(); // nothing
 * logAfter3(); // 'Called 3 times!'
 */
export function after<T extends (...args: any[]) => any>(
  n: number,
  fn: T
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let count = 0;
  
  return function (this: any, ...args: Parameters<T>) {
    count++;
    if (count >= n) {
      return fn.apply(this, args);
    }
  };
}

/**
 * Create a function that can only be called once
 * Subsequent calls return the first call's result
 * 
 * @example
 * const initialize = once(() => {
 *   console.log('Initializing...');
 *   return { initialized: true };
 * });
 * 
 * initialize(); // 'Initializing...' { initialized: true }
 * initialize(); // { initialized: true } (cached, no log)
 */
export function once<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => ReturnType<T> {
  let called = false;
  let result: ReturnType<T>;
  
  return function (this: any, ...args: Parameters<T>) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}

/**
 * Batch multiple function calls into a single execution
 * Useful for DOM updates or API calls
 * 
 * @example
 * const batchedUpdate = batch((items: string[]) => {
 *   console.log('Updating:', items);
 * });
 * 
 * batchedUpdate('item1');
 * batchedUpdate('item2');
 * batchedUpdate('item3');
 * // After microtask: 'Updating: ["item1", "item2", "item3"]'
 */
export function batch<T>(
  fn: (items: T[]) => void,
  options?: { 
    maxSize?: number; 
    flushInterval?: number;
    scheduler?: (callback: () => void) => void;
  }
): (item: T) => void {
  const { 
    maxSize = Infinity, 
    flushInterval,
    scheduler = queueMicrotask
  } = options || {};
  
  let items: T[] = [];
  let scheduled = false;
  let intervalId: NodeJS.Timeout | null = null;
  
  const flush = () => {
    if (items.length > 0) {
      const batch = items.slice();
      items = [];
      fn(batch);
    }
    scheduled = false;
  };
  
  const schedule = () => {
    if (!scheduled) {
      scheduled = true;
      scheduler(flush);
    }
  };
  
  if (flushInterval && browser) {
    intervalId = setInterval(flush, flushInterval);
  }
  
  const batched = (item: T) => {
    items.push(item);
    
    if (items.length >= maxSize) {
      flush();
    } else {
      schedule();
    }
  };
  
  batched.flush = flush;
  batched.cancel = () => {
    items = [];
    scheduled = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
  
  return batched;
}

/**
 * Performance measurement utility
 * 
 * @example
 * const measure = createPerformanceMeasure('MyComponent');
 * measure.start('render');
 * // ... expensive operation
 * measure.end('render');
 * console.log(measure.getMetrics());
 */
export function createPerformanceMeasure(_name: string) {
  const marks = new Map<string, number>();
  const measures = new Map<string, number[]>();
  
  return {
    start(label: string) {
      marks.set(label, performance.now());
    },
    
    end(label: string) {
      const start = marks.get(label);
      if (start !== undefined) {
        const duration = performance.now() - start;
        
        if (!measures.has(label)) {
          measures.set(label, []);
        }
        
        measures.get(label)!.push(duration);
        marks.delete(label);
        
        return duration;
      }
    },
    
    getMetrics() {
      const metrics: Record<string, {
        count: number;
        total: number;
        average: number;
        min: number;
        max: number;
      }> = {};
      
      for (const [label, durations] of measures) {
        const total = durations.reduce((sum, d) => sum + d, 0);
        metrics[label] = {
          count: durations.length,
          total,
          average: total / durations.length,
          min: Math.min(...durations),
          max: Math.max(...durations)
        };
      }
      
      return metrics;
    },
    
    clear() {
      marks.clear();
      measures.clear();
    }
  };
}