-- Create memories table
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  context TEXT,
  confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create detected_tasks table
CREATE TABLE IF NOT EXISTS public.detected_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  source_text TEXT,
  confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detected_tasks ENABLE ROW LEVEL SECURITY;

-- Policies for memories
CREATE POLICY "memories_select_authenticated" ON public.memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "memories_insert_authenticated" ON public.memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "memories_update_owner" ON public.memories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "memories_delete_owner" ON public.memories FOR DELETE USING (auth.uid() = user_id);

-- Policies for detected_tasks
CREATE POLICY "detected_tasks_select_authenticated" ON public.detected_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "detected_tasks_insert_authenticated" ON public.detected_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "detected_tasks_update_owner" ON public.detected_tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "detected_tasks_delete_owner" ON public.detected_tasks FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_memories_user_created ON public.memories (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_detected_tasks_user_created ON public.detected_tasks (user_id, created_at DESC);
