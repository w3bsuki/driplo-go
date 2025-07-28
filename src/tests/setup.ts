import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
vi.stubEnv('PUBLIC_SUPABASE_URL', 'http://localhost:54321');
vi.stubEnv('PUBLIC_SUPABASE_ANON_KEY', 'mock-anon-key');

// Mock SvelteKit modules
vi.mock('$app/environment', () => ({
  browser: false,
  dev: true,
  building: false,
  version: 'test'
}));

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidate: vi.fn(),
  invalidateAll: vi.fn(),
  pushState: vi.fn(),
  replaceState: vi.fn()
}));

vi.mock('$app/stores', () => {
  const readable = (value: any) => ({
    subscribe: vi.fn((fn) => {
      fn(value);
      return vi.fn();
    })
  });
  
  return {
    page: readable({ url: new URL('http://localhost:5173'), params: {} }),
    navigating: readable(null),
    updated: readable(false)
  };
});

// Mock fetch for tests
global.fetch = vi.fn();

// Setup ResizeObserver mock
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Setup IntersectionObserver mock
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));