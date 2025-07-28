-- Migration: Drop Unused Indexes - Phase 3 (Payment, Dispute & Remaining)
-- Purpose: Remove unused indexes to improve write performance and reduce storage
-- Date: 2025-07-19
-- Issue: Drops final 35 unused indexes identified by Supabase advisor

-- Drop unused payment & transaction indexes
DROP INDEX CONCURRENTLY IF EXISTS public.idx_payment_methods_user;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_payment_methods_default;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_transactions_order;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_transactions_status;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_transactions_processor;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_transactions_stripe_payment_intent_id;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_refunds_transaction;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_refunds_order;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_payment_accounts_user_id;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_payment_accounts_verified;

-- Drop unused dispute-related indexes
DROP INDEX CONCURRENTLY IF EXISTS public.idx_disputes_order;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_disputes_status;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_disputes_parties;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_disputes_created;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_dispute_messages_dispute;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_dispute_evidence_dispute;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_dispute_history_dispute;

-- Drop unused return & refund indexes
DROP INDEX CONCURRENTLY IF EXISTS public.idx_returns_order;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_returns_status;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_returns_requested_at;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_return_messages_return;

-- Drop unused coupon & promotion indexes
DROP INDEX CONCURRENTLY IF EXISTS public.idx_coupons_code;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_coupons_valid;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_coupon_usage_user;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_coupon_usage_order;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_bundle_deals_seller;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_flash_sales_active;

-- Drop unused store credit & loyalty indexes
DROP INDEX CONCURRENTLY IF EXISTS public.idx_store_credits_user;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_store_credits_active;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_store_credit_usage_credit;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_loyalty_points_user;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_points_transactions_user;

-- Drop unused payout & seller indexes
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_seller_payouts_seller_id;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_seller_payouts_status;

-- Drop unused shipping address indexes
DROP INDEX CONCURRENTLY IF EXISTS public.idx_shipping_addresses_user;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_shipping_addresses_default;

-- Final cleanup: Reclaim space after dropping indexes
-- Note: VACUUM FULL requires exclusive lock, so run during maintenance window
-- VACUUM ANALYZE public.listings;
-- VACUUM ANALYZE public.orders;
-- VACUUM ANALYZE public.profiles;
-- VACUUM ANALYZE public.messages;
-- VACUUM ANALYZE public.notifications;

-- Summary: This completes the removal of all 105 unused indexes
-- Expected benefits:
-- - Reduced storage space (estimated 5-10GB)
-- - Faster INSERT/UPDATE/DELETE operations
-- - Lower maintenance overhead during VACUUM operations