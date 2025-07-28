# Error Boundary System Documentation

## Overview

This SvelteKit application implements a comprehensive error boundary system to prevent crashes and provide graceful error handling across the entire application.

## Features

- ✅ **Multiple Error Boundary Levels**: Minimal, detailed, and custom fallback options
- ✅ **Svelte 5 Compatible**: Uses modern Svelte 5 patterns and runes
- ✅ **Route-Specific Error Pages**: Custom error pages for different route groups
- ✅ **Component-Level Protection**: Critical components wrapped with error boundaries
- ✅ **Server-Side Error Handling**: Comprehensive error handling in hooks.server.ts
- ✅ **Standardized API Responses**: Consistent error response format across all APIs
- ✅ **Development vs Production**: Different error detail levels for different environments
- ✅ **Error Tracking Ready**: Prepared for integration with error tracking services

## Components

### ErrorBoundary.svelte

The main error boundary component with configurable behavior:

```svelte
<ErrorBoundary 
  level="detailed"
  isolate={true}
  onError={(error, context) => console.error('Error caught:', error)}
  resetKeys={[userId, currentPage]}
>
  <YourComponent />
</ErrorBoundary>
```

#### Props

- **`level`**: `'minimal' | 'detailed' | 'custom'`
  - `minimal`: Simple inline error message with retry button
  - `detailed`: Full error UI with development details (default)
  - `custom`: Use custom fallback HTML

- **`isolate`**: `boolean` (default: `false`)
  - `true`: Prevents error from bubbling up to parent boundaries
  - `false`: Allows error to bubble up if not handled

- **`onError`**: `(error: any, context: any) => void`
  - Custom error handler function for logging/reporting

- **`resetKeys`**: `any[]`
  - Error boundary resets when any of these values change

- **`fallback`**: `string`
  - Custom HTML fallback (used with `level="custom"`)

- **`reset`**: `() => void`
  - Custom reset function

## Error Pages

### Route-Specific Error Pages

1. **Root Error Page** (`/+error.svelte`)
   - Handles general application errors
   - Shows appropriate error based on status code (404, 403, 500, etc.)

2. **Auth Error Page** (`/(auth)/+error.svelte`)
   - Specialized for authentication errors
   - Provides auth-specific recovery options
   - Branded with logo and auth-specific styling

3. **App Error Page** (`/(app)/+error.svelte`)
   - Context-aware error handling for app routes
   - Category-specific error messages (payment, listing, profile, etc.)
   - Includes header navigation for consistency

## Implementation Strategy

### 1. Layout-Level Protection

The root layout (`+layout.svelte`) includes error boundaries at multiple levels:

```svelte
<ErrorBoundary level="detailed" resetKeys={[data.user?.id, $page.url.pathname]}>
  <!-- Outer boundary for entire app -->
  
  <ErrorBoundary level="minimal" isolate={true}>
    <Header />
  </ErrorBoundary>
  
  <main>
    <ErrorBoundary level="detailed" isolate={true} resetKeys={[$page.url.pathname]}>
      <slot />
    </ErrorBoundary>
  </main>
  
  <ErrorBoundary level="minimal" isolate={true}>
    <MobileNav />
  </ErrorBoundary>
</ErrorBoundary>
```

### 2. Component-Level Protection

Critical components are wrapped with appropriate error boundaries:

#### Checkout Flow
```svelte
<ErrorBoundary level="detailed" isolate={true} resetKeys={[listing.id, isOpen]}>
  <CheckoutFlow {listing} {isOpen} />
</ErrorBoundary>
```

#### Message Thread
```svelte
<ErrorBoundary level="detailed" isolate={true} resetKeys={[conversationId, userId]}>
  <MessageThread {conversationId} {userId} />
</ErrorBoundary>
```

#### Create Listing Form
```svelte
<ErrorBoundary level="detailed" isolate={true} resetKeys={[open]}>
  <CreateListingForm {open} />
</ErrorBoundary>
```

### 3. Server-Side Error Handling

Enhanced `hooks.server.ts` with comprehensive error handling:

- **Individual handle function protection**: Each middleware wrapped in try-catch
- **Graceful degradation**: Fallback behavior when subsystems fail
- **Global error handler**: `handleError` export for unhandled server errors
- **Detailed error logging**: Context-rich error information

### 4. API Response Standardization

Standardized API error responses using `api-response.ts`:

```typescript
// Success response
return apiSuccess(data);

// Error response
return apiError('User not found', 404, event);

// Wrapped handler with automatic error handling
export const POST = withErrorHandling(async (event) => {
  // Your API logic here
  return apiSuccess(result);
});
```

## Error Types Handled

### 1. Network Errors
- API timeouts
- Connection failures
- Server errors (5xx)

### 2. Authentication Errors
- Session expired
- Invalid credentials
- Permission denied

### 3. Payment Errors
- Card declined
- Payment processing failures
- Stripe integration errors

### 4. Runtime Errors
- JavaScript errors
- Component crashes
- Async operation failures

### 5. Validation Errors
- Form validation failures
- Data integrity issues
- Missing required fields

## Error Logging

All errors are logged with comprehensive context:

```javascript
{
  error: error.message,
  stack: error.stack,
  url: event.url.pathname,
  method: event.request.method,
  userAgent: navigator.userAgent,
  timestamp: new Date().toISOString(),
  errorId: 'error-1234567890-abcdef',
  handler: 'errorBoundary'
}
```

## Development vs Production

### Development Mode
- Full error details displayed
- Stack traces shown
- Console error logging
- Technical error information

### Production Mode
- User-friendly error messages
- Sanitized error information
- Error tracking service integration
- Minimal technical details

## Testing

Visit `/test-error-boundaries` to test different error scenarios:

1. **Render Errors**: Component initialization failures
2. **Async Errors**: Promise rejections and async operation failures
3. **Network Errors**: API call failures
4. **Unhandled Rejections**: Promise rejections not caught

## Integration with Error Tracking

The system is prepared for integration with error tracking services like Sentry:

```javascript
// In production error handler
if (!dev && browser) {
  Sentry.captureException(error, {
    extra: context,
    tags: {
      errorBoundary: true,
      component: componentName
    }
  });
}
```

## Best Practices

### 1. Error Boundary Placement
- **Layout Level**: Catch application-wide errors
- **Feature Level**: Isolate errors to specific features
- **Component Level**: Protect critical individual components

### 2. Error Recovery
- Use `resetKeys` to automatically recover from errors when context changes
- Provide clear recovery actions (retry, navigate home, reload)
- Preserve user data when possible

### 3. Error Messages
- Production: User-friendly, actionable messages
- Development: Technical details for debugging
- Context-specific: Different messages for different error types

### 4. Error Isolation
- Use `isolate={true}` for non-critical components
- Allow critical errors to bubble up for handling at app level
- Balance between error isolation and user experience

## Future Enhancements

1. **Error Tracking Integration**: Full Sentry or similar service integration
2. **Error Recovery Suggestions**: Smart suggestions based on error type
3. **Offline Error Handling**: Special handling for offline scenarios
4. **Error Analytics**: Track error patterns and user impact
5. **A/B Testing**: Test different error UI approaches

## API Reference

### ErrorBoundary Component

```typescript
interface ErrorBoundaryProps {
  error?: any;
  reset?: (() => void) | null;
  fallback?: string | null;
  level?: 'minimal' | 'detailed' | 'custom';
  isolate?: boolean;
  onError?: ((error: any, errorInfo: any) => void) | null;
  resetKeys?: any[];
}
```

### API Response Utilities

```typescript
// Create success response
apiSuccess<T>(data: T, meta?: object): Response

// Create error response  
apiError(error: string | Error, status?: number, event?: RequestEvent): Response

// Wrap handler with error handling
withErrorHandling<T>(handler: (event: RequestEvent) => Promise<Response>): (event: RequestEvent) => Promise<Response>

// Validate authentication
validateAuth(event: RequestEvent): Promise<{user: any, session: any}>

// Validate request body
validateBody<T>(event: RequestEvent, requiredFields?: string[]): Promise<T>
```

This error boundary system provides comprehensive protection against crashes while maintaining excellent user experience and developer productivity.