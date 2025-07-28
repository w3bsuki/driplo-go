import { onCLS, onFCP, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';
import * as Sentry from '@sentry/sveltekit';
import { dev } from '$app/environment';

// Type for Web Vitals metric names
export type WebVitalName = 'CLS' | 'FCP' | 'LCP' | 'TTFB' | 'INP';

// Extended metric type with additional context
export interface WebVitalMetric extends Metric {
  // Additional context we might want to track
  pathname?: string;
  userAgent?: string;
  connectionType?: string;
  deviceMemory?: number;
}

// Thresholds based on Web Vitals recommendations
const THRESHOLDS = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  INP: { good: 200, needsImprovement: 500 },
};

// Get rating based on metric value
function getRating(name: WebVitalName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (!threshold) return 'poor';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

// Get additional context for the metric
function getMetricContext(): Partial<WebVitalMetric> {
  const context: Partial<WebVitalMetric> = {
    pathname: window.location.pathname,
    userAgent: navigator.userAgent,
  };

  // Add connection type if available
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection) {
      context.connectionType = connection.effectiveType;
    }
  }

  // Add device memory if available
  if ('deviceMemory' in navigator) {
    context.deviceMemory = (navigator as any).deviceMemory;
  }

  return context;
}

// Send metric to Sentry
function sendToSentry(metric: Metric & Partial<WebVitalMetric>) {
  if (!window.Sentry) return;

  const rating = getRating(metric.name as WebVitalName, metric.value);
  
  // Create a custom measurement
  const transaction = Sentry.getCurrentScope().getTransaction();
  if (transaction) {
    transaction.setMeasurement(
      `web_vital_${metric.name.toLowerCase()}`,
      metric.value,
      metric.name === 'CLS' ? '' : 'millisecond'
    );
  }

  // Send as custom event with context
  Sentry.addBreadcrumb({
    category: 'web-vitals',
    message: `${metric.name}: ${metric.value}`,
    level: rating === 'poor' ? 'warning' : 'info',
    data: {
      metric: metric.name,
      value: metric.value,
      rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
      pathname: metric.pathname,
      connectionType: metric.connectionType,
      deviceMemory: metric.deviceMemory,
    },
  });

  // For poor performance, capture as a message
  if (rating === 'poor') {
    Sentry.captureMessage(
      `Poor ${metric.name} performance: ${metric.value}`,
      {
        level: 'warning',
        tags: {
          'web_vital.name': metric.name,
          'web_vital.rating': rating,
        },
        contexts: {
          trace: {
            trace_id: metric.id,
            span_id: metric.id,
          },
          web_vital: {
            name: metric.name,
            value: metric.value,
            delta: metric.delta,
            rating,
            entries: metric.entries?.length || 0,
            navigationType: metric.navigationType,
          },
        },
        extra: {
          pathname: metric.pathname,
          connectionType: metric.connectionType,
          deviceMemory: metric.deviceMemory,
          userAgent: metric.userAgent,
        },
      }
    );
  }
}

// Log metric in development
function logMetric(metric: Metric & Partial<WebVitalMetric>) {
  if (!dev) return;

  const rating = getRating(metric.name as WebVitalName, metric.value);
  const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
  
  console.group(`${emoji} Web Vital: ${metric.name}`);
  console.log('Value:', metric.value);
  console.log('Rating:', rating);
  console.log('Delta:', metric.delta);
  console.log('ID:', metric.id);
  console.log('Navigation Type:', metric.navigationType);
  if (metric.pathname) console.log('Path:', metric.pathname);
  if (metric.connectionType) console.log('Connection:', metric.connectionType);
  if (metric.deviceMemory) console.log('Device Memory:', metric.deviceMemory);
  if (metric.entries?.length) {
    console.log('Entries:', metric.entries);
  }
  console.groupEnd();
}

// Handler for all metrics
function handleMetric(metric: Metric) {
  try {
    // Add context to metric
    const enrichedMetric = {
      ...metric,
      ...getMetricContext(),
    };

    // Log in development
    logMetric(enrichedMetric);

    // Send to Sentry
    sendToSentry(enrichedMetric);
  } catch (error) {
    // Don't let Web Vitals errors break the app
    if (dev) {
      console.error('Error handling Web Vital metric:', error);
    }
  }
}

// Initialize Web Vitals tracking
export function initWebVitals() {
  try {
    // Only initialize once
    if ((window as any).__webVitalsInitialized) {
      return;
    }
    (window as any).__webVitalsInitialized = true;

    // Core Web Vitals
    onCLS(handleMetric, { reportAllChanges: dev });
    onLCP(handleMetric, { reportAllChanges: dev });
    onINP(handleMetric, { reportAllChanges: dev }); // INP replaced FID in web-vitals v5

    // Other metrics
    onFCP(handleMetric, { reportAllChanges: dev });
    onTTFB(handleMetric, { reportAllChanges: dev });

    if (dev) {
      console.log('🚀 Web Vitals tracking initialized');
    }
  } catch (error) {
    if (dev) {
      console.error('Failed to initialize Web Vitals:', error);
    }
  }
}

// Manual metric reporting (useful for custom metrics)
export function reportCustomMetric(
  name: string,
  value: number,
  unit: 'millisecond' | 'byte' | 'count' = 'millisecond'
) {
  try {
    const customMetric = {
      name,
      value,
      delta: value,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      navigationType: 'navigate' as const,
      entries: [],
      ...getMetricContext(),
    };

    if (dev) {
      console.log(`📊 Custom Metric: ${name}`, value, unit);
    }

    if (window.Sentry) {
      const transaction = Sentry.getCurrentScope().getTransaction();
      if (transaction) {
        transaction.setMeasurement(name, value, unit);
      }

      Sentry.addBreadcrumb({
        category: 'custom-metric',
        message: `${name}: ${value} ${unit}`,
        level: 'info',
        data: customMetric,
      });
    }
  } catch (error) {
    if (dev) {
      console.error('Error reporting custom metric:', error);
    }
  }
}

// Export types
export type { Metric };