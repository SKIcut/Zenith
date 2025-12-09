import { useMemo, useState } from 'react';
import { Task, CreateTaskInput } from '@/types/task';
import { TaskItem } from './TaskItem';
import { TaskDialog } from './TaskDialog';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle2, ListTodo, Loader2 } from 'lucide-react';
import { isToday, isTomorrow, isAfter, startOfDay } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onCreateTask: (data: CreateTaskInput) => void;
  onUpdateTask: (id: string, data: CreateTaskInput) => void;
  onDeleteTask: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  isCreating?: boolean;
  isUpdating?: boolean;
}

export function TaskList({
  tasks,
  isLoading,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onToggleComplete,
  isCreating,
  isUpdating
}: TaskListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { todayTasks, upcomingTasks, completedTasks } = useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = startOfDay(new Date(Date.now() + 86400000));

    const todayTasks: Task[] = [];
    const upcomingTasks: Task[] = [];
    const completedTasks: Task[] = [];

    tasks.forEach((task) => {
      if (task.completed) {
        completedTasks.push(task);
      } else if (!task.deadline) {
        todayTasks.push(task);
      } else {
        const deadline = startOfDay(new Date(task.deadline));
        if (isToday(deadline) || deadline < today) {
          todayTasks.push(task);
        } else {
          upcomingTasks.push(task);
        }
      }
    });

    // Sort by priority (high first)
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const sortByPriority = (a: Task, b: Task) =>
      priorityOrder[a.priority] - priorityOrder[b.priority];

    return {
      todayTasks: todayTasks.sort(sortByPriority),
      upcomingTasks: upcomingTasks.sort((a, b) => {
        if (!a.deadline || !b.deadline) return 0;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }),
      completedTasks: completedTasks.sort((a, b) => 
        new Date(b.completed_at || b.updated_at).getTime() - 
        new Date(a.completed_at || a.updated_at).getTime()
      )
    };
  }, [tasks]);

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDialogSubmit = (data: CreateTaskInput) => {
    if (editingTask) {
      onUpdateTask(editingTask.id, data);
    } else {
      onCreateTask(data);
    }
    setDialogOpen(false);
    setEditingTask(null);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingTask(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const TaskSection = ({
    title,
    icon: Icon,
    tasks,
    emptyMessage
  }: {
    title: string;
    icon: React.ElementType;
    tasks: Task[];
    emptyMessage?: string;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{title}</span>
        <span className="text-xs">({tasks.length})</span>
      </div>
      {tasks.length === 0 ? (
        emptyMessage && (
          <p className="text-sm text-muted-foreground/60 pl-6">{emptyMessage}</p>
        )
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">My Tasks</h2>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      <div className="space-y-8">
        <TaskSection
          title="Today"
          icon={ListTodo}
          tasks={todayTasks}
          emptyMessage="No tasks for today. Add one above!"
        />

        {upcomingTasks.length > 0 && (
          <TaskSection title="Upcoming" icon={ListTodo} tasks={upcomingTasks} />
        )}

        {completedTasks.length > 0 && (
          <TaskSection title="Completed" icon={CheckCircle2} tasks={completedTasks} />
        )}
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        task={editingTask}
        onSubmit={handleDialogSubmit}
        isLoading={isCreating || isUpdating}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) onDeleteTask(deleteId);
                setDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
