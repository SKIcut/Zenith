import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MemoryEntry {
  id: string;
  date: Date;
  category: 'insight' | 'goal' | 'challenge' | 'progress' | 'lesson';
  content: string;
  context?: string | null;
  confidence?: number | null;
}

export interface ChatMemory {
  userId?: string;
  memories: MemoryEntry[];
  lastUpdated: Date;
  conversationHistory: string[];
}

const MAX_MEMORIES = 100;
const MAX_HISTORY = 50;

export const useMemory = (userKey: string) => {
  const queryClient = useQueryClient();
  const [memory, setMemory] = useState<ChatMemory>({
    userId: undefined,
    memories: [],
    lastUpdated: new Date(),
    conversationHistory: [],
  });

  // Fetch memories from database
  const { data: memoriesData = [], isLoading: memoriesLoading } = useQuery({
    queryKey: ['memories'],
    queryFn: async (): Promise<MemoryEntry[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(MAX_MEMORIES);

      if (error) throw error;
      
      return (data || []).map(m => ({
        id: m.id,
        date: new Date(m.created_at),
        category: m.category as MemoryEntry['category'],
        content: m.content,
        context: m.context,
        confidence: m.confidence ? Number(m.confidence) : null,
      }));
    },
  });

  // Fetch conversation history from database
  const { data: historyData = [], isLoading: historyLoading } = useQuery({
    queryKey: ['conversation_history'],
    queryFn: async (): Promise<string[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('conversation_history')
        .select('entry')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(MAX_HISTORY);

      if (error) throw error;
      return (data || []).map(h => h.entry).reverse(); // Reverse to get chronological order
    },
  });

  // Update memory state when data loads
  useEffect(() => {
    if (!memoriesLoading && !historyLoading) {
      setMemory({
        userId: undefined,
        memories: memoriesData,
        lastUpdated: new Date(),
        conversationHistory: historyData,
      });
    }
  }, [memoriesData, historyData, memoriesLoading, historyLoading]);

  const addMemory = useMutation({
    mutationFn: async ({
      category,
      content,
      context,
    }: {
      category: MemoryEntry['category'];
      content: string;
      context?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('memories')
        .insert({
          user_id: user.id,
          category,
          content,
          context: context || null,
          confidence: null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });

  const addToConversationHistory = useMutation({
    mutationFn: async (entry: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('conversation_history')
        .insert({
          user_id: user.id,
          entry,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation_history'] });
    },
  });

  const getRelevantMemories = (query: string, limit: number = 10): MemoryEntry[] => {
    const lowerQuery = query.toLowerCase();
    return memory.memories
      .filter(m =>
        m.content.toLowerCase().includes(lowerQuery) ||
        (m.context || '').toLowerCase().includes(lowerQuery)
      )
      .slice(0, limit);
  };

  const getMemoriesByCategory = (
    category: MemoryEntry['category'],
    limit: number = 5
  ): MemoryEntry[] => {
    return memory.memories
      .filter(m => m.category === category)
      .slice(0, limit);
  };

  const getRecentMemories = (days: number = 7, limit: number = 10): MemoryEntry[] => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return memory.memories
      .filter(m => new Date(m.date) >= cutoffDate)
      .slice(0, limit);
  };

  const clearOldMemories = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });

  const getMemorySummary = (): string => {
    const goals = getMemoriesByCategory('goal', 3);
    const challenges = getMemoriesByCategory('challenge', 3);
    const insights = getMemoriesByCategory('insight', 3);
    const progress = getMemoriesByCategory('progress', 2);
    const breakthroughs = getMemoriesByCategory('breakthrough', 2);

    let summary = '';
    
    if (goals.length > 0) {
      summary += `\n\nKEY GOALS:\n${goals.map(m => `- ${m.content}`).join('\n')}`;
    }
    
    if (challenges.length > 0) {
      summary += `\n\nONCOING CHALLENGES:\n${challenges.map(m => `- ${m.content}`).join('\n')}`;
    }
    
    if (insights.length > 0) {
      summary += `\n\nPAST INSIGHTS:\n${insights.map(m => `- ${m.content}`).join('\n')}`;
    }

    if (progress.length > 0) {
      summary += `\n\nRECENT PROGRESS:\n${progress.map(m => `- ${m.content}`).join('\n')}`;
    }

    if (breakthroughs.length > 0) {
      summary += `\n\nBREAKTHROUGHS:\n${breakthroughs.map(m => `- ${m.content}`).join('\n')}`;
    }

    return summary;
  };

  const exportMemories = async (): Promise<string> => {
    return JSON.stringify(memory, null, 2);
  };

  const deleteMemory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });

  const updateMemory = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error } = await supabase
        .from('memories')
        .update({
          content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });

  const updateMemoryCategory = useMutation({
    mutationFn: async ({ id, category }: { id: string; category: MemoryEntry['category'] }) => {
      const { error } = await supabase
        .from('memories')
        .update({
          category,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });

  const clearAllMemories = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Delete all memories
      const { error: memError } = await supabase
        .from('memories')
        .delete()
        .eq('user_id', user.id);

      if (memError) throw memError;

      // Delete all conversation history
      const { error: histError } = await supabase
        .from('conversation_history')
        .delete()
        .eq('user_id', user.id);

      if (histError) throw histError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      queryClient.invalidateQueries({ queryKey: ['conversation_history'] });
    },
  });

  return {
    memory,
    addMemory: (category: MemoryEntry['category'], content: string, context?: string) =>
      addMemory.mutate({ category, content, context }),
    addToConversationHistory: (entry: string) => addToConversationHistory.mutate(entry),
    getRelevantMemories,
    getMemoriesByCategory,
    getRecentMemories,
    clearOldMemories: () => clearOldMemories.mutate(),
    getMemorySummary,
    exportMemories,
    deleteMemory: (id: string) => deleteMemory.mutate(id),
    updateMemory: (id: string, content: string) => updateMemory.mutate({ id, content }),
    updateMemoryCategory: (id: string, category: MemoryEntry['category']) =>
      updateMemoryCategory.mutate({ id, category }),
    clearAllMemories: () => clearAllMemories.mutate(),
    isLoading: memoriesLoading || historyLoading,
  };
};
