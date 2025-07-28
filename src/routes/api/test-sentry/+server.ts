import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';

export const GET: RequestHandler = async () => {
  // Only allow in development
  if (!dev) {
    return json({ error: 'Test endpoint only available in development' }, { status: 403 });
  }
  
  try {
    // Throw a test error
    throw new Error('Test Sentry error - this is intentional!');
  } catch (error) {
    // Error will be captured by Sentry
    throw error;
  }
};