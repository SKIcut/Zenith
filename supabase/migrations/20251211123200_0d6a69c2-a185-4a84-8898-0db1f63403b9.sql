-- Add user settings columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS goals TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS challenges TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS role_models JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS communication_style TEXT DEFAULT 'balanced',
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;