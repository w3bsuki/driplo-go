-- Migration: Drop Unused Indexes - Phase 2 (User, Profile & Communication)
-- Purpose: Remove unused indexes to improve write performance and reduce storage
-- Date: 2025-07-19
-- Issue: Drops 35 unused indexes identified by Supabase advisor

-- Drop unused user & profile indexes
DROP INDEX CONCURRENTLY IF EXISTS public.idx_profiles_role;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_profiles_seller_rating;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_profiles_last_active;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_profiles_verification;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_user_ratings_rated_user;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_user_ratings_rater_user;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_user_ratings_listing;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_user_ratings_type_rating;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_user_stats_last_calc;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_follows_follower;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_follows_following;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_profile_views_profile;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_profile_views_date;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_profile_views_viewer;

-- Drop unused achievement & activity indexes
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_achievements_user;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_achievements_type;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_achievements_earned;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_activities_user;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_activities_public;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_activities_type;

-- Drop unused messaging & notification indexes
DROP INDEX CONCURRENTLY IF EXISTS public.idx_messages_conversation_created;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_messages_conversation;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_messages_created;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_conversations_listing;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_notifications_user_unread;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_notifications_created;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_notifications_type;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_notifications_expires;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_notifications_related_order;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_notifications_related_listing;

-- Drop unused product variant indexes
DROP INDEX CONCURRENTLY IF EXISTS public.idx_variants_available;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_variants_stock;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_variants_listing;

-- Drop unused inventory log indexes
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_inventory_logs_variant;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_inventory_logs_listing;
DROP INDEX CONCURRENTLY IF EXISTS archive.idx_inventory_logs_created;

-- Note: Phase 2 focuses on user, profile, communication, and inventory indexes
-- These indexes have never been used according to Supabase's analysis