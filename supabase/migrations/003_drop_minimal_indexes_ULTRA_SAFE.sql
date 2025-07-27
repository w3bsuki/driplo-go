-- Migration: Drop MINIMAL Indexes - ULTRA SAFE for Production
-- Purpose: Only drop archive table indexes that are definitely redundant
-- Date: 2025-07-19
-- Strategy: When in doubt, KEEP THE INDEX!

-- Only dropping archive table indexes for rarely-used features
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_achievements_user;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_achievements_type;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_achievements_earned;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_activities_user;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_activities_public;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_activities_type;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_listing_views_created;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_profile_views_date;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_inventory_logs_created;

-- That's it! Only 9 indexes from archive tables
-- Keeping ALL public schema indexes including:
-- ✓ idx_profiles_role - Might need for admin/seller filtering
-- ✓ idx_profiles_seller_rating - Definitely need for seller sorting
-- ✓ idx_profiles_verification - Might need for verified seller badges
-- ✓ All order, transaction, payment indexes
-- ✓ All cart and favorites indexes
-- ✓ All search and listing indexes
-- ✓ All messaging and notification indexes

-- Total kept: 96 out of 105 "unused" indexes
-- Philosophy: Storage is cheap, slow queries are expensive!

-- After going live, use the monitoring script to track actual usage
-- Only remove indexes after 30+ days of production data