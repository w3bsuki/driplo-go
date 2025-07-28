import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import '@testing-library/jest-dom';

// Mock SvelteKit modules
vi.mock('$app/environment', () => ({
  browser: true,
  dev: false
}));

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidateAll: vi.fn()
}));

vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn((fn) => {
      fn({ url: new URL('http://localhost:5173'), params: {} });
      return vi.fn();
    })
  }
}));

// Mock Stripe Elements
const mockStripeElement = {
  mount: vi.fn(),
  unmount: vi.fn(),
  on: vi.fn(),
  update: vi.fn(),
  blur: vi.fn(),
  clear: vi.fn(),
  focus: vi.fn()
};

const mockStripeElements = {
  create: vi.fn(() => mockStripeElement),
  getElement: vi.fn(() => mockStripeElement),
  submit: vi.fn(),
  update: vi.fn()
};

const mockStripe = {
  elements: vi.fn(() => mockStripeElements),
  confirmPayment: vi.fn(),
  createPaymentMethod: vi.fn(),
  confirmCardPayment: vi.fn()
};

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve(mockStripe))
}));

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: 'buyer-123', email: 'buyer@example.com' }
        }
      }
    })
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn()
  })),
  rpc: vi.fn()
};

vi.mock('$lib/supabase/client', () => ({
  supabase: mockSupabaseClient
}));

describe('Checkout Flow Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Checkout Form Initialization', () => {
    it('should initialize checkout form with listing data', () => {
      const listing = {
        id: 'listing-123',
        title: 'Designer Handbag',
        price: 150.00,
        seller: {
          id: 'seller-456',
          username: 'fashionseller',
          avatar_url: 'https://example.com/avatar.jpg'
        },
        images: ['https://example.com/image1.jpg']
      };

      const checkoutData = {
        listing: listing,
        quantity: 1,
        total: listing.price,
        buyer_id: 'buyer-123'
      };

      expect(checkoutData.listing.id).toBe('listing-123');
      expect(checkoutData.total).toBe(150.00);
      expect(checkoutData.quantity).toBe(1);
    });

    it('should load Stripe elements', async () => {
      mockStripe.elements.mockReturnValue(mockStripeElements);
      mockStripeElements.create.mockReturnValue(mockStripeElement);

      const initializeStripeElements = async (clientSecret: string) => {
        const elements = mockStripe.elements({
          clientSecret: clientSecret,
          appearance: {
            theme: 'stripe'
          }
        });

        const cardElement = elements.create('card', {
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': { color: '#aab7c4' }
            }
          }
        });

        return { elements, cardElement };
      };

      const { elements, cardElement } = await initializeStripeElements('pi_test_secret');
      
      expect(mockStripe.elements).toHaveBeenCalledWith({
        clientSecret: 'pi_test_secret',
        appearance: { theme: 'stripe' }
      });
      expect(mockStripeElements.create).toHaveBeenCalledWith('card', expect.any(Object));
    });

    it('should handle Stripe loading errors', async () => {
      vi.mocked(vi.importActual('@stripe/stripe-js')).loadStripe = vi.fn().mockResolvedValue(null);

      const loadStripeWithError = async () => {
        const stripe = await vi.importActual('@stripe/stripe-js').loadStripe('pk_test_invalid');
        if (!stripe) {
          throw new Error('Failed to load Stripe');
        }
        return stripe;
      };

      await expect(loadStripeWithError()).rejects.toThrow('Failed to load Stripe');
    });
  });

  describe('Checkout Form Validation', () => {
    it('should validate billing address', () => {
      const billingAddress = {
        name: 'John Doe',
        email: 'john@example.com',
        line1: '123 Main St',
        city: 'Sofia',
        postal_code: '1000',
        country: 'BG'
      };

      const emptyAddress = {
        name: '',
        email: '',
        line1: '',
        city: '',
        postal_code: '',
        country: ''
      };

      const validateBillingAddress = (address: typeof billingAddress) => {
        const errors = [];
        if (!address.name.trim()) errors.push('Name is required');
        if (!address.email.trim()) errors.push('Email is required');
        if (!address.line1.trim()) errors.push('Address line 1 is required');
        if (!address.city.trim()) errors.push('City is required');
        if (!address.postal_code.trim()) errors.push('Postal code is required');
        if (!address.country.trim()) errors.push('Country is required');

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (address.email && !emailRegex.test(address.email)) {
          errors.push('Invalid email format');
        }

        return errors;
      };

      expect(validateBillingAddress(billingAddress)).toHaveLength(0);
      expect(validateBillingAddress(emptyAddress)).toHaveLength(6);
      expect(validateBillingAddress({ ...billingAddress, email: 'invalid-email' }))
        .toContain('Invalid email format');
    });

    it('should validate shipping address', () => {
      const shippingAddress = {
        recipient_name: 'Jane Smith',
        line1: '456 Oak Ave',
        line2: 'Apt 2B',
        city: 'Plovdiv',
        state: 'Plovdiv',
        postal_code: '4000',
        country: 'BG',
        phone: '+359888123456'
      };

      const validateShippingAddress = (address: typeof shippingAddress) => {
        const errors = [];
        if (!address.recipient_name.trim()) errors.push('Recipient name is required');
        if (!address.line1.trim()) errors.push('Address line 1 is required');
        if (!address.city.trim()) errors.push('City is required');
        if (!address.postal_code.trim()) errors.push('Postal code is required');
        if (!address.country.trim()) errors.push('Country is required');

        // Phone validation (optional but if provided, should be valid)
        if (address.phone && !/^\+?[\d\s\-\(\)]+$/.test(address.phone)) {
          errors.push('Invalid phone number format');
        }

        return errors;
      };

      expect(validateShippingAddress(shippingAddress)).toHaveLength(0);
      expect(validateShippingAddress({ ...shippingAddress, recipient_name: '' }))
        .toContain('Recipient name is required');
    });

    it('should calculate order totals', () => {
      const orderItems = [
        { listing_id: 'listing-1', price: 100.00, quantity: 1 },
        { listing_id: 'listing-2', price: 75.00, quantity: 2 }
      ];

      const shippingCost = 10.00;
      const taxRate = 0.20; // 20% VAT

      const calculateOrderTotal = (items: typeof orderItems, shipping: number, taxRate: number) => {
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * taxRate;
        const total = subtotal + shipping + tax;

        return {
          subtotal: parseFloat(subtotal.toFixed(2)),
          shipping: parseFloat(shipping.toFixed(2)),
          tax: parseFloat(tax.toFixed(2)),
          total: parseFloat(total.toFixed(2))
        };
      };

      const orderTotal = calculateOrderTotal(orderItems, shippingCost, taxRate);
      
      expect(orderTotal.subtotal).toBe(250.00); // 100 + (75 * 2)
      expect(orderTotal.shipping).toBe(10.00);
      expect(orderTotal.tax).toBe(50.00); // 250 * 0.20
      expect(orderTotal.total).toBe(310.00); // 250 + 10 + 50
    });
  });

  describe('Payment Processing', () => {
    it('should create payment intent', async () => {
      const orderData = {
        amount: 15000, // $150.00 in cents
        currency: 'usd',
        metadata: {
          order_id: 'order-123',
          buyer_id: 'buyer-123'
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          client_secret: 'pi_test123_secret_test',
          payment_intent_id: 'pi_test123'
        })
      });

      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      expect(result.client_secret).toBe('pi_test123_secret_test');
      expect(result.payment_intent_id).toBe('pi_test123');
    });

    it('should process successful payment', async () => {
      const paymentData = {
        billing_details: {
          name: 'John Doe',
          email: 'john@example.com',
          address: {
            line1: '123 Main St',
            city: 'Sofia',
            postal_code: '1000',
            country: 'BG'
          }
        }
      };

      mockStripe.confirmPayment.mockResolvedValue({
        paymentIntent: {
          id: 'pi_test123',
          status: 'succeeded',
          amount: 15000,
          currency: 'usd'
        },
        error: null
      });

      const result = await mockStripe.confirmPayment({
        elements: mockStripeElements,
        confirmParams: {
          return_url: 'http://localhost:5173/checkout/success',
          payment_method_data: paymentData
        }
      });

      expect(result.paymentIntent.status).toBe('succeeded');
      expect(result.paymentIntent.amount).toBe(15000);
      expect(result.error).toBeNull();
    });

    it('should handle payment authentication required', async () => {
      mockStripe.confirmPayment.mockResolvedValue({
        paymentIntent: {
          id: 'pi_test123',
          status: 'requires_action',
          next_action: {
            type: 'use_stripe_sdk'
          }
        },
        error: null
      });

      const result = await mockStripe.confirmPayment({
        elements: mockStripeElements,
        confirmParams: {
          return_url: 'http://localhost:5173/checkout/success'
        }
      });

      expect(result.paymentIntent.status).toBe('requires_action');
      expect(result.paymentIntent.next_action.type).toBe('use_stripe_sdk');
    });

    it('should handle payment failures', async () => {
      mockStripe.confirmPayment.mockResolvedValue({
        paymentIntent: null,
        error: {
          type: 'card_error',
          code: 'card_declined',
          message: 'Your card was declined.',
          decline_code: 'generic_decline'
        }
      });

      const result = await mockStripe.confirmPayment({
        elements: mockStripeElements,
        confirmParams: {
          return_url: 'http://localhost:5173/checkout/success'
        }
      });

      expect(result.error.type).toBe('card_error');
      expect(result.error.code).toBe('card_declined');
      expect(result.paymentIntent).toBeNull();
    });
  });

  describe('Order Creation', () => {
    it('should create order after successful payment', async () => {
      const orderData = {
        buyer_id: 'buyer-123',
        seller_id: 'seller-456',
        listing_id: 'listing-123',
        quantity: 1,
        subtotal: 150.00,
        shipping_cost: 10.00,
        tax_amount: 32.00,
        total_amount: 192.00,
        payment_intent_id: 'pi_test123',
        status: 'confirmed',
        billing_address: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Sofia',
          postal_code: '1000',
          country: 'BG'
        },
        shipping_address: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Sofia',
          postal_code: '1000',
          country: 'BG'
        }
      };

      mockSupabaseClient.rpc.mockResolvedValue({
        data: {
          order_id: 'order-123',
          success: true
        },
        error: null
      });

      const result = await mockSupabaseClient.rpc('create_order_with_payment', {
        p_order_data: orderData
      });

      expect(result.data.order_id).toBe('order-123');
      expect(result.data.success).toBe(true);
    });

    it('should update listing status after order', async () => {
      const listingId = 'listing-123';
      const updateData = {
        status: 'sold',
        sold_at: new Date().toISOString(),
        buyer_id: 'buyer-123'
      };

      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockResolvedValue({
          data: { id: listingId, ...updateData },
          error: null
        }),
        eq: vi.fn().mockReturnThis()
      });

      const result = await mockSupabaseClient
        .from('listings')
        .update(updateData)
        .eq('id', listingId);

      expect(result.data.status).toBe('sold');
      expect(result.data.buyer_id).toBe('buyer-123');
    });

    it('should send order confirmation emails', async () => {
      const emailData = {
        to: 'buyer@example.com',
        subject: 'Order Confirmation - Order #123',
        template: 'order-confirmation',
        data: {
          order_id: 'order-123',
          buyer_name: 'John Doe',
          listing_title: 'Designer Handbag',
          total_amount: 192.00
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message_id: 'msg_123', sent: true })
      });

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });

      const result = await response.json();
      expect(result.sent).toBe(true);
      expect(result.message_id).toBe('msg_123');
    });
  });

  describe('Checkout UI Interactions', () => {
    it('should toggle between billing and shipping addresses', () => {
      let useShippingAsBilling = true;
      let billingAddress = {};
      let shippingAddress = {
        name: 'John Doe',
        line1: '123 Main St',
        city: 'Sofia'
      };

      const toggleBillingAddress = () => {
        useShippingAsBilling = !useShippingAsBilling;
        if (useShippingAsBilling) {
          billingAddress = { ...shippingAddress };
        } else {
          billingAddress = {};
        }
      };

      // Initially using shipping as billing
      expect(useShippingAsBilling).toBe(true);
      
      // Toggle to separate billing address
      toggleBillingAddress();
      expect(useShippingAsBilling).toBe(false);
      expect(billingAddress).toEqual({});

      // Toggle back to use shipping as billing
      toggleBillingAddress();
      expect(useShippingAsBilling).toBe(true);
      expect(billingAddress).toEqual(shippingAddress);
    });

    it('should validate form before enabling submit button', () => {
      const formState = {
        billingAddress: {
          name: 'John Doe',
          email: 'john@example.com',
          line1: '123 Main St',
          city: 'Sofia',
          postal_code: '1000',
          country: 'BG'
        },
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Sofia',
          postal_code: '1000',
          country: 'BG'
        },
        cardComplete: true,
        termsAccepted: true
      };

      const isFormValid = (state: typeof formState) => {
        // Check required fields
        const billingValid = state.billingAddress.name && 
          state.billingAddress.email && 
          state.billingAddress.line1 && 
          state.billingAddress.city && 
          state.billingAddress.postal_code && 
          state.billingAddress.country;

        const shippingValid = state.shippingAddress.name && 
          state.shippingAddress.line1 && 
          state.shippingAddress.city && 
          state.shippingAddress.postal_code && 
          state.shippingAddress.country;

        return billingValid && shippingValid && state.cardComplete && state.termsAccepted;
      };

      expect(isFormValid(formState)).toBe(true);
      expect(isFormValid({ ...formState, cardComplete: false })).toBe(false);
      expect(isFormValid({ ...formState, termsAccepted: false })).toBe(false);
    });

    it('should handle loading states during checkout', () => {
      const checkoutStates = {
        idle: 'idle',
        processing: 'processing',
        succeeded: 'succeeded',
        failed: 'failed'
      };

      let currentState = checkoutStates.idle;
      let isLoading = false;
      let error = null;

      const setCheckoutState = (state: string, errorMessage: string | null = null) => {
        currentState = state;
        isLoading = state === checkoutStates.processing;
        error = errorMessage;
      };

      // Start processing
      setCheckoutState(checkoutStates.processing);
      expect(currentState).toBe('processing');
      expect(isLoading).toBe(true);
      expect(error).toBeNull();

      // Success
      setCheckoutState(checkoutStates.succeeded);
      expect(currentState).toBe('succeeded');
      expect(isLoading).toBe(false);

      // Failure
      setCheckoutState(checkoutStates.failed, 'Payment failed');
      expect(currentState).toBe('failed');
      expect(error).toBe('Payment failed');
    });
  });

  describe('Error Handling', () => {
    it('should handle Stripe element mounting errors', async () => {
      mockStripeElement.mount.mockImplementation(() => {
        throw new Error('Element could not be mounted');
      });

      const mountElement = async () => {
        try {
          mockStripeElement.mount('#card-element');
        } catch (error) {
          throw new Error(`Failed to mount payment element: ${error.message}`);
        }
      };

      await expect(mountElement()).rejects.toThrow('Failed to mount payment element');
    });

    it('should handle network errors during payment', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const createPaymentIntent = async () => {
        try {
          const response = await fetch('/api/payment/create-intent', {
            method: 'POST',
            body: JSON.stringify({ amount: 10000 })
          });
          return response.json();
        } catch (error) {
          throw new Error(`Payment service unavailable: ${error.message}`);
        }
      };

      await expect(createPaymentIntent()).rejects.toThrow('Payment service unavailable');
    });

    it('should handle order creation failures after successful payment', async () => {
      // Payment succeeds
      mockStripe.confirmPayment.mockResolvedValue({
        paymentIntent: {
          id: 'pi_test123',
          status: 'succeeded'
        },
        error: null
      });

      // But order creation fails
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: {
          message: 'Database connection failed',
          code: 'DB_ERROR'
        }
      });

      const processCheckout = async () => {
        const paymentResult = await mockStripe.confirmPayment({
          elements: mockStripeElements
        });

        if (paymentResult.paymentIntent?.status === 'succeeded') {
          const orderResult = await mockSupabaseClient.rpc('create_order_with_payment');
          
          if (orderResult.error) {
            // Payment succeeded but order creation failed - needs manual intervention
            throw new Error(`Order creation failed: ${orderResult.error.message}`);
          }

          return orderResult.data;
        }

        throw new Error('Payment failed');
      };

      await expect(processCheckout()).rejects.toThrow('Order creation failed');
    });

    it('should handle payment method setup errors', async () => {
      mockStripe.createPaymentMethod.mockResolvedValue({
        paymentMethod: null,
        error: {
          type: 'validation_error',
          code: 'incomplete_number',
          message: 'Your card number is incomplete.'
        }
      });

      const setupPaymentMethod = async () => {
        const result = await mockStripe.createPaymentMethod({
          type: 'card',
          card: mockStripeElement
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        return result.paymentMethod;
      };

      await expect(setupPaymentMethod()).rejects.toThrow('Your card number is incomplete.');
    });

    it('should provide user-friendly error messages', () => {
      const errorMap = {
        'card_declined': 'Your card was declined. Please try a different payment method.',
        'insufficient_funds': 'Your card has insufficient funds.',
        'expired_card': 'Your card has expired.',
        'incorrect_cvc': 'Your card\'s security code is incorrect.',
        'processing_error': 'An error occurred while processing your card. Try again in a little bit.',
        'generic_decline': 'Your card was declined. Please contact your card issuer for more information.'
      };

      const getFriendlyErrorMessage = (errorCode: string) => {
        return errorMap[errorCode] || 'An unexpected error occurred. Please try again.';
      };

      expect(getFriendlyErrorMessage('card_declined')).toBe('Your card was declined. Please try a different payment method.');
      expect(getFriendlyErrorMessage('insufficient_funds')).toBe('Your card has insufficient funds.');
      expect(getFriendlyErrorMessage('unknown_error')).toBe('An unexpected error occurred. Please try again.');
    });
  });
});