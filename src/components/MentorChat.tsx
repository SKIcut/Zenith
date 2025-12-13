import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Message, UserProfile } from '@/types/mentor';
import { streamMentorResponse } from '@/lib/mentorApi';
import { Send, User, Save, Brain, Copy } from 'lucide-react';
import { generateMotivation } from '@/lib/motivation';
import { fetchMotivation } from '@/lib/mentorApi';
import { ZenithLogo } from '@/components/ZenithLogo';
import { MemoryManager } from '@/components/MemoryManager';
import { FunctionPanel } from '@/components/FunctionPanel';
// FunctionsDock removed from inline chat view per UX change
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMemory } from '@/hooks/useMemory';
import { MemoryExtractor, type ExtractedMemory } from '@/lib/memoryExtractor';
// taskSync detection disabled in chat UI (no suggestions)
import { useTasks } from '@/hooks/useTasks';
import { trackEvent } from '@/lib/analytics';
import { motion, AnimatePresence } from 'framer-motion';

interface MentorChatProps {
  profile: UserProfile;
  onOpenSettings: () => void;
  onClearChat: () => void;
}

export const MentorChat = ({ profile, onOpenSettings, onClearChat }: MentorChatProps) => {
  const navigate = useNavigate();
  const { signOut, isAuthenticated } = useAuth();
  const { memory, addMemory, addToConversationHistory, getMemorySummary } = useMemory(profile.name || 'default');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showMemoryManager, setShowMemoryManager] = useState(false);
  const [showFunctionPanel, setShowFunctionPanel] = useState(false);
  const [detectedMemories, setDetectedMemories] = useState<ExtractedMemory[]>([]);
  const [showMemoryConfirm, setShowMemoryConfirm] = useState(false);
  const [pendingTaskAction, setPendingTaskAction] = useState<null | { type: 'delete' | 'complete'; candidates: any[]; originalPayload?: string }>(null);
  const [motivation, setMotivation] = useState<{ code: string; text: string } | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const { tasks: existingTasks = [], createTask, deleteTask, toggleComplete } = useTasks();

  // Helper: find task candidates by payload (substring & token overlap)
  const findTaskCandidates = (payload: string) => {
    const p = payload.trim().toLowerCase();
    if (!p) return [] as any[];
    const tasksArr = (existingTasks || []) as any[];
    // exact match
    const exact = tasksArr.filter(t => (t.title || '').toLowerCase() === p);
    if (exact.length) return exact;
    // substring
    const substr = tasksArr.filter(t => (t.title || '').toLowerCase().includes(p));
    if (substr.length) return substr;
    // token overlap score fallback
    const payloadWords = new Set(p.split(/\s+/).filter(Boolean));
    const scored = tasksArr.map(t => {
      const title = (t.title || '').toLowerCase();
      const titleWords = new Set(title.split(/\s+/).filter(Boolean));
      const intersection = [...payloadWords].filter(w => titleWords.has(w)).length;
      const union = new Set([...payloadWords, ...titleWords]).size || 1;
      const score = intersection / union;
      return { task: t, score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
    return scored.map(s => s.task);
  };

  // Simple task-command parser to allow quick task operations via chat
  const parseTaskCommand = (text: string): { type: 'list' | 'list:today' | 'add' | 'delete' | 'complete' | null; payload?: string } => {
    const t = text.trim().toLowerCase();
    if (/^(what('?| i?s)?\s+)?(are\s+)?(my\s+)?tasks( for today)?\??$/.test(t) || /^(show|list) tasks/.test(t)) {
      if (/today/.test(t)) return { type: 'list:today' };
      return { type: 'list' };
    }
    const addMatch = t.match(/^(?:add|create) (?:a )?task[:\s]+(.+)/i) || t.match(/^(?:remind me to)\s+(.+)/i);
    if (addMatch && addMatch[1]) return { type: 'add', payload: addMatch[1].trim() };
    const deleteMatch = t.match(/^(?:delete|remove) (?:task )?[:\s]*([\w\s\-']+)/i);
    if (deleteMatch && deleteMatch[1]) return { type: 'delete', payload: deleteMatch[1].trim() };
    const completeMatch = t.match(/^(?:complete|done|finish) (?:task )?[:\s]*([\w\s\-']+)/i);
    if (completeMatch && completeMatch[1]) return { type: 'complete', payload: completeMatch[1].trim() };
    return { type: null };
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle scroll to show/hide header
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const main = e.target as HTMLDivElement;
      const currentScrollY = main.scrollTop;
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down
        setShowHeader(false);
      } else {
        // Scrolling up
        setShowHeader(true);
      }
      setLastScrollY(currentScrollY);
    };

    const main = mainRef.current;
    if (main) {
      main.addEventListener('scroll', handleScroll);
      return () => main.removeEventListener('scroll', handleScroll);
    }
  }, [lastScrollY]);

  // Previously this effect sent an initial greeting message on first load.
  // The app no longer auto-sends that assistant greeting. We still load a
  // motivational snippet for the UI but do not push an assistant message.
  useEffect(() => {
    if (messages.length === 0 && profile.onboardingComplete) {
      (async () => {
        const remote = await fetchMotivation(profile).catch(() => null);
        if (remote) setMotivation(remote);
        else setMotivation(generateMotivation());
      })();
    }
  }, [profile, messages.length]);

  const handleCopyMotivation = async () => {
    if (!motivation) return;
    try {
      await navigator.clipboard.writeText(`${motivation.code} — ${motivation.text}`);
      toast({ title: 'Copied', description: 'Motivation copied to clipboard.' });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('copy failed', err);
      toast({ title: 'Copy failed', description: 'Could not copy to clipboard.', variant: 'destructive' });
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setMotivation(null);
    setDetectedMemories([]);
    setShowMemoryConfirm(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    

    // If we're awaiting a pending task action (delete/complete), handle confirmations here
    if (pendingTaskAction) {
      const reply = input.trim().toLowerCase();
      const userMessage: Message = { role: 'user', content: input.trim(), timestamp: new Date() };
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      // cancel / no
      if (reply === 'cancel' || reply === 'no') {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Okay — cancelled the action.', timestamp: new Date() }]);
        setPendingTaskAction(null);
        return;
      }

      // numeric selection
      const numeric = parseInt(reply, 10);
      let chosen: any = null;
      if (!isNaN(numeric)) {
        if (numeric >= 1 && numeric <= pendingTaskAction.candidates.length) {
          chosen = pendingTaskAction.candidates[numeric - 1];
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: `Number out of range. Reply with a number between 1 and ${pendingTaskAction.candidates.length}, or 'cancel'.`, timestamp: new Date() }]);
          return;
        }
      } else if (reply === 'yes' || reply === 'y') {
        if (pendingTaskAction.candidates.length === 1) {
          chosen = pendingTaskAction.candidates[0];
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: `Please reply with the number of the task to ${pendingTaskAction.type}, or 'cancel'.`, timestamp: new Date() }]);
          return;
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `I didn't understand. Reply with the task number, 'yes' to confirm, or 'cancel' to abort.`, timestamp: new Date() }]);
        return;
      }

      // perform the requested action
      if (!isAuthenticated) {
        setMessages(prev => [...prev, { role: 'assistant', content: `I can't perform that because you're not signed in. Please sign in to manage tasks.`, timestamp: new Date() }]);
        setPendingTaskAction(null);
        return;
      }

      try {
        if (pendingTaskAction.type === 'delete') {
          await deleteTask.mutateAsync(chosen.id);
          setMessages(prev => [...prev, { role: 'assistant', content: `Deleted "${chosen.title}".`, timestamp: new Date() }]);
        } else if (pendingTaskAction.type === 'complete') {
          await toggleComplete.mutateAsync({ id: chosen.id, completed: true });
          setMessages(prev => [...prev, { role: 'assistant', content: `Marked "${chosen.title}" as complete.`, timestamp: new Date() }]);
        }
      } catch (err: any) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Failed to ${pendingTaskAction.type} task: ${err?.message || String(err)}`, timestamp: new Date() }]);
      } finally {
        setPendingTaskAction(null);
      }

      return;
    }

    // Intercept simple task commands locally (no AI round-trip)
    const cmd = parseTaskCommand(input);
    if (cmd.type) {
      const userMessage: Message = { role: 'user', content: input.trim(), timestamp: new Date() };
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      try {
        if (cmd.type === 'list' || cmd.type === 'list:today') {
          const now = new Date();
          const list = (existingTasks || []).filter((t: any) => !t.completed).filter((t: any) => {
            if (cmd.type === 'list') return true;
            if (!t.deadline) return false;
            const d = new Date(t.deadline);
            return d.toDateString() === now.toDateString();
          });
          if (list.length === 0) {
            setMessages(prev => [...prev, { role: 'assistant', content: "You have no tasks" + (cmd.type === 'list:today' ? ' for today.' : '.'), timestamp: new Date() }]);
          } else {
            const body = list.map((t: any, i: number) => `${i + 1}. ${t.title}${t.deadline ? ` (due ${new Date(t.deadline).toLocaleDateString()})` : ''}`).join('\n');
            setMessages(prev => [...prev, { role: 'assistant', content: `Here are your tasks:\n${body}`, timestamp: new Date() }]);
          }
          return;
        }

        if (cmd.type === 'add' && cmd.payload) {
          // create task via mutation
          if (!isAuthenticated) {
            setMessages(prev => [...prev, { role: 'assistant', content: `I can't save tasks because you're not signed in. Please sign in to sync tasks.`, timestamp: new Date() }]);
            return;
          }
          try {
            await createTask.mutateAsync({ title: cmd.payload, description: null, priority: 'normal' });
            setMessages(prev => [...prev, { role: 'assistant', content: `Created task: "${cmd.payload}"`, timestamp: new Date() }]);
          } catch (err: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Failed to create task: ${err?.message || String(err)}`, timestamp: new Date() }]);
          }
          return;
        }

        if (cmd.type === 'delete' && cmd.payload) {
          const candidates = findTaskCandidates(cmd.payload);
          if (candidates.length === 0) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Couldn't find a task matching "${cmd.payload}".`, timestamp: new Date() }]);
            return;
          }
          // ask for confirmation even for a single match
          setPendingTaskAction({ type: 'delete', candidates, originalPayload: cmd.payload });
          if (candidates.length === 1) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Do you want me to delete "${candidates[0].title}"? Reply 'yes' to confirm or 'no' to cancel.`, timestamp: new Date() }]);
          } else {
            const list = candidates.map((t: any, i: number) => `${i + 1}. ${t.title}`).join('\n');
            setMessages(prev => [...prev, { role: 'assistant', content: `I found multiple tasks matching "${cmd.payload}":\n${list}\nReply with the number to delete, or 'cancel'.`, timestamp: new Date() }]);
          }
          return;
        }

        if (cmd.type === 'complete' && cmd.payload) {
          const candidates = findTaskCandidates(cmd.payload);
          if (candidates.length === 0) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Couldn't find a task matching "${cmd.payload}".`, timestamp: new Date() }]);
            return;
          }
          setPendingTaskAction({ type: 'complete', candidates, originalPayload: cmd.payload });
          if (candidates.length === 1) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Do you want me to mark "${candidates[0].title}" as complete? Reply 'yes' to confirm or 'no' to cancel.`, timestamp: new Date() }]);
          } else {
            const list = candidates.map((t: any, i: number) => `${i + 1}. ${t.title}`).join('\n');
            setMessages(prev => [...prev, { role: 'assistant', content: `I found multiple tasks matching "${cmd.payload}":\n${list}\nReply with the number to mark complete, or 'cancel'.`, timestamp: new Date() }]);
          }
          return;
        }
      } catch (err: any) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Task operation failed: ${err?.message || String(err)}`, timestamp: new Date() }]);
        return;
      }
    }

    // Otherwise proceed with regular chat flow
    const messageText = input.trim();
    const userMessage: Message = { role: 'user', content: messageText, timestamp: new Date() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setIsStreaming(true);

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date() }] );

    // Add user message to memory
    addToConversationHistory(`User: ${messageText}`);

    // analytics: track chat send
    try {
      trackEvent('chat_send', { text: messageText, onboardingComplete: profile.onboardingComplete });
    } catch (e) {
      // ignore analytics errors
    }

    let accumulatedContent = '';

    // Get memory context
    const memorySummary = getMemorySummary();

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
        addToConversationHistory(`Assistant: ${accumulatedContent}`);
        
        // Intelligent memory extraction
        const extractedMemories = MemoryExtractor.extractMemories(input.trim(), accumulatedContent);
        
        // Check if user explicitly requested to remember something
        const isExplicitMemoryRequest = MemoryExtractor.isMemoryRequest(input.trim());
        
        if (isExplicitMemoryRequest) {
          const memoryContent = MemoryExtractor.extractMemoryRequest(input.trim());
          if (memoryContent) {
            setDetectedMemories([{
              type: 'decision',
              content: memoryContent,
              confidence: 1,
              context: 'Explicit user request to remember'
            }]);
            setShowMemoryConfirm(true);
            return;
          }
        }
        
        // Auto-save high-confidence extracted memories
        if (extractedMemories.length > 0) {
          extractedMemories.forEach(mem => {
            addMemory(mem.type, mem.content, mem.context);
            try { trackEvent('memory_saved', { type: mem.type, snippet: mem.content.substring(0, 120) }); } catch (e) { /* no-op */ }
          });
          
          // Show confirmation toast
          if (extractedMemories.length === 1) {
            toast({
              title: '💾 Memory Saved',
              description: `Remembered: ${extractedMemories[0].content.substring(0, 50)}...`,
            });
          } else {
            toast({
              title: '💾 Memories Saved',
              description: `Saved ${extractedMemories.length} important insights`,
            });
          }
        }

        // Task detection disabled: do not suggest or auto-create tasks from conversation
      },
      (error) => {
        setIsLoading(false);
        setIsStreaming(false);
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive',
        });
      },
      memorySummary
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Lightweight inline markdown renderer (supports **bold**, *italic*, `code`, and [link](url)).
  // Keeps plain text safe and avoids adding external dependencies.
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const nodes: React.ReactNode[] = [];
    let rest = text;
    let key = 0;

    // order matters: link, bold, code, italic
    const patterns: { type: string; regex: RegExp }[] = [
      { type: 'link', regex: /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/ },
      { type: 'bold', regex: /\*\*([^*]+)\*\*/ },
      { type: 'code', regex: /`([^`]+)`/ },
      { type: 'italic', regex: /\*([^*]+)\*/ },
    ];

    while (rest.length > 0) {
      let earliest: number | null = null;
      let chosen: { type: string; match: RegExpExecArray | null } | null = null;

      for (const p of patterns) {
        const m = p.regex.exec(rest);
        if (m) {
          const idx = m.index;
          if (earliest === null || idx < earliest) {
            earliest = idx;
            chosen = { type: p.type, match: m };
          }
        }
      }

      if (!chosen || earliest === null) {
        nodes.push(rest);
        break;
      }

      if (earliest > 0) {
        nodes.push(rest.slice(0, earliest));
      }

      const m = chosen.match!;
      if (chosen.type === 'link') {
        const label = m[1];
        const href = m[2];
        nodes.push(
          <a key={key++} href={href} target="_blank" rel="noopener noreferrer" className="underline text-primary">
            {label}
          </a>
        );
      } else if (chosen.type === 'bold') {
        nodes.push(<strong key={key++}>{m[1]}</strong>);
      } else if (chosen.type === 'code') {
        nodes.push(<code key={key++} className="bg-muted px-1 rounded text-sm">{m[1]}</code>);
      } else if (chosen.type === 'italic') {
        nodes.push(<em key={key++}>{m[1]}</em>);
      } else {
        nodes.push(m[0]);
      }

      rest = rest.slice(earliest + m[0].length);
    }

    return <p className="whitespace-pre-wrap leading-relaxed typing-text">{nodes}</p>;
  };

  const suggestions = [
    "I'm feeling stuck with my goals",
    "Help me think through a decision",
    "I need some motivation today",
    "What would " + (profile.roleModels[0]?.name || "a great mentor") + " do?",
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: showHeader ? 0 : -100 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="sticky top-0 z-50 backdrop-blur-glass"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Zenith
          </h1>
          <div className="flex items-center">
            {/* Habits shortcut removed */}
            {!showFunctionPanel && (
              <button
                aria-label="Open menu"
                onClick={() => setShowFunctionPanel(true)}
                className="group inline-flex items-center justify-center p-2 rounded-md mr-2"
              >
                <span className="flex flex-col gap-1">
                  <span className="block w-5 h-[2px] bg-muted-foreground group-hover:bg-foreground rounded" />
                  <span className="block w-5 h-[2px] bg-muted-foreground group-hover:bg-foreground rounded" />
                  <span className="block w-5 h-[2px] bg-muted-foreground group-hover:bg-foreground rounded" />
                </span>
              </button>
            )}
          </div>
        </div>
      </motion.header>

      <FunctionPanel
        open={showFunctionPanel}
        onOpenChange={setShowFunctionPanel}
        onNewChat={handleNewChat}
        onOpenMemory={() => { setShowMemoryManager(true); setShowFunctionPanel(false); }}
        onOpenTasks={() => { navigate('/tasks'); setShowFunctionPanel(false); }}
        onOpenAnalytics={() => { try { trackEvent('view_analytics'); } catch (e) {} navigate('/analytics'); setShowFunctionPanel(false); }}
        onOpenHabits={() => { navigate('/habits'); setShowFunctionPanel(false); }}
        onOpenSettings={() => { onOpenSettings(); setShowFunctionPanel(false); }}
        onClearChat={() => { onClearChat(); setShowFunctionPanel(false); }}
        onSignOut={() => { handleSignOut(); setShowFunctionPanel(false); }}
        onExportMemories={() => { /* placeholder - can call memory.export if exposed */ }}
        onPreviewMotivation={() => { setMotivation(generateMotivation()); }}
      />

      {/* Backdrop overlay */}
      <AnimatePresence>
        {showFunctionPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowFunctionPanel(false)}
            className="fixed inset-0 z-[55] bg-black/20 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Messages */}
      <main ref={mainRef} className="flex-1 container mx-auto px-4 py-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6 pb-32">
          {messages.length === 0 && (
            <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
              {motivation && (
                <div className="mx-auto max-w-2xl text-center">
                  <p className="motivation-serif text-4xl md:text-5xl lg:text-6xl text-foreground leading-tight">{motivation.text}</p>
                </div>
              )}

            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 animate-fade-in ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] ${message.role === 'user'
                  ? 'bg-primary/90 text-primary-foreground px-5 py-3 rounded-2xl'
                  : 'text-foreground'
                  }`}
              >
                {renderMarkdown(message.content)}
                {message.role === 'assistant' && isStreaming && index === messages.length - 1 && (
                  <span className="inline-block w-2 h-4 bg-primary typing-cursor ml-1" />
                )}
              </div>
              {/* avatars removed to reduce visual clutter while chatting */}
            </div>
          ))}

          {/* Inline quick tools removed */}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-3 animate-fade-in">
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
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm py-4">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-muted/80 rounded-2xl p-2 pl-4">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What's on your mind?"
                className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground resize-none min-h-[40px] max-h-[150px] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                rows={1}
              />
              <div className="flex gap-2 shrink-0">
                {input.trim() && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      onClick={handleSend}
                      disabled={isLoading}
                      size="icon"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10 rounded-full shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Memory Confirmation Dialog */}
      {showMemoryConfirm && detectedMemories.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-glass rounded-lg p-6 max-w-md w-full space-y-4">
            <div className="flex items-center gap-2">
              <Save className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Save to Memory?</h3>
            </div>
            
            <div className="space-y-3">
              {detectedMemories.map((mem, idx) => (
                <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-glass/50">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold text-primary capitalize bg-primary/20 px-2 py-1 rounded">
                      {mem.type}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-2">{mem.content}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMemoryConfirm(false);
                  setDetectedMemories([]);
                }}
                className="border-glass"
              >
                Skip
              </Button>
              <Button
                onClick={() => {
                  detectedMemories.forEach(mem => {
                    addMemory(mem.type, mem.content, mem.context);
                    try { trackEvent('memory_saved', { type: mem.type, snippet: mem.content.substring(0, 120) }); } catch (e) { /* no-op */ }
                  });
                  toast({
                    title: '✅ Memories Saved',
                    description: `Saved ${detectedMemories.length} item(s) to memory`,
                  });
                  setShowMemoryConfirm(false);
                  setDetectedMemories([]);
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Save All
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Memory Manager */}
      <MemoryManager
        open={showMemoryManager}
        onOpenChange={setShowMemoryManager}
        userId={profile.name || 'default'}
      />
    </div>
  );
};
