/**
 * Checkout Modal Components - Re-exports
 * 
 * This file provides clean re-exports for all checkout modal components
 * and hooks, enabling easy imports throughout the application.
 */

// Main container component
export { default as CheckoutModal } from '../CheckoutModal.svelte';

// UI Components
export { default as OrderSummary } from './OrderSummary.svelte';
export { default as ShippingForm } from './ShippingForm.svelte';
export { default as PaymentSelector } from './PaymentSelector.svelte';
export { default as PaymentProcessor } from './PaymentProcessor.svelte';
export { default as PaymentInstructions } from './PaymentInstructions.svelte';

// State Management Hooks
export { useCheckoutState } from './hooks/useCheckoutState.svelte';
export { useStripePayment } from './hooks/useStripePayment.svelte';
export { useRevolutPayment } from './hooks/useRevolutPayment.svelte';

// Type exports
export type { ShippingAddress, CheckoutState } from './hooks/useCheckoutState.svelte';
export type { ManualPaymentData, RevolutPaymentState } from './hooks/useRevolutPayment.svelte';