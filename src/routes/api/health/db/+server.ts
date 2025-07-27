import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    // Test database connection with a simple query
    const startTime = Date.now();
    const { data, error } = await locals.supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    const responseTime = Date.now() - startTime;

    if (error) {
      return json({
        status: 'error',
        service: 'database',
        error: error.message,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    return json({
      status: 'ok',
      service: 'database',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return json({
      status: 'error',
      service: 'database',
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
};