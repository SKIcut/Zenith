import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useMemory, type MemoryEntry } from '@/hooks/useMemory';
import { Trash2, Download, Brain, Edit2, Plus, X, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MemoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const MemoryManager = ({ open, onOpenChange, userId }: MemoryManagerProps) => {
  const { memory, deleteMemory, clearAllMemories, exportMemories, getMemoriesByCategory, addMemory, updateMemory } = useMemory(userId);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState<'goal' | 'challenge' | 'insight' | 'lesson' | 'progress' | 'breakthrough'>('insight');

  const handleExport = async () => {
    const data = await exportMemories();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
    element.setAttribute('download', `zenith-memories-${new Date().toISOString().split('T')[0]}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast({ title: '✅ Exported', description: 'Memories downloaded successfully' });
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure? This will permanently delete all memories.')) {
      clearAllMemories();
      toast({ title: '🗑️ Cleared', description: 'All memories deleted', variant: 'destructive' });
    }
  };

  const handleEdit = (mem: MemoryEntry) => {
    setEditingId(mem.id);
    setEditContent(mem.content);
  };

  const handleSaveEdit = () => {
    if (editingId && editContent.trim()) {
      updateMemory(editingId, editContent.trim());
      toast({ title: '✏️ Updated', description: 'Memory updated successfully' });
      setEditingId(null);
      setEditContent('');
    }
  };

  const handleAddNew = () => {
    if (newMemoryContent.trim()) {
      addMemory(newMemoryCategory, newMemoryContent.trim(), 'Manually added memory');
      toast({ title: '✅ Added', description: 'New memory saved' });
      setNewMemoryContent('');
      setShowAddNew(false);
    }
  };

  const categories = ['insight', 'goal', 'challenge', 'progress', 'lesson', 'breakthrough'] as const;
  
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = memory.memories.filter(m => m.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-glass max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Memory Management
          </DialogTitle>
          <DialogDescription>
            Manage, edit, and customize your memories. Zenith uses these to provide personalized mentoring.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Memory Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`p-3 rounded-lg border-2 transition-all capitalize ${
                  selectedCategory === cat
                    ? 'border-primary bg-primary/20'
                    : 'border-glass bg-muted/30 hover:border-primary'
                }`}
              >
                <div className="text-2xl font-bold text-primary">{categoryCounts[cat]}</div>
                <div className="text-xs text-muted-foreground">{cat}</div>
              </button>
            ))}
          </div>

          {/* Add New Memory Button */}
          {!showAddNew && (
            <Button
              onClick={() => setShowAddNew(true)}
              className="w-full gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
              Add New Memory
            </Button>
          )}

          {/* Add New Memory Form */}
          {showAddNew && (
            <div className="space-y-3 p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <h3 className="font-semibold text-foreground">Create New Memory</h3>
              <select
                value={newMemoryCategory}
                onChange={(e) => setNewMemoryCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-muted border border-glass rounded-lg text-foreground text-sm"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="capitalize">{cat}</option>
                ))}
              </select>
              <Textarea
                value={newMemoryContent}
                onChange={(e) => setNewMemoryContent(e.target.value)}
                placeholder="What do you want to remember?"
                className="bg-input border-glass min-h-20 resize-none"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddNew(false);
                    setNewMemoryContent('');
                  }}
                  className="border-glass flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddNew}
                  disabled={!newMemoryContent.trim()}
                  className="bg-primary hover:bg-primary/90 flex-1 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Save Memory
                </Button>
              </div>
            </div>
          )}

          {/* Selected Category Details */}
          {selectedCategory && (
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold capitalize text-foreground">{selectedCategory} Memories</h3>
                <span className="text-xs text-muted-foreground">{getMemoriesByCategory(selectedCategory as any, 50).length} items</span>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getMemoriesByCategory(selectedCategory as any, 50).length > 0 ? (
                  getMemoriesByCategory(selectedCategory as any, 50).map((mem) => (
                    <div key={mem.id} className="p-3 bg-card rounded border border-glass space-y-2">
                      {editingId === mem.id ? (
                        <>
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="bg-input border-glass min-h-16 resize-none text-sm"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingId(null)}
                              className="h-8 flex-1"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveEdit}
                              className="bg-primary hover:bg-primary/90 h-8 flex-1 gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Save
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-foreground">{mem.content}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {new Date(mem.date).toLocaleDateString()}
                            </p>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(mem)}
                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                title="Edit memory"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  deleteMemory(mem.id);
                                  toast({ title: '🗑️ Deleted', description: 'Memory removed' });
                                }}
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                title="Delete memory"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No {selectedCategory} memories yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Memory Summary */}
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <h3 className="font-semibold text-foreground mb-2">Memory Stats</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {memory.memories.length} total memory entries stored
            </p>
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(memory.lastUpdated).toLocaleDateString()} at {new Date(memory.lastUpdated).toLocaleTimeString()}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={handleExport}
              className="gap-2 flex-1"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAll}
              className="gap-2 flex-1"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
