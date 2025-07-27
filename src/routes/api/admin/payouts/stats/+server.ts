import type { RequestHandler } from './$types';
import { apiError, apiSuccess, requireAdmin } from '$lib/server/api-utils';

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    // Require admin authentication
    const auth = await requireAdmin(locals);
    if (!auth) {
      return apiError('Admin access required', 403);
    }

    // Get date range from query params (default to last 30 days)
    const days = parseInt(url.searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get payout statistics
    const { data: payoutStats, error: statsError } = await locals.supabase
      .rpc('get_payout_statistics', {
        start_date: startDate.toISOString(),
        end_date: new Date().toISOString()
      });

    if (statsError) {
      // If the RPC doesn't exist, fallback to manual calculation
      const { data: payouts, error: payoutsError } = await locals.supabase
        .from('seller_payouts')
        .select('amount, status, created_at')
        .gte('created_at', startDate.toISOString());

      if (payoutsError) {
        throw payoutsError;
      }

      const stats = {
        total_payouts: payouts?.length || 0,
        total_amount: payouts?.reduce((sum, p) => sum + p.amount, 0) || 0,
        pending_count: payouts?.filter(p => p.status === 'pending').length || 0,
        pending_amount: payouts?.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0) || 0,
        processing_count: payouts?.filter(p => p.status === 'processing').length || 0,
        processing_amount: payouts?.filter(p => p.status === 'processing').reduce((sum, p) => sum + p.amount, 0) || 0,
        completed_count: payouts?.filter(p => p.status === 'completed').length || 0,
        completed_amount: payouts?.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0) || 0,
        failed_count: payouts?.filter(p => p.status === 'failed').length || 0,
        failed_amount: payouts?.filter(p => p.status === 'failed').reduce((sum, p) => sum + p.amount, 0) || 0
      };

      return apiSuccess({ stats, period: { days, startDate: startDate.toISOString() } });
    }

    return apiSuccess({ 
      stats: payoutStats, 
      period: { days, startDate: startDate.toISOString() } 
    });

  } catch (error) {
    console.error('Payout stats error:', error);
    return apiError('Failed to fetch payout statistics', 500);
  }
};