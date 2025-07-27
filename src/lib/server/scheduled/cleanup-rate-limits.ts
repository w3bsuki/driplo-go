import { cleanupExpiredRateLimits } from '$lib/server/database-rate-limit';

/**
 * Cleanup expired rate limit entries
 * This should be run periodically (e.g., every hour) via a cron job or scheduled function
 */
export async function runRateLimitCleanup() {
  try {
    const deletedCount = await cleanupExpiredRateLimits();
    console.log(`[Rate Limit Cleanup] Deleted ${deletedCount} expired entries`);
    return {
      success: true,
      deletedCount
    };
  } catch (error) {
    console.error('[Rate Limit Cleanup] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Example: Run this via a scheduled endpoint or external cron service
// You could create an API endpoint like /api/cron/cleanup-rate-limits
// and call it periodically from an external service or Supabase Edge Function