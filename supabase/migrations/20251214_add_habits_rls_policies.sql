-- Add RLS policies for habits tables if they don't exist
-- This migration adds RLS policies that were missing from the original habits migration

-- Enable RLS (idempotent - won't error if already enabled)
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_checks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can create own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can update own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can delete own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can view own habit checks" ON public.habit_checks;
DROP POLICY IF EXISTS "Users can create own habit checks" ON public.habit_checks;
DROP POLICY IF EXISTS "Users can delete own habit checks" ON public.habit_checks;

-- Habits policies
CREATE POLICY "Users can view own habits" ON public.habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habits" ON public.habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" ON public.habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" ON public.habits
  FOR DELETE USING (auth.uid() = user_id);

-- Habit checks policies
CREATE POLICY "Users can view own habit checks" ON public.habit_checks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habit checks" ON public.habit_checks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit checks" ON public.habit_checks
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at on habits (if it doesn't exist)
DROP TRIGGER IF EXISTS update_habits_updated_at ON public.habits;
CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_checks_user_id ON public.habit_checks(user_id);

