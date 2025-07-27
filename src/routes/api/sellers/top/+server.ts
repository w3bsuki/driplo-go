import type { RequestHandler } from './$types';
import { apiError, apiSuccess, ApiErrorType } from '$lib/server/api-utils';
import { z } from 'zod';
import type { TopSellersResponse } from '$lib/types/api.types';

const querySchema = z.object({
  period: z.enum(['week', 'month', 'year', 'all']).default('month'),
  limit: z.number().int().min(1).max(50).default(12)
});

export const GET: RequestHandler = async ({ locals, url }) => {
  const requestId = crypto.randomUUID();
  
  try {
    // Validate query parameters
    const parseResult = querySchema.safeParse({
      period: url.searchParams.get('period') || 'month',
      limit: parseInt(url.searchParams.get('limit') || '12')
    });
    
    if (!parseResult.success) {
      return apiError(
        'Invalid query parameters',
        400,
        ApiErrorType.VALIDATION,
        { errors: parseResult.error.flatten() },
        requestId
      );
    }
    
    const { period, limit } = parseResult.data;
    
    // Call the database function
    const { data, error } = await locals.supabase
      .rpc('get_top_sellers', { 
        time_period: period,
        result_limit: limit 
      });
    
    if (error) {
      return apiError(
        'Failed to fetch top sellers',
        500,
        ApiErrorType.DATABASE,
        undefined,
        requestId
      );
    }
    
    // Add ranking to sellers
    const sellersWithRank = (data || []).map((seller, index) => ({
      ...seller,
      rank: index + 1
    }));
    
    const response: TopSellersResponse = {
      sellers: sellersWithRank,
      period,
      totalCount: sellersWithRank.length
    };
    
    return apiSuccess(response, 200, requestId);
  } catch (err) {
    return apiError(
      'An unexpected error occurred',
      500,
      ApiErrorType.INTERNAL,
      undefined,
      requestId
    );
  }
};