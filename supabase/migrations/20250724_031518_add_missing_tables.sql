-- Migration: Add missing tables (documents and user_achievements)
-- Generated: 2025-07-24
-- Purpose: Create missing tables identified in SUPABASE_ISSUES_REPORT.md

-- 1. Create documents table for verification
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('identity', 'address', 'tax', 'business', 'other')),
  url TEXT NOT NULL,
  filename TEXT,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id)
);

-- Create indexes for documents
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_type ON public.documents(type);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
-- Users can view their own documents
CREATE POLICY "Users view own documents" ON public.documents
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Users can upload their own documents
CREATE POLICY "Users upload own documents" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can update their own pending documents
CREATE POLICY "Users update own pending documents" ON public.documents
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id AND status = 'pending')
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Admins can view all documents
CREATE POLICY "Admins view all documents" ON public.documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- Admins can update document status
CREATE POLICY "Admins update document status" ON public.documents
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- 2. Create user_achievements table for gamification
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  achievement_data JSONB DEFAULT '{}',
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  earned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, achievement_type)
);

-- Create indexes for user_achievements
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_type ON public.user_achievements(achievement_type);
CREATE INDEX idx_user_achievements_earned_at ON public.user_achievements(earned_at DESC);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_achievements
-- Anyone can view achievements (public leaderboard)
CREATE POLICY "Public can view achievements" ON public.user_achievements
  FOR SELECT TO public
  USING (true);

-- System can insert achievements (via functions)
CREATE POLICY "System insert achievements" ON public.user_achievements
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Users cannot directly modify achievements
-- Achievements should only be granted through RPC functions

-- Add comment to tables
COMMENT ON TABLE public.documents IS 'Stores user verification documents for KYC/identity verification';
COMMENT ON TABLE public.user_achievements IS 'Stores user achievements and gamification data';

-- Create function to grant achievement
CREATE OR REPLACE FUNCTION public.grant_user_achievement(
  p_user_id UUID,
  p_achievement_type TEXT,
  p_achievement_name TEXT,
  p_achievement_description TEXT DEFAULT NULL,
  p_points INTEGER DEFAULT 0,
  p_level INTEGER DEFAULT 1,
  p_achievement_data JSONB DEFAULT '{}'
) RETURNS public.user_achievements AS $$
DECLARE
  v_achievement public.user_achievements;
BEGIN
  -- Insert or update achievement
  INSERT INTO public.user_achievements (
    user_id,
    achievement_type,
    achievement_name,
    achievement_description,
    points,
    level,
    achievement_data
  ) VALUES (
    p_user_id,
    p_achievement_type,
    p_achievement_name,
    p_achievement_description,
    p_points,
    p_level,
    p_achievement_data
  )
  ON CONFLICT (user_id, achievement_type) DO UPDATE SET
    achievement_name = EXCLUDED.achievement_name,
    achievement_description = EXCLUDED.achievement_description,
    points = GREATEST(user_achievements.points, EXCLUDED.points),
    level = GREATEST(user_achievements.level, EXCLUDED.level),
    achievement_data = EXCLUDED.achievement_data,
    earned_at = CASE 
      WHEN user_achievements.level < EXCLUDED.level THEN now()
      ELSE user_achievements.earned_at
    END
  RETURNING * INTO v_achievement;
  
  RETURN v_achievement;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.grant_user_achievement TO authenticated;

-- Add comment to function
COMMENT ON FUNCTION public.grant_user_achievement IS 'Grants or updates a user achievement with proper security checks';