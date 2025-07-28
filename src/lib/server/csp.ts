// Content Security Policy configuration
export function getCSPHeader(nonce: string): string {
  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      'https:',
      "'unsafe-inline'", // fallback for older browsers
      'https://js.stripe.com',
      'https://checkout.stripe.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // needed for Tailwind
      'https://fonts.googleapis.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://*.supabase.co', // Supabase storage
      'https://*.supabase.in', // Supabase storage (India region)
      'https://images.unsplash.com', // if using Unsplash images
      'https://avatars.githubusercontent.com' // GitHub avatars
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'https://*.supabase.in',
      'https://api.stripe.com',
      'wss://*.supabase.co', // WebSocket connections
      'wss://*.supabase.in'
    ],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'child-src': ["'self'"],
    'frame-src': [
      "'self'",
      'https://js.stripe.com', // Stripe Elements
      'https://hooks.stripe.com'
    ],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'manifest-src': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
    'upgrade-insecure-requests': []
  };

  // Convert directives object to CSP string
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

// Generate a secure nonce for inline scripts
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}