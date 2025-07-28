import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20'
});

export const GET: RequestHandler = async () => {
  try {
    // Test Stripe connection by fetching account info
    const startTime = Date.now();
    const account = await stripe.accounts.retrieve();
    const responseTime = Date.now() - startTime;

    return json({
      status: 'ok',
      service: 'stripe',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      details: {
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        country: account.country
      }
    });
  } catch (error: any) {
    return json({
      status: 'error',
      service: 'stripe',
      error: error.message || 'Stripe connection failed',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
};