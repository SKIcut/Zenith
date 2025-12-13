import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart2, CalendarDays, CheckSquare, FileText, Settings, Archive } from 'lucide-react';

interface FunctionsDockProps {
  onOpenAnalytics?: () => void;
  onOpenHabits?: () => void;
  onOpenTasks?: () => void;
  onOpenMemories?: () => void;
  onOpenSettings?: () => void;
  onExport?: () => void;
}

export const FunctionsDock: React.FC<FunctionsDockProps> = ({
  onOpenAnalytics,
  onOpenHabits,
  onOpenTasks,
  onOpenMemories,
  onOpenSettings,
  onExport,
}) => {
  const navigate = useNavigate();

  return (
    <div className="w-full">
      <div className="mx-auto max-w-3xl">
        <div className="bg-card border border-glass rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">Quick Tools</h4>
            <p className="text-xs text-muted-foreground">Tap to open</p>
          </div>
          <div className="flex gap-2 overflow-x-auto py-1">
            <Button size="sm" variant="ghost" onClick={() => { onOpenAnalytics?.(); }}>
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                <span className="text-sm">Analytics</span>
              </div>
            </Button>

            <Button size="sm" variant="ghost" onClick={() => { onOpenHabits?.(); }}>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                <span className="text-sm">Habits</span>
              </div>
            </Button>

            <Button size="sm" variant="ghost" onClick={() => { onOpenTasks?.(); navigate('/tasks'); }}>
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                <span className="text-sm">Tasks</span>
              </div>
            </Button>

            <Button size="sm" variant="ghost" onClick={() => { onOpenMemories?.(); navigate('/memories'); }}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm">Memories</span>
              </div>
            </Button>

            <Button size="sm" variant="ghost" onClick={() => { onExport?.(); }}>
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4" />
                <span className="text-sm">Export</span>
              </div>
            </Button>

            <Button size="sm" variant="ghost" onClick={() => { onOpenSettings?.(); }}>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="text-sm">Settings</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FunctionsDock;
