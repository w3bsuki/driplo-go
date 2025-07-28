# Web Vitals Performance Monitoring

## Overview

Web Vitals tracking has been implemented to monitor real user performance metrics. The implementation automatically tracks Core Web Vitals and sends them to Sentry for performance monitoring.

## Tracked Metrics

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: Measures loading performance
  - Good: ≤ 2.5s
  - Needs Improvement: ≤ 4.0s
  - Poor: > 4.0s

- **FID (First Input Delay)**: Measures interactivity
  - Good: ≤ 100ms
  - Needs Improvement: ≤ 300ms
  - Poor: > 300ms

- **CLS (Cumulative Layout Shift)**: Measures visual stability
  - Good: ≤ 0.1
  - Needs Improvement: ≤ 0.25
  - Poor: > 0.25

### Additional Metrics
- **FCP (First Contentful Paint)**: When first content appears
- **TTFB (Time to First Byte)**: Server response time
- **INP (Interaction to Next Paint)**: New metric replacing FID

## Implementation Details

### File Structure
```
src/
├── lib/
│   └── utils/
│       └── webVitals.ts         # Web Vitals utilities and tracking
├── hooks.client.ts              # Integration with app initialization
└── routes/
    └── api/
        └── test-web-vitals/     # Test endpoint
```

### Key Features

1. **Automatic Tracking**: Web Vitals are automatically tracked on every page
2. **Sentry Integration**: Metrics are sent to Sentry for performance monitoring
3. **Development Logging**: In development mode, metrics are logged to console with emoji indicators
4. **Error Handling**: Graceful error handling prevents tracking errors from affecting the app
5. **Context Enrichment**: Metrics include additional context like pathname, connection type, and device memory

### Usage

#### Automatic Tracking
Web Vitals are automatically tracked. No additional code is needed in components.

#### Custom Metrics
To track custom performance metrics:

```typescript
import { reportCustomMetric } from '$lib/utils/webVitals';

// Track a custom timing
reportCustomMetric('api_response_time', 250, 'millisecond');

// Track a count
reportCustomMetric('images_loaded', 15, 'count');

// Track bytes
reportCustomMetric('bundle_size', 450000, 'byte');
```

### Viewing Metrics

#### In Development
- Open browser console to see real-time Web Vitals logging
- Good metrics: ✅
- Needs improvement: ⚠️
- Poor metrics: ❌

#### In Production (Sentry)
1. Go to Sentry dashboard
2. Navigate to Performance → Web Vitals
3. View metrics by:
   - Page
   - Browser
   - Connection type
   - Time period

### Performance Thresholds

The implementation uses Google's recommended thresholds for Web Vitals. Poor performance metrics are automatically flagged and sent to Sentry as warnings.

### Best Practices

1. **Optimize LCP**:
   - Use image lazy loading
   - Preload critical resources
   - Minimize render-blocking resources

2. **Improve FID/INP**:
   - Break up long tasks
   - Use web workers for heavy computation
   - Optimize JavaScript execution

3. **Reduce CLS**:
   - Set dimensions for images/videos
   - Avoid inserting content above existing content
   - Use CSS transforms instead of position changes

### Testing

To verify Web Vitals tracking:
1. Navigate to any page in development mode
2. Open browser console
3. Interact with the page
4. Check console for Web Vitals logs
5. Visit `/api/test-web-vitals` to verify the setup

### Troubleshooting

- **No metrics in console**: Check if `initWebVitals()` is called in hooks.client.ts
- **Metrics not in Sentry**: Verify `PUBLIC_SENTRY_DSN` is set
- **High CLS values**: Check for layout shifts, especially with lazy-loaded content
- **Poor LCP**: Analyze largest contentful paint element using Chrome DevTools