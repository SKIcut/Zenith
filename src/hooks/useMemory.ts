import { useState, useEffect } from 'react';

export interface MemoryEntry {
  id: string;
  date: Date;
  category: 'insight' | 'goal' | 'challenge' | 'progress' | 'lesson' | 'breakthrough' | 'decision';
  content: string;
  context?: string;
}

export interface ChatMemory {
  userId: string;
  memories: MemoryEntry[];
  lastUpdated: Date;
  conversationHistory: string[];
}

const MEMORY_STORAGE_KEY = 'zenith_memory_bank';
const MAX_MEMORIES = 100;
const MAX_HISTORY = 50;

export const useMemory = (userId: string) => {
  const [memory, setMemory] = useState<ChatMemory>({
    userId,
    memories: [],
    lastUpdated: new Date(),
    conversationHistory: [],
  });

  // Load memory from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`${MEMORY_STORAGE_KEY}_${userId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMemory({
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated),
          memories: parsed.memories.map((m: any) => ({
            ...m,
            date: new Date(m.date),
          })),
        });
      } catch (error) {
        console.error('Failed to load memory:', error);
      }
    }
  }, [userId]);

  // Save memory to localStorage
  const saveMemory = (updatedMemory: ChatMemory) => {
    setMemory(updatedMemory);
    localStorage.setItem(
      `${MEMORY_STORAGE_KEY}_${userId}`,
      JSON.stringify(updatedMemory)
    );
  };

  // Add a new memory entry
  const addMemory = (
    category: MemoryEntry['category'],
    content: string,
    context?: string
  ) => {
    const newEntry: MemoryEntry = {
      id: crypto.randomUUID(),
      date: new Date(),
      category,
      content,
      context,
    };

    const updated = { ...memory };
    updated.memories = [newEntry, ...updated.memories].slice(0, MAX_MEMORIES);
    updated.lastUpdated = new Date();
    saveMemory(updated);
  };

  // Add conversation to history
  const addToConversationHistory = (entry: string) => {
    const updated = { ...memory };
    updated.conversationHistory = [
      entry,
      ...updated.conversationHistory,
    ].slice(0, MAX_HISTORY);
    updated.lastUpdated = new Date();
    saveMemory(updated);
  };

  // Get relevant memories (semantic search simulation)
  const getRelevantMemories = (query: string, limit: number = 10): MemoryEntry[] => {
    const lowerQuery = query.toLowerCase();
    return memory.memories
      .filter(m => 
        m.content.toLowerCase().includes(lowerQuery) ||
        m.context?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, limit);
  };

  // Get memories by category
  const getMemoriesByCategory = (
    category: MemoryEntry['category'],
    limit: number = 5
  ): MemoryEntry[] => {
    return memory.memories
      .filter(m => m.category === category)
      .slice(0, limit);
  };

  // Get recent memories
  const getRecentMemories = (days: number = 7, limit: number = 10): MemoryEntry[] => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return memory.memories
      .filter(m => new Date(m.date) >= cutoffDate)
      .slice(0, limit);
  };

  // Clear old memories (older than 90 days)
  const clearOldMemories = () => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    const updated = { ...memory };
    updated.memories = updated.memories.filter(
      m => new Date(m.date) >= cutoffDate
    );
    updated.lastUpdated = new Date();
    saveMemory(updated);
  };

  // Get memory summary for context
  const getMemorySummary = (): string => {
    const goals = getMemoriesByCategory('goal', 3);
    const challenges = getMemoriesByCategory('challenge', 3);
    const insights = getMemoriesByCategory('insight', 3);
    const progress = getMemoriesByCategory('progress', 2);

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

    return summary;
  };

  // Export all memories
  const exportMemories = (): string => {
    return JSON.stringify(memory, null, 2);
  };

  // Delete specific memory
  const deleteMemory = (id: string) => {
    const updated = { ...memory };
    updated.memories = updated.memories.filter(m => m.id !== id);
    updated.lastUpdated = new Date();
    saveMemory(updated);
  };

  // Update/Edit specific memory
  const updateMemory = (id: string, content: string) => {
    const updated = { ...memory };
    const memoryIndex = updated.memories.findIndex(m => m.id === id);
    if (memoryIndex !== -1) {
      updated.memories[memoryIndex] = {
        ...updated.memories[memoryIndex],
        content,
        date: new Date(),
      };
      updated.lastUpdated = new Date();
      saveMemory(updated);
    }
  };

  // Update memory category
  const updateMemoryCategory = (id: string, category: MemoryEntry['category']) => {
    const updated = { ...memory };
    const memoryIndex = updated.memories.findIndex(m => m.id === id);
    if (memoryIndex !== -1) {
      updated.memories[memoryIndex] = {
        ...updated.memories[memoryIndex],
        category,
      };
      updated.lastUpdated = new Date();
      saveMemory(updated);
    }
  };

  // Clear all memories
  const clearAllMemories = () => {
    const updated: ChatMemory = {
      userId,
      memories: [],
      lastUpdated: new Date(),
      conversationHistory: [],
    };
    saveMemory(updated);
  };

  return {
    memory,
    addMemory,
    addToConversationHistory,
    getRelevantMemories,
    getMemoriesByCategory,
    getRecentMemories,
    clearOldMemories,
    getMemorySummary,
    exportMemories,
    deleteMemory,
    updateMemory,
    updateMemoryCategory,
    clearAllMemories,
  };
};
