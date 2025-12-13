import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  color?: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitCheck {
  id: string;
  habit_id: string;
  user_id: string;
  checked_date: string; // YYYY-MM-DD
  created_at: string;
}

export function useHabits() {
  const queryClient = useQueryClient();
  // helper to get current user id
  const getUserId = async () => {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  };

  const habitsQuery = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const uid = await getUserId();
      const q = supabase.from('habits').select('*').order('created_at', { ascending: false });
      if (uid) q.eq('user_id', uid);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Habit[];
    }
  });

  const checksQuery = useQuery({
    queryKey: ['habit_checks'],
    queryFn: async () => {
      const uid = await getUserId();
      const q = supabase.from('habit_checks').select('*').order('checked_date', { ascending: false });
      if (uid) q.eq('user_id', uid);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as HabitCheck[];
    }
  });

  const createHabit = useMutation({
    mutationFn: async (input: { title: string; description?: string; color?: string }) => {
      const uid = await getUserId();
      if (!uid) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('habits')
        .insert({ user_id: uid, title: input.title, description: input.description || null, color: input.color || null })
        .select()
        .single();
      if (error) throw error;
      return data as Habit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    }
  });

  const deleteHabit = useMutation({
    mutationFn: async (id: string) => {
      const uid = await getUserId();
      if (!uid) throw new Error('Not authenticated');

      const { error } = await supabase.from('habits').delete().eq('id', id).eq('user_id', uid);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habit_checks'] });
    }
  });

  const toggleCheck = useMutation({
    mutationFn: async (payload: { habit_id: string; date: string }) => {
      // check if exists
      const uid = await getUserId();
      if (!uid) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('habit_checks')
        .select('*')
        .eq('habit_id', payload.habit_id)
        .eq('checked_date', payload.date)
        .eq('user_id', uid)
        .limit(1)
        .single();

      if (existing) {
        // remove
        const { error } = await supabase.from('habit_checks').delete().eq('id', existing.id).eq('user_id', uid);
        if (error) throw error;
        return { removed: true };
      }

      const { data, error } = await supabase.from('habit_checks').insert({ habit_id: payload.habit_id, checked_date: payload.date, user_id: uid }).select().single();
      if (error) throw error;
      return { added: data } as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit_checks'] });
    }
  });

  return {
    habits: habitsQuery.data || [],
    habitChecks: checksQuery.data || [],
    isLoading: habitsQuery.isLoading || checksQuery.isLoading,
    createHabit,
    deleteHabit,
    toggleCheck,
    refetch: () => { 
      queryClient.invalidateQueries({ queryKey: ['habits'] }); 
      queryClient.invalidateQueries({ queryKey: ['habit_checks'] }); 
    }
  };
}

export default useHabits;
