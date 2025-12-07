import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Message, UserProfile } from '@/types/mentor';
import { streamMentorResponse } from '@/lib/mentorApi';
import { Send, Sparkles, User, Settings, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MentorChatProps {
  profile: UserProfile;
  onOpenSettings: () => void;
  onClearChat: () => void;
}

export const MentorChat = ({ profile, onOpenSettings, onClearChat }: MentorChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send initial greeting on first load
  useEffect(() => {
    if (messages.length === 0 && profile.onboardingComplete) {
      const greeting = `Hey ${profile.name}! It's good to have you here. 

This is your space - a private zone where you can think out loud, share your struggles, and work through whatever's on your mind. No judgment, just honest conversation.

I've learned from the greatest minds in history - from ${profile.roleModels[0]?.name || 'visionaries'} to countless others who've walked the path before you. I'm here to share their wisdom and help you find your own way.

So, what's on your mind today? What are you working through?`;

      setMessages([{ role: 'assistant', content: greeting, timestamp: new Date() }]);
    }
  }, [profile, messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim(), timestamp: new Date() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setIsStreaming(true);

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);

    let accumulatedContent = '';

    await streamMentorResponse(
      newMessages,
      profile,
      (chunk) => {
        accumulatedContent += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: accumulatedContent, timestamp: new Date() };
          return updated;
        });
      },
      () => {
        setIsLoading(false);
        setIsStreaming(false);
      },
      (error) => {
        setIsLoading(false);
        setIsStreaming(false);
        toast({
          title: 'Connection Error',
          description: error,
          variant: 'destructive',
        });
        // Remove empty assistant message on error
        setMessages(prev => prev.slice(0, -1));
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    "I'm feeling stuck with my goals",
    "Help me think through a decision",
    "I need some motivation today",
    "What would " + (profile.roleModels[0]?.name || "a great mentor") + " do?",
  ];

  return (
    <div className="min-h-screen bg-gradient-background flex flex-col">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-blob-1" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] animate-blob-2" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-glass border-b border-glass">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                AI Mentor
              </h1>
              <p className="text-xs text-muted-foreground">Your private space</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearChat}
              className="text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSettings}
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 container mx-auto px-4 py-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6 pb-32">
          {messages.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Ready when you are</h2>
              <p className="text-muted-foreground mb-8">What's on your mind today?</p>
              <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="text-left p-4 bg-glass backdrop-blur-glass border border-glass rounded-xl hover:border-primary transition-all text-sm text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 animate-fade-in ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-glass backdrop-blur-glass border border-glass text-foreground'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                {message.role === 'assistant' && isStreaming && index === messages.length - 1 && (
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                )}
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-3 animate-fade-in">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-glass backdrop-blur-glass border border-glass rounded-2xl p-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-glass border-t border-glass">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share what's on your mind..."
                className="flex-1 bg-input border-glass text-foreground placeholder:text-muted-foreground resize-none min-h-[48px] max-h-[200px]"
                rows={1}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground h-12 px-6"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              This is your private space. Speak freely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
