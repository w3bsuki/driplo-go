import { json, text } from '@sveltejs/kit';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import type { RequestHandler } from './$types';
import { emailService } from '$lib/server/email';
import { rateLimiters } from '$lib/server/rate-limit';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20'
});

export const POST: RequestHandler = async (event) => {
  const { request, locals } = event;
  
  // Apply rate limiting (per IP for webhooks)
  const rateLimitResponse = await rateLimiters.webhook(event);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  
  // Get signature before parsing body to ensure proper verification
  const signature = request.headers.get('stripe-signature');
  
  if (!signature) {
    console.warn('Webhook request missing signature');
    return json({ error: 'Missing signature' }, { status: 400 });
  }

  // Check request size to prevent abuse (Stripe webhooks are typically < 1MB)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
    console.warn('Webhook request too large:', contentLength);
    return json({ error: 'Request too large' }, { status: 413 });
  }

  const supabase = locals.supabase;
  const body = await request.text();
  
  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Check if we've already processed this event (idempotency)
  const { data: existingEvent } = await supabase
    .from('stripe_webhook_events')
    .select('id')
    .eq('stripe_event_id', stripeEvent.id)
    .single();

  if (existingEvent) {
    console.log('Event already processed:', stripeEvent.id);
    return json({ received: true });
  }

  // Record the event
  await supabase
    .from('stripe_webhook_events')
    .insert({
      stripe_event_id: stripeEvent.id,
      event_type: stripeEvent.type,
      created_at: new Date().toISOString()
    });

  try {
    switch (stripeEvent.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.order_id;

        if (!orderId) {
          console.error('No order_id in payment intent metadata');
          break;
        }

        // Update transaction status
        const { error: updateError } = await supabase
          .from('transactions')
          .update({
            status: 'paid',
            stripe_charge_id: paymentIntent.latest_charge as string,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (updateError) {
          console.error('Failed to update transaction:', updateError);
          throw updateError;
        }

        // Update listing status to sold
        const { error: listingError } = await supabase
          .from('listings')
          .update({
            status: 'sold',
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentIntent.metadata.listing_id);

        if (listingError) {
          console.error('Failed to update listing:', listingError);
        }

        // Get buyer, seller, and listing details for emails
        const { data: transactionData } = await supabase
          .from('transactions')
          .select(`
            *,
            buyer:buyer_id(id, username, email),
            seller:seller_id(id, username, email),
            listing:listing_id(id, title, price)
          `)
          .eq('id', orderId)
          .single();

        if (transactionData && transactionData.buyer && transactionData.seller && transactionData.listing) {
          // Send confirmation emails
          await emailService.sendPaymentConfirmation(
            transactionData.buyer,
            transactionData.listing,
            transactionData
          );

          await emailService.sendSaleConfirmation(
            transactionData.seller,
            transactionData.buyer,
            transactionData.listing,
            transactionData
          );
        }

        console.log('Payment succeeded for order:', orderId);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.order_id;

        if (!orderId) break;

        // Update transaction status
        await supabase
          .from('transactions')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        console.log('Payment failed for order:', orderId);
        break;
      }

      case 'charge.dispute.created': {
        const dispute = stripeEvent.data.object as Stripe.Dispute;
        const paymentIntentId = dispute.payment_intent as string;

        // Find transaction by payment intent
        const { data: transaction } = await supabase
          .from('transactions')
          .select('*')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .single();

        if (transaction) {
          // Update transaction with dispute status
          await supabase
            .from('transactions')
            .update({
              status: 'disputed',
              updated_at: new Date().toISOString()
            })
            .eq('id', transaction.id);

          // Pause any pending payouts
          await supabase
            .from('seller_payouts')
            .update({
              status: 'on_hold',
              notes: 'Payment disputed by buyer',
              updated_at: new Date().toISOString()
            })
            .eq('transaction_id', transaction.id)
            .eq('status', 'pending');

          // Get seller and listing details for dispute email
          const { data: disputeData } = await supabase
            .from('transactions')
            .select(`
              *,
              seller:seller_id(id, username, email),
              listing:listing_id(id, title, price)
            `)
            .eq('id', transaction.id)
            .single();

          if (disputeData && disputeData.seller && disputeData.listing) {
            await emailService.sendDisputeAlert(
              disputeData.seller,
              disputeData.listing,
              disputeData
            );
          }

          console.log('Dispute created for transaction:', transaction.id);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = stripeEvent.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;
        const refundAmount = charge.amount_refunded;
        const isFullRefund = refundAmount === charge.amount;

        // Find transaction by payment intent or charge ID
        const { data: transaction } = await supabase
          .from('transactions')
          .select('*')
          .or(`stripe_payment_intent_id.eq.${paymentIntentId},stripe_charge_id.eq.${charge.id}`)
          .single();

        if (transaction) {
          // Update transaction status
          await supabase
            .from('transactions')
            .update({
              status: isFullRefund ? 'refunded' : 'partially_refunded',
              refund_amount: refundAmount,
              updated_at: new Date().toISOString()
            })
            .eq('id', transaction.id);

          // If full refund, reactivate the listing
          if (isFullRefund) {
            const { data: transactionData } = await supabase
              .from('transactions')
              .select('listing_id')
              .eq('id', transaction.id)
              .single();

            if (transactionData?.listing_id) {
              await supabase
                .from('listings')
                .update({
                  status: 'active',
                  updated_at: new Date().toISOString()
                })
                .eq('id', transactionData.listing_id);
            }
          }

          // Cancel any pending payouts
          await supabase
            .from('seller_payouts')
            .update({
              status: 'cancelled',
              notes: isFullRefund ? 'Payment fully refunded' : `Partial refund: ${refundAmount}`,
              updated_at: new Date().toISOString()
            })
            .eq('transaction_id', transaction.id)
            .eq('status', 'pending');

          // Get buyer details for refund email
          const { data: refundData } = await supabase
            .from('transactions')
            .select(`
              *,
              buyer:buyer_id(id, username, email),
              listing:listing_id(id, title, price)
            `)
            .eq('id', transaction.id)
            .single();

          if (refundData && refundData.buyer && refundData.listing) {
            await emailService.sendRefundNotification(
              refundData.buyer,
              refundData.listing,
              refundAmount,
              isFullRefund
            );
          }

          console.log(`Refund processed for transaction ${transaction.id}: ${isFullRefund ? 'Full' : 'Partial'} refund of ${refundAmount}`);
        }
        break;
      }

      case 'transfer.created': {
        const transfer = stripeEvent.data.object as Stripe.Transfer;
        const payoutId = transfer.metadata?.payout_id;

        if (payoutId) {
          // Update payout status to processing
          await supabase
            .from('seller_payouts')
            .update({
              status: 'processing',
              stripe_transfer_id: transfer.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', payoutId);

          // Get seller details for email
          const { data: payoutData } = await supabase
            .from('seller_payouts')
            .select(`
              *,
              seller:seller_id(id, username, email)
            `)
            .eq('id', payoutId)
            .single();

          if (payoutData && payoutData.seller) {
            await emailService.sendPayoutNotification(
              payoutData.seller,
              payoutData.amount,
              'processing'
            );
          }

          console.log('Transfer created for payout:', payoutId);
        }
        break;
      }

      case 'transfer.paid': {
        const transfer = stripeEvent.data.object as Stripe.Transfer;
        const payoutId = transfer.metadata?.payout_id;

        if (payoutId) {
          // Update payout status to completed
          await supabase
            .from('seller_payouts')
            .update({
              status: 'completed',
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', payoutId);

          // Get seller details for email
          const { data: payoutData } = await supabase
            .from('seller_payouts')
            .select(`
              *,
              seller:seller_id(id, username, email)
            `)
            .eq('id', payoutId)
            .single();

          if (payoutData && payoutData.seller) {
            await emailService.sendPayoutNotification(
              payoutData.seller,
              payoutData.amount,
              'completed'
            );
          }

          console.log('Transfer paid for payout:', payoutId);
        }
        break;
      }

      default:
        console.log('Unhandled event type:', stripeEvent.type);
    }

    // Mark event as processed
    await supabase
      .from('stripe_webhook_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString()
      })
      .eq('stripe_event_id', stripeEvent.id);

  } catch (error) {
    // Record error
    await supabase
      .from('stripe_webhook_events')
      .update({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('stripe_event_id', stripeEvent.id);

    console.error('Webhook processing error:', error);
    return json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return json({ received: true });
};