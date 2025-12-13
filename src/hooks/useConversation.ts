import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Message, Conversation } from '@/types/mentor';

export const useConversation = () => {
  const queryClient = useQueryClient();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Fetch conversations for the current user
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async (): Promise<Conversation[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch conversations
      const { data: convs, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (convError) throw convError;
      if (!convs || convs.length === 0) return [];

      // Fetch messages for all conversations
      const conversationIds = convs.map(c => c.id);
      const { data: msgs, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;

      // Combine conversations with their messages
      return convs.map(conv => ({
        id: conv.id,
        messages: (msgs || [])
          .filter(m => m.conversation_id === conv.id)
          .map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: new Date(m.created_at),
          })),
        createdAt: new Date(conv.created_at),
        updatedAt: new Date(conv.updated_at),
      })) as Conversation[];
    },
  });

  // Set current conversation to the most recent one on load
  useEffect(() => {
    if (conversations.length > 0 && !currentConversationId) {
      setCurrentConversationId(conversations[0].id);
    }
  }, [conversations, currentConversationId]);

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  const createNewConversation = useMutation({
    mutationFn: async (): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: null,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setCurrentConversationId(id);
    },
  });

  const addMessage = useMutation({
    mutationFn: async ({ message, conversationId }: { message: Message; conversationId?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let convId = conversationId || currentConversationId;
      
      // Create conversation if none exists
      if (!convId) {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            title: null,
          })
          .select()
          .single();

        if (convError) throw convError;
        convId = newConv.id;
        setCurrentConversationId(convId);
      }

      // Add message
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: convId,
          role: message.role,
          content: message.content,
        });

      if (msgError) throw msgError;

      // Update conversation updated_at
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', convId);

      if (updateError) throw updateError;

      return convId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const updateLastAssistantMessage = useMutation({
    mutationFn: async (content: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let convId = currentConversationId;
      
      // Create conversation if none exists
      if (!convId) {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            title: null,
          })
          .select()
          .single();

        if (convError) throw convError;
        convId = newConv.id;
        setCurrentConversationId(convId);
      }

      // Get the last assistant message
      const { data: messages, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .eq('role', 'assistant')
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;
      if (!messages || messages.length === 0) {
        // Create new message if none exists
        const { error: insertError } = await supabase
          .from('messages')
          .insert({
            conversation_id: convId,
            role: 'assistant',
            content,
          });

        if (insertError) throw insertError;
      } else {
        // Update existing message
        const { error: updateError } = await supabase
          .from('messages')
          .update({ content })
          .eq('id', messages[0].id);

        if (updateError) throw updateError;
      }

      // Update conversation updated_at
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', convId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const clearConversations = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get all user conversations
      const { data: convs, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;
      if (!convs || convs.length === 0) return;

      const conversationIds = convs.map(c => c.id);

      // Delete messages first (CASCADE should handle this, but being explicit)
      const { error: msgError } = await supabase
        .from('messages')
        .delete()
        .in('conversation_id', conversationIds);

      if (msgError) throw msgError;

      // Delete conversations
      const { error: convError } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', user.id);

      if (convError) throw convError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setCurrentConversationId(null);
    },
  });

  return {
    conversations,
    currentConversation,
    currentConversationId,
    setCurrentConversationId,
    isLoading,
    createNewConversation: () => createNewConversation.mutate(),
    addMessage: (message: Message) => addMessage.mutate({ message }),
    updateLastAssistantMessage: (content: string) => updateLastAssistantMessage.mutate(content),
    clearConversations: () => clearConversations.mutate(),
  };
};
