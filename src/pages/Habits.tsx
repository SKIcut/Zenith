import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useHabits } from '@/hooks/useHabits';
import HabitCard from '@/components/habits/HabitCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowLeft, MessageCircle, Loader2, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function Habits() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Call useHabits hook unconditionally (React hooks must be called at top level)
  const habitsData = useHabits();
  const habits = Array.isArray(habitsData.habits) ? habitsData.habits : [];
  const habitChecks = Array.isArray(habitsData.habitChecks) ? habitsData.habitChecks : [];
  const isLoading = habitsData.isLoading || false;
  const createHabit = habitsData.createHabit;
  const deleteHabit = habitsData.deleteHabit;
  const toggleCheck = habitsData.toggleCheck;
  const refetch = habitsData.refetch;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleCreate = async () => {
    if (!title.trim()) return toast({ title: 'Title required', variant: 'destructive' });
    if (!createHabit || typeof createHabit.mutateAsync !== 'function') {
      toast({ title: 'Failed to create', description: 'Habit creation is not available. Please refresh the page.', variant: 'destructive' });
      return;
    }
    try {
      await (createHabit.mutateAsync as any)({ 
        title: title.trim(), 
        description: desc.trim() || undefined,
        color: selectedColor || undefined
      });
      setTitle(''); 
      setDesc('');
      setSelectedColor('');
      setDialogOpen(false);
      toast({ title: 'Habit created successfully!' });
    } catch (err: any) {
      toast({ title: 'Failed to create', description: err?.message || String(err), variant: 'destructive' });
    }
  };

  const habitColors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Indigo', value: '#6366f1' },
  ];

  const handleToggle = async (habitId: string, date: string) => {
    if (!toggleCheck || typeof toggleCheck.mutateAsync !== 'function') {
      toast({ title: 'Failed', description: 'Habit toggle is not available.', variant: 'destructive' });
      return;
    }
    try {
      await (toggleCheck.mutateAsync as any)({ habit_id: habitId, date });
      refetch();
    } catch (err: any) {
      toast({ title: 'Failed', description: err?.message || String(err), variant: 'destructive' });
    }
  };

  const handleDelete = async (habitId: string) => {
    if (!deleteHabit || typeof deleteHabit.mutateAsync !== 'function') {
      toast({ title: 'Failed to delete', description: 'Habit deletion is not available.', variant: 'destructive' });
      return;
    }
    try {
      await (deleteHabit.mutateAsync as any)(habitId);
      toast({ title: 'Habit deleted' });
    } catch (err: any) {
      toast({ title: 'Failed to delete', description: err?.message || String(err), variant: 'destructive' });
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background" style={{ backgroundImage: 'var(--gradient-background)' }}>
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
              onClick={() => navigate(-1)}
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
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Habits</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Habit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Habit</DialogTitle>
                <DialogDescription>
                  Track your daily habits and build consistency. Add a title, description, and choose a color.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Morning Meditation"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && title.trim()) {
                        handleCreate();
                      }
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Optional: Add details about your habit..."
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Color (Optional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {habitColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setSelectedColor(selectedColor === color.value ? '' : color.value)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          selectedColor === color.value
                            ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-primary'
                            : 'border-border hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                        aria-label={`Select ${color.name} color`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!title.trim() || !createHabit || createHabit.isPending}>
                  {createHabit?.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Habit'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {isLoading && <div className="text-center py-8">Loading…</div>}
          {!isLoading && habits && Array.isArray(habits) && habits.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No habits yet. Create your first habit above!
            </div>
          )}
          {habits && Array.isArray(habits) && habits.map(h => (
            <HabitCard key={h.id} habit={h} checks={habitChecks || []} onToggle={handleToggle} onDelete={handleDelete} />
          ))}
        </div>
      </main>
      </div>
    </ErrorBoundary>
  );
}
