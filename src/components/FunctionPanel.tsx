import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Settings, ListTodo, Database, Trash2, LogOut, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


interface FunctionPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenMemory: () => void;
  onOpenTasks: () => void;
  onOpenSettings: () => void;
  onClearChat: () => void;
  onSignOut: () => void;
  onNewChat?: () => void;
  onExportMemories?: () => void;
  onPreviewMotivation?: () => void;
}

export const FunctionPanel: React.FC<FunctionPanelProps> = ({
  open,
  onOpenChange,
  onOpenMemory,
  onOpenTasks,
  onOpenSettings,
  onClearChat,
  onSignOut,
  onNewChat,
  onExportMemories,
  onPreviewMotivation,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 right-0 h-full w-96 z-[60] bg-card/95 backdrop-blur-md shadow-2xl border-l border-border"
        >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div>
          <div className="font-semibold">Functions</div>
          <div className="text-xs text-muted-foreground">Quick access to tools</div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-64px)]">
        <div className="space-y-2">
          {onNewChat && (
            <Button variant="ghost" className="w-full justify-start" onClick={() => { onNewChat(); onOpenChange(false); }}>
              <Archive className="w-4 h-4 mr-3" />
              New Chat
            </Button>
          )}
          {onPreviewMotivation && (
            <Button variant="ghost" className="w-full justify-start" onClick={() => { onPreviewMotivation(); onOpenChange(false); }}>
              <Archive className="w-4 h-4 mr-3" />
              Preview Motivation
            </Button>
          )}
          <Button variant="ghost" className="w-full justify-start" onClick={onOpenMemory}>
            <Database className="w-4 h-4 mr-3" />
            Memory Manager
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={onOpenTasks}>
            <ListTodo className="w-4 h-4 mr-3" />
            Tasks
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={onOpenSettings}>
            <Settings className="w-4 h-4 mr-3" />
            Settings
          </Button>
        </div>

        <div className="border-t border-border/40 pt-3 space-y-2">
          <Button variant="ghost" className="w-full justify-start" onClick={onExportMemories}
            disabled={!onExportMemories}
          >
            <Archive className="w-4 h-4 mr-3" />
            Export Memories
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={onClearChat}>
            <Trash2 className="w-4 h-4 mr-3" />
            Clear Chat
          </Button>
        </div>

        <div className="border-t border-border/40 pt-3 space-y-2">
          <Button variant="ghost" className="w-full justify-start" onClick={onExportMemories}
            disabled={!onExportMemories}
          >
            <Archive className="w-4 h-4 mr-3" />
            Export Memories
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={onClearChat}>
            <Trash2 className="w-4 h-4 mr-3" />
            Clear Chat
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={onSignOut}>
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>
      </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default FunctionPanel;
