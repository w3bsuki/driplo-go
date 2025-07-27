-- Migration: Drop Unused Indexes - Phase 1 (Listing & Order Related)
-- Purpose: Remove unused indexes to improve write performance and reduce storage
-- Date: 2025-07-19
-- Issue: Drops 35 unused indexes identified by Supabase advisor

-- Drop unused listing-related indexes
DROP INDEX CONCURRENTLY IF EXISTS public.idx_listings_slug;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_listings_subcategory;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_listings_search_active;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_listings_seller_active;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_listings_price;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_listings_search;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_listings_tags;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_listing_views_listing;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_listing_views_created;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_listing_views_viewer;

-- Drop unused order-related indexes
DROP INDEX CONCURRENTLY IF EXISTS public.idx_orders_seller_status;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_orders_buyer_status;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_orders_created_date;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_orders_buyer;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_orders_seller;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_orders_status;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_orders_created;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_orders_number;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_order_items_order;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_order_items_listing;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_order_status_history_order;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_tracking_order;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_tracking_number;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_tracking_status;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_tracking_delivery;

-- Drop unused cart & shopping indexes
DROP INDEX CONCURRENTLY IF EXISTS public.idx_cart_items_cart_listing;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_carts_user;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_carts_expires;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_cart_items_cart;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_cart_items_listing;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_favorites_user_listing;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_favorites_listing;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_favorites_created;

-- Drop unused shipping & label indexes
DROP INDEX CONCURRENTLY IF EXISTS public.idx_labels_order;

-- Note: Using DROP INDEX CONCURRENTLY to avoid locking tables
-- This allows normal operations to continue during index removal
-- Phase 1 focuses on listing and order-related indexes