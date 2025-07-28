import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { 
  apiError, 
  apiSuccess, 
  requireAuth, 
  validateRequest,
  handleDatabaseError,
  ApiErrorType,
  ApiError,
  handleRequest,
  checkRateLimit,
  schemas,
  sanitizeInput
} from '$lib/server/api-utils';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20'
});

// Request validation schema
const createPaymentIntentSchema = z.object({
  listing_id: schemas.uuid,
  shipping_address: z.object({
    full_name: schemas.nonEmptyString,
    street_address: schemas.nonEmptyString,
    city: schemas.nonEmptyString,
    state_province: schemas.nonEmptyString,
    postal_code: schemas.nonEmptyString,
    country: schemas.nonEmptyString,
    phone: z.string().optional()
  })
});

type CreatePaymentIntentRequest = z.infer<typeof createPaymentIntentSchema>;

export const POST: RequestHandler = async (event) => {
  return handleRequest(event, async (context) => {
    console.log(`[${context.requestId}] Payment intent endpoint called`);
    
    // Check rate limit (5 payment attempts per minute per user)
    const auth = await requireAuth(event.locals, { requireProfile: true });
    if (!auth) {
      throw new ApiError(
        'Please log in to make a purchase',
        401,
        ApiErrorType.AUTHENTICATION
      );
    }
    
    const rateLimitResult = checkRateLimit(`payment_${auth.userId}`, 5, 60000);
    if (!rateLimitResult.allowed) {
      throw new ApiError(
        'Too many payment attempts. Please try again later.',
        429,
        ApiErrorType.RATE_LIMIT,
        { 
          remaining: rateLimitResult.remaining,
          resetTime: new Date(rateLimitResult.resetTime).toISOString()
        }
      );
    }
    
    // Validate request body
    const body = await validateRequest<CreatePaymentIntentRequest>(
      event.request,
      createPaymentIntentSchema
    );
    
    // Sanitize shipping address
    const sanitizedAddress = sanitizeInput(body.shipping_address, [
      'full_name',
      'street_address',
      'city',
      'state_province',
      'postal_code',
      'country',
      'phone'
    ]);
    
    const { listing_id } = body;
    const userId = auth.userId;

    // Get listing details with better error handling
    const { data: listing, error: listingError } = await event.locals.supabase
      .from('listings')
      .select('*')
      .eq('id', listing_id)
      .single();

    if (listingError) {
      if (listingError.code === 'PGRST116') {
        throw new ApiError(
          'Listing not found',
          404,
          ApiErrorType.NOT_FOUND,
          { listing_id }
        );
      }
      handleDatabaseError(listingError);
    }

    // Validation checks with specific error types
    if (listing.seller_id === userId) {
      throw new ApiError(
        'Cannot buy your own item',
        400,
        ApiErrorType.VALIDATION,
        { reason: 'self_purchase' }
      );
    }

    if (listing.status !== 'active') {
      throw new ApiError(
        'Listing is no longer available',
        400,
        ApiErrorType.VALIDATION,
        { 
          reason: 'listing_unavailable',
          status: listing.status 
        }
      );
    }

    // Calculate fees with precision
    const itemPrice = Number(listing.price);
    const shippingPrice = Number(listing.shipping_cost || 0);
    const subtotal = itemPrice + shippingPrice;
    
    // Buyer protection fee: 5% + $1.00
    const buyerFeePercentage = 5.0;
    const buyerFeeFixed = 1.00;
    const buyerFeeAmount = (subtotal * buyerFeePercentage / 100) + buyerFeeFixed;
    
    // Total amount buyer pays (in cents for Stripe)
    const totalAmount = Math.round((subtotal + buyerFeeAmount) * 100);
    
    // Amount seller will receive
    const sellerPayoutAmount = subtotal;

    // Generate unique order reference
    const orderRef = `DRIPLO-${Date.now()}-${listing_id.slice(-6)}`;

    try {
      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: 'usd',
        metadata: {
          order_id: orderRef,
          listing_id: listing_id,
          buyer_id: userId,
          seller_id: listing.seller_id,
          item_price: itemPrice.toString(),
          shipping_cost: shippingPrice.toString(),
          buyer_fee: buyerFeeAmount.toFixed(2),
          seller_payout: sellerPayoutAmount.toFixed(2)
        },
        description: `Purchase: ${listing.title}`,
        capture_method: 'automatic',
        receipt_email: auth.session.user.email
      });

      // Create transaction record
      const transactionData = {
        id: orderRef,
        listing_id: listing_id,
        buyer_id: userId,
        seller_id: listing.seller_id,
        amount: subtotal,
        currency: 'USD',
        status: 'pending',
        payment_method: 'stripe',
        stripe_payment_intent_id: paymentIntent.id,
        buyer_fee_amount: buyerFeeAmount,
        buyer_fee_percentage: buyerFeePercentage,
        platform_fee_amount: buyerFeeAmount,
        seller_payout_amount: sellerPayoutAmount,
        seller_payout_status: 'pending',
        shipping_address: sanitizedAddress,
        created_at: new Date().toISOString()
      };
      
      console.log(`[${context.requestId}] Creating transaction:`, orderRef);
      
      const { data: transaction, error: transactionError } = await event.locals.supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      if (transactionError) {
        // Cancel payment intent if transaction creation fails
        await stripe.paymentIntents.cancel(paymentIntent.id);
        handleDatabaseError(transactionError);
      }

      // Get seller's revtag
      const { data: sellerProfile } = await event.locals.supabase
        .from('profiles')
        .select('revtag')
        .eq('id', listing.seller_id)
        .single();

      // Create seller payout record
      const { error: payoutError } = await event.locals.supabase
        .from('seller_payouts')
        .insert({
          transaction_id: orderRef,
          seller_id: listing.seller_id,
          amount: sellerPayoutAmount,
          seller_revtag: sellerProfile?.revtag || '@unknown',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (payoutError) {
        console.error(`[${context.requestId}] Seller payout creation error:`, payoutError);
        // Don't fail the whole transaction for this
      }

      return {
        client_secret: paymentIntent.client_secret,
        transaction_id: transaction.id,
        order_reference: orderRef,
        item_price: itemPrice,
        shipping_cost: shippingPrice,
        subtotal: subtotal,
        buyer_fee: buyerFeeAmount,
        total_amount: subtotal + buyerFeeAmount,
        currency: 'USD',
        fee_breakdown: {
          buyer_fee_percentage: buyerFeePercentage,
          buyer_fee_fixed: buyerFeeFixed,
          buyer_fee_total: buyerFeeAmount
        }
      };

    } catch (error) {
      // Handle Stripe-specific errors
      if (error instanceof stripe.errors.StripeError) {
        throw new ApiError(
          `Payment processing error: ${error.message}`,
          400,
          ApiErrorType.EXTERNAL_SERVICE,
          { 
            stripe_error_type: error.type,
            stripe_error_code: error.code
          }
        );
      }
      
      // Re-throw if already an ApiError
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Unknown error
      throw new ApiError(
        'Failed to create payment intent',
        500,
        ApiErrorType.INTERNAL,
        { error: error?.toString() }
      );
    }
  });
};