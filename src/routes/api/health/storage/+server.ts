import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    // Test storage connection by listing buckets
    const startTime = Date.now();
    const { data, error } = await locals.supabase.storage.listBuckets();
    const responseTime = Date.now() - startTime;

    if (error) {
      return json({
        status: 'error',
        service: 'storage',
        error: error.message,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    // Check if our required buckets exist
    const requiredBuckets = ['avatars', 'listings'];
    const existingBuckets = data.map(b => b.name);
    const missingBuckets = requiredBuckets.filter(b => !existingBuckets.includes(b));

    if (missingBuckets.length > 0) {
      return json({
        status: 'warning',
        service: 'storage',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        warning: `Missing buckets: ${missingBuckets.join(', ')}`
      }, { status: 200 });
    }

    return json({
      status: 'ok',
      service: 'storage',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      buckets: existingBuckets
    });
  } catch (error) {
    return json({
      status: 'error',
      service: 'storage',
      error: 'Storage connection failed',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
};