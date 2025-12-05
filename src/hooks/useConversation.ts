import { useState, useEffect } from 'react';
import { Message, Conversation } from '@/types/mentor';

const STORAGE_KEY = 'ai_mentor_conversations';

export const useConversation = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConversations(parsed);
        if (parsed.length > 0) {
          setCurrentConversationId(parsed[parsed.length - 1].id);
        }
      } catch {
        setConversations([]);
      }
    }
  }, []);

  const saveConversations = (convs: Conversation[]) => {
    setConversations(convs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
  };

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updated = [...conversations, newConv];
    saveConversations(updated);
    setCurrentConversationId(newConv.id);
    return newConv.id;
  };

  const addMessage = (message: Message) => {
    let convId = currentConversationId;
    if (!convId) {
      convId = createNewConversation();
    }

    const updated = conversations.map(conv => {
      if (conv.id === convId) {
        return {
          ...conv,
          messages: [...conv.messages, message],
          updatedAt: new Date(),
        };
      }
      return conv;
    });

    // If no conversation was updated (new conversation case)
    if (!conversations.find(c => c.id === convId)) {
      const newConv: Conversation = {
        id: convId,
        messages: [message],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      saveConversations([...conversations, newConv]);
    } else {
      saveConversations(updated);
    }
  };

  const updateLastAssistantMessage = (content: string) => {
    if (!currentConversationId) return;

    const updated = conversations.map(conv => {
      if (conv.id === currentConversationId) {
        const messages = [...conv.messages];
        const lastIndex = messages.length - 1;
        if (lastIndex >= 0 && messages[lastIndex].role === 'assistant') {
          messages[lastIndex] = { ...messages[lastIndex], content };
        }
        return { ...conv, messages, updatedAt: new Date() };
      }
      return conv;
    });
    saveConversations(updated);
  };

  const clearConversations = () => {
    saveConversations([]);
    setCurrentConversationId(null);
  };

  return {
    conversations,
    currentConversation,
    currentConversationId,
    setCurrentConversationId,
    createNewConversation,
    addMessage,
    updateLastAssistantMessage,
    clearConversations,
  };
};
