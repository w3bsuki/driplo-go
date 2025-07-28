import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import Stripe from 'stripe';
import { emailService } from '$lib/server/email';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20'
});

export const POST: RequestHandler = async ({ locals, params, request }) => {
  const supabase = locals.supabase;
  const { session } = await locals.safeGetSession();

  if (!session) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orderId = params.id;
  const { reason, refund_type = 'full' } = await request.json();

  if (!reason || reason.trim().length < 10) {
    return json({ error: 'Please provide a detailed reason for the refund request' }, { status: 400 });
  }

  try {
    // Get order details with transaction
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        buyer:profiles!orders_buyer_id_fkey (
          id,
          username,
          email
        ),
        seller:profiles!orders_seller_id_fkey (
          id,
          username,
          email
        ),
        order_items (
          *,
          listing:listings (
            id,
            title,
            price,
            images
          )
        ),
        transaction:transactions (
          id,
          stripe_payment_intent_id,
          stripe_charge_id,
          amount,
          currency,
          status
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user is the buyer
    if (session.user.id !== order.buyer_id) {
      return json({ error: 'Only the buyer can request a refund' }, { status: 403 });
    }

    // Check if order is eligible for refund
    if (!['delivered', 'completed', 'shipped'].includes(order.status)) {
      return json({ error: 'Order is not eligible for refund in current status' }, { status: 400 });
    }

    // Check if refund request already exists
    const { data: existingRefund } = await supabase
      .from('refund_requests')
      .select('id, status')
      .eq('order_id', orderId)
      .single();

    if (existingRefund) {
      return json({ 
        error: `Refund request already exists with status: ${existingRefund.status}` 
      }, { status: 400 });
    }

    // Create refund request
    const { data: refundRequest, error: refundError } = await supabase
      .from('refund_requests')
      .insert({
        order_id: orderId,
        buyer_id: order.buyer_id,
        seller_id: order.seller_id,
        transaction_id: order.transaction?.id,
        amount: order.transaction?.amount || 0,
        currency: order.transaction?.currency || 'usd',
        reason,
        refund_type,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (refundError) {
      console.error('Error creating refund request:', refundError);
      return json({ error: 'Failed to create refund request' }, { status: 500 });
    }

    // Send email notification to seller
    if (order.seller?.email) {
      await emailService.sendRefundRequestNotification(
        order.seller,
        order.buyer,
        order,
        refundRequest
      );
    }

    // Update order status to indicate refund requested
    await supabase
      .from('orders')
      .update({
        status: 'refund_requested',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    return json({
      success: true,
      message: 'Refund request submitted successfully',
      refund_request: refundRequest
    });

  } catch (error) {
    console.error('Error processing refund request:', error);
    return json({ error: 'Failed to process refund request' }, { status: 500 });
  }
};

// Seller responds to refund request
export const PATCH: RequestHandler = async ({ locals, params, request }) => {
  const supabase = locals.supabase;
  const { session } = await locals.safeGetSession();

  if (!session) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orderId = params.id;
  const { action, response_notes } = await request.json();

  if (!action || !['approve', 'reject'].includes(action)) {
    return json({ error: 'Invalid action. Must be approve or reject' }, { status: 400 });
  }

  try {
    // Get refund request
    const { data: refundRequest, error: refundError } = await supabase
      .from('refund_requests')
      .select(`
        *,
        order:orders (
          *,
          buyer:profiles!orders_buyer_id_fkey (
            id,
            username,
            email
          ),
          seller:profiles!orders_seller_id_fkey (
            id,
            username,
            email
          ),
          transaction:transactions (
            id,
            stripe_payment_intent_id,
            stripe_charge_id,
            amount,
            currency
          )
        )
      `)
      .eq('order_id', orderId)
      .eq('status', 'pending')
      .single();

    if (refundError || !refundRequest) {
      return json({ error: 'Refund request not found' }, { status: 404 });
    }

    // Check if user is the seller
    if (session.user.id !== refundRequest.seller_id) {
      return json({ error: 'Only the seller can respond to this refund request' }, { status: 403 });
    }

    if (action === 'approve') {
      // Update refund request to approved
      await supabase
        .from('refund_requests')
        .update({
          status: 'approved',
          seller_response: response_notes,
          seller_response_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', refundRequest.id);

      // Process refund via Stripe
      if (refundRequest.order.transaction?.stripe_payment_intent_id) {
        try {
          const refund = await stripe.refunds.create({
            payment_intent: refundRequest.order.transaction.stripe_payment_intent_id,
            amount: refundRequest.refund_type === 'full' ? undefined : refundRequest.amount,
            reason: 'requested_by_customer',
            metadata: {
              order_id: orderId,
              refund_request_id: refundRequest.id
            }
          });

          // Update refund request with Stripe refund ID
          await supabase
            .from('refund_requests')
            .update({
              stripe_refund_id: refund.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', refundRequest.id);

          // Update order status
          await supabase
            .from('orders')
            .update({
              status: 'refunded',
              updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        } catch (stripeError) {
          console.error('Stripe refund error:', stripeError);
          // Update refund request to failed
          await supabase
            .from('refund_requests')
            .update({
              status: 'failed',
              error_message: stripeError.message,
              updated_at: new Date().toISOString()
            })
            .eq('id', refundRequest.id);

          return json({ error: 'Failed to process refund payment' }, { status: 500 });
        }
      }

      // Send approval email to buyer
      if (refundRequest.order.buyer?.email) {
        await emailService.sendRefundApprovalNotification(
          refundRequest.order.buyer,
          refundRequest.order,
          refundRequest
        );
      }

      return json({
        success: true,
        message: 'Refund approved and processed successfully'
      });

    } else {
      // Reject refund request
      await supabase
        .from('refund_requests')
        .update({
          status: 'rejected',
          seller_response: response_notes,
          seller_response_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', refundRequest.id);

      // Update order status back to completed
      await supabase
        .from('orders')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      // Send rejection email to buyer
      if (refundRequest.order.buyer?.email) {
        await emailService.sendRefundRejectionNotification(
          refundRequest.order.buyer,
          refundRequest.order,
          refundRequest
        );
      }

      return json({
        success: true,
        message: 'Refund request rejected'
      });
    }

  } catch (error) {
    console.error('Error responding to refund request:', error);
    return json({ error: 'Failed to respond to refund request' }, { status: 500 });
  }
};