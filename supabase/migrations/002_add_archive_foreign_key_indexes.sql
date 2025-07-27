-- Migration: Add Foreign Key Indexes for Archive Schema
-- Purpose: Improve query performance for archive tables by adding indexes on foreign key columns
-- Date: 2025-07-19
-- Issue: Fixes 17 unindexed foreign key warnings in archive schema

-- Dispute-related foreign key indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dispute_evidence_submitted_by 
ON archive.dispute_evidence(submitted_by);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dispute_evidence_verified_by 
ON archive.dispute_evidence(verified_by);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dispute_history_actor_id 
ON archive.dispute_history(actor_id);

-- Sales & Promotion foreign key indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flash_sales_created_by 
ON archive.flash_sales(created_by);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flash_sales_seller_id 
ON archive.flash_sales(seller_id);

-- Inventory foreign key indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_logs_created_by 
ON archive.inventory_logs(created_by);

-- View tracking foreign key indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listing_views_viewer_id 
ON archive.listing_views(viewer_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_views_viewer_id 
ON archive.profile_views(viewer_id);

-- Payment & Financial foreign key indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_refunds_initiated_by 
ON archive.payment_refunds(initiated_by);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seller_payouts_processed_by 
ON archive.seller_payouts(processed_by);

-- Points & Credits foreign key indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_points_transactions_order_id 
ON archive.points_transactions(order_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_store_credit_usage_order_id 
ON archive.store_credit_usage(order_id);

-- Transaction foreign key indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_buyer_id 
ON archive.transactions(buyer_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_listing_id 
ON archive.transactions(listing_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_seller_id 
ON archive.transactions(seller_id);

-- Return communication foreign key indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_return_messages_sender_id 
ON archive.return_messages(sender_id);

-- Analyze archive tables after index creation
ANALYZE archive.dispute_evidence;
ANALYZE archive.dispute_history;
ANALYZE archive.flash_sales;
ANALYZE archive.inventory_logs;
ANALYZE archive.listing_views;
ANALYZE archive.profile_views;
ANALYZE archive.payment_refunds;
ANALYZE archive.seller_payouts;
ANALYZE archive.points_transactions;
ANALYZE archive.store_credit_usage;
ANALYZE archive.transactions;
ANALYZE archive.return_messages;

-- Note: Archive tables typically have lower query volume but still benefit from proper indexing
-- These indexes will help with historical data queries and reporting