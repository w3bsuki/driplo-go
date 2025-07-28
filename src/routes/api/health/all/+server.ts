import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  const services = ['', 'db', 'stripe', 'storage'];
  const results: Record<string, any> = {};
  let overallStatus = 'ok';
  let statusCode = 200;

  // Check all services in parallel
  const checks = await Promise.allSettled(
    services.map(async (service) => {
      const path = service ? `/api/health/${service}` : '/api/health';
      const url = new URL(path, event.url.origin);
      
      try {
        const response = await fetch(url, {
          headers: {
            // Pass along any necessary headers
            'Authorization': event.request.headers.get('Authorization') || ''
          }
        });
        
        const data = await response.json();
        return { service: service || 'api', data, status: response.status };
      } catch (error) {
        return { 
          service: service || 'api', 
          data: { 
            status: 'error', 
            error: 'Health check failed',
            timestamp: new Date().toISOString()
          }, 
          status: 503 
        };
      }
    })
  );

  // Process results
  checks.forEach((result) => {
    if (result.status === 'fulfilled') {
      const { service, data, status } = result.value;
      results[service] = data;
      
      if (data.status !== 'ok') {
        overallStatus = data.status === 'warning' && overallStatus === 'ok' ? 'warning' : 'error';
        if (status !== 200 && statusCode === 200) {
          statusCode = status;
        }
      }
    } else {
      const service = services[checks.indexOf(result)] || 'api';
      results[service] = {
        status: 'error',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      };
      overallStatus = 'error';
      statusCode = 503;
    }
  });

  return json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services: results
  }, { status: statusCode });
};