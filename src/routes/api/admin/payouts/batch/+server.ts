import type { RequestHandler } from './$types';
import { 
  apiError, 
  apiSuccess, 
  requireAdmin, 
  parseRequestBody,
  validateUUID,
  handleDatabaseError 
} from '$lib/server/api-utils';
import { logAdminAction, AdminActions, ResourceTypes } from '$lib/server/audit';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Require admin authentication
    const auth = await requireAdmin(locals);
    if (!auth) {
      return apiError('Admin access required', 403);
    }

    // Parse request body
    const body = await parseRequestBody<{ 
      payout_ids: string[]; 
      action: 'approve' | 'reject';
      notes?: string;
    }>(request);

    const { payout_ids, action, notes } = body;

    // Validate inputs
    if (!payout_ids || !Array.isArray(payout_ids) || payout_ids.length === 0) {
      return apiError('Invalid payout IDs', 400);
    }

    if (payout_ids.length > 50) {
      return apiError('Cannot process more than 50 payouts at once', 400);
    }

    // Validate all IDs are valid UUIDs
    for (const id of payout_ids) {
      if (!validateUUID(id)) {
        return apiError(`Invalid payout ID: ${id}`, 400);
      }
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return apiError('Invalid action. Must be "approve" or "reject"', 400);
    }

    const userId = auth.userId;
    const results = {
      successful: [] as string[],
      failed: [] as { id: string; error: string }[]
    };

    // Process each payout
    for (const payoutId of payout_ids) {
      try {
        if (action === 'approve') {
          // Update payout status to completed
          const { data: updatedPayout, error: payoutError } = await locals.supabase
            .from('seller_payouts')
            .update({
              status: 'completed',
              processed_by: userId,
              processed_at: new Date().toISOString(),
              admin_notes: notes || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', payoutId)
            .eq('status', 'processing') // Only update if status is processing
            .select()
            .single();

          if (payoutError) {
            handleDatabaseError(payoutError);
            results.failed.push({ id: payoutId, error: payoutError.message });
            continue;
          }

          // Update transaction payout status
          await locals.supabase
            .from('transactions')
            .update({
              seller_payout_status: 'completed',
              payout_processed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', updatedPayout.transaction_id);

          // Log admin action
          await logAdminAction(locals.supabase, {
            action: AdminActions.PAYOUT_APPROVE,
            resourceType: ResourceTypes.PAYOUT,
            resourceId: payoutId,
            details: {
              amount: updatedPayout.amount,
              seller_id: updatedPayout.seller_id,
              transaction_id: updatedPayout.transaction_id,
              notes,
              batch_operation: true
            }
          });

          results.successful.push(payoutId);

        } else if (action === 'reject') {
          // Update payout status to failed
          const { data: updatedPayout, error: payoutError } = await locals.supabase
            .from('seller_payouts')
            .update({
              status: 'failed',
              processed_by: userId,
              processed_at: new Date().toISOString(),
              admin_notes: notes || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', payoutId)
            .eq('status', 'processing') // Only update if status is processing
            .select()
            .single();

          if (payoutError) {
            handleDatabaseError(payoutError);
            results.failed.push({ id: payoutId, error: payoutError.message });
            continue;
          }

          // Update transaction payout status
          await locals.supabase
            .from('transactions')
            .update({
              seller_payout_status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', updatedPayout.transaction_id);

          // Log admin action
          await logAdminAction(locals.supabase, {
            action: AdminActions.PAYOUT_REJECT,
            resourceType: ResourceTypes.PAYOUT,
            resourceId: payoutId,
            details: {
              amount: updatedPayout.amount,
              seller_id: updatedPayout.seller_id,
              transaction_id: updatedPayout.transaction_id,
              notes,
              batch_operation: true
            }
          });

          results.successful.push(payoutId);
        }
      } catch (error: any) {
        results.failed.push({ 
          id: payoutId, 
          error: error.message || 'Unknown error' 
        });
      }
    }

    const totalProcessed = results.successful.length;
    const totalFailed = results.failed.length;

    return apiSuccess({
      message: `Batch ${action} completed: ${totalProcessed} successful, ${totalFailed} failed`,
      results,
      summary: {
        total: payout_ids.length,
        successful: totalProcessed,
        failed: totalFailed
      }
    });

  } catch (error) {
    console.error('Batch payout processing error:', error);
    return apiError('Failed to process batch payouts', 500);
  }
};