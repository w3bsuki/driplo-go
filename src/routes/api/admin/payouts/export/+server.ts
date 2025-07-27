import type { RequestHandler } from './$types';
import { apiError, requireAdmin } from '$lib/server/api-utils';

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    // Require admin authentication
    const auth = await requireAdmin(locals);
    if (!auth) {
      return apiError('Admin access required', 403);
    }

    // Get export parameters
    const format = url.searchParams.get('format') || 'csv';
    const status = url.searchParams.get('status') || 'all';
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    // Build query
    let query = locals.supabase
      .from('seller_payouts')
      .select(`
        *,
        transaction:transactions(
          id,
          amount,
          currency,
          status,
          created_at,
          buyer_fee_amount,
          platform_fee_amount,
          listing:listings(
            id,
            title,
            price
          ),
          buyer:buyer_id(
            id,
            email,
            username
          )
        ),
        seller:seller_id(
          id,
          email,
          username
        )
      `)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: payouts, error } = await query;

    if (error) {
      throw error;
    }

    // Format data based on requested format
    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Payout ID',
        'Transaction ID',
        'Created Date',
        'Processed Date',
        'Status',
        'Seller Email',
        'Seller Username',
        'Seller Revtag',
        'Buyer Email',
        'Buyer Username',
        'Item Title',
        'Transaction Amount',
        'Platform Fee',
        'Seller Payout',
        'Processed By',
        'Notes'
      ];

      const rows = payouts?.map(payout => [
        payout.id,
        payout.transaction_id,
        new Date(payout.created_at).toISOString(),
        payout.processed_at ? new Date(payout.processed_at).toISOString() : '',
        payout.status,
        payout.seller?.email || '',
        payout.seller?.username || '',
        payout.seller_revtag || '',
        payout.transaction?.buyer?.email || '',
        payout.transaction?.buyer?.username || '',
        payout.transaction?.listing?.title || '',
        payout.transaction?.amount || 0,
        payout.transaction?.platform_fee_amount || 0,
        payout.amount,
        payout.processed_by || '',
        payout.admin_notes || payout.notes || ''
      ]) || [];

      // Build CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(cell => {
            // Escape values containing commas or quotes
            const value = String(cell);
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Return CSV response
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="payouts_export_${new Date().toISOString().split('T')[0]}.csv"`,
          'Cache-Control': 'no-cache'
        }
      });

    } else if (format === 'json') {
      // Return JSON response
      return new Response(JSON.stringify({ payouts }, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="payouts_export_${new Date().toISOString().split('T')[0]}.json"`,
          'Cache-Control': 'no-cache'
        }
      });
    } else {
      return apiError('Invalid format. Supported formats: csv, json', 400);
    }

  } catch (error) {
    console.error('Payout export error:', error);
    return apiError('Failed to export payouts', 500);
  }
};