-- Migration: Add Critical Foreign Key Indexes for Public Schema
-- Purpose: Improve query performance by adding indexes on foreign key columns
-- Date: 2025-07-19
-- Issue: Fixes 27 unindexed foreign key warnings in public schema

-- User-related foreign key indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_id 
ON public.messages(sender_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_related_user_id 
ON public.notifications(related_user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_related_message_id 
ON public.notifications(related_message_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_methods_billing_address_id 
ON public.payment_methods(billing_address_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_default_billing_address_id 
ON public.profiles(default_billing_address_id);

-- Order-related foreign key indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_shipping_address_id 
ON public.orders(shipping_address_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_variant_id 
ON public.order_items(variant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_status_history_changed_by 
ON public.order_status_history(changed_by);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_tracking_created_by 
ON public.order_tracking(created_by);

-- Product-related foreign key indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_items_variant_id 
ON public.cart_items(variant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_seller_payment_account_id 
ON public.listings(seller_payment_account_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_parent_id 
ON public.categories(parent_id);

-- Payment & Transaction foreign key indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_transactions_payment_method_id 
ON public.payment_transactions(payment_method_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipping_labels_tracking_id 
ON public.shipping_labels(tracking_id);

-- Dispute-related foreign key indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_disputes_respondent_id 
ON public.disputes(respondent_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_disputes_resolved_by 
ON public.disputes(resolved_by);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_disputes_support_agent_id 
ON public.disputes(support_agent_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dispute_messages_sender_id 
ON public.dispute_messages(sender_id);

-- Return & Refund foreign key indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_returns_order_item_id 
ON public.returns(order_item_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_returns_requested_by 
ON public.returns(requested_by);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_returns_approved_by 
ON public.returns(approved_by);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_returns_inspected_by 
ON public.returns(inspected_by);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_returns_refund_transaction_id 
ON public.returns(refund_transaction_id);

-- Other foreign key indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_seller_id 
ON public.coupons(seller_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_created_by 
ON public.coupons(created_by);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_store_credits_issued_by 
ON public.store_credits(issued_by);

-- Analyze tables after index creation for optimal query planning
ANALYZE public.messages;
ANALYZE public.notifications;
ANALYZE public.payment_methods;
ANALYZE public.profiles;
ANALYZE public.orders;
ANALYZE public.order_items;
ANALYZE public.order_status_history;
ANALYZE public.order_tracking;
ANALYZE public.cart_items;
ANALYZE public.listings;
ANALYZE public.categories;
ANALYZE public.payment_transactions;
ANALYZE public.shipping_labels;
ANALYZE public.disputes;
ANALYZE public.dispute_messages;
ANALYZE public.returns;
ANALYZE public.coupons;
ANALYZE public.store_credits;

-- Note: Using CONCURRENTLY to avoid table locks during index creation
-- This allows normal operations to continue while indexes are built
-- However, it takes longer and uses more resources