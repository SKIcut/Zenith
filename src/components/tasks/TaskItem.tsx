import { Task } from '@/types/task';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Calendar } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  normal: 'bg-primary/20 text-primary',
  high: 'bg-destructive/20 text-destructive'
};

export function TaskItem({ task, onToggleComplete, onEdit, onDelete }: TaskItemProps) {
  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const isOverdue = task.deadline && isPast(new Date(task.deadline)) && !task.completed;

  return (
    <div
      className={cn(
        'group flex items-center gap-3 p-4 rounded-lg bg-card/50 border border-border/50 transition-all hover:border-primary/30',
        task.completed && 'opacity-60'
      )}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={(checked) => onToggleComplete(task.id, !!checked)}
        className="h-5 w-5"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              'font-medium text-foreground',
              task.completed && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </span>
          <Badge variant="secondary" className={priorityColors[task.priority]}>
            {task.priority}
          </Badge>
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground mt-1 truncate">
            {task.description}
          </p>
        )}

        {task.deadline && (
          <div className={cn(
            'flex items-center gap-1 text-xs mt-2',
            isOverdue ? 'text-destructive' : 'text-muted-foreground'
          )}>
            <Calendar className="h-3 w-3" />
            <span>{formatDeadline(task.deadline)}</span>
            {isOverdue && <span className="font-medium">(Overdue)</span>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(task)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
