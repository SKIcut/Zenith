import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { TaskList } from '@/components/tasks/TaskList';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, Loader2 } from 'lucide-react';


export default function Tasks() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { tasks, isLoading, createTask, updateTask, deleteTask, toggleComplete } = useTasks();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleBack = () => navigate(-1);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="font-semibold text-foreground">Zenith</span>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Chat
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2 text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <TaskList
          tasks={tasks}
          isLoading={isLoading}
          onCreateTask={(data) => createTask.mutate(data)}
          onUpdateTask={(id, data) => updateTask.mutate({ id, ...data })}
          onDeleteTask={(id) => deleteTask.mutate(id)}
          onToggleComplete={(id, completed) => toggleComplete.mutate({ id, completed })}
          isCreating={createTask.isPending}
          isUpdating={updateTask.isPending}
        />
      </main>
    </div>
  );
}
