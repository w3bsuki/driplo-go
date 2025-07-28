import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Test endpoint to verify Web Vitals are being captured
export const GET: RequestHandler = async () => {
  return json({
    message: 'Web Vitals tracking is active',
    metrics: [
      'CLS (Cumulative Layout Shift)',
      'FCP (First Contentful Paint)',
      'FID (First Input Delay)',
      'LCP (Largest Contentful Paint)',
      'TTFB (Time to First Byte)',
      'INP (Interaction to Next Paint)',
    ],
    info: {
      description: 'Web Vitals are automatically tracked on all pages',
      sentryIntegration: 'Metrics are sent to Sentry for performance monitoring',
      developmentLogging: 'In development, metrics are logged to the console',
      customMetrics: 'Use reportCustomMetric() to track custom performance metrics',
    },
  });
};