import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserProfile, RoleModel } from '@/types/mentor';
import { X, Plus, Trash2 } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onReset: () => void;
}

export const SettingsDialog = ({
  open,
  onOpenChange,
  profile,
  onUpdateProfile,
  onReset,
}: SettingsDialogProps) => {
  const [name, setName] = useState(profile.name);
  const [goals, setGoals] = useState<string[]>(profile.goals.length ? profile.goals : ['']);
  const [challenges, setChallenges] = useState<string[]>(profile.challenges.length ? profile.challenges : ['']);
  const [roleModels, setRoleModels] = useState<RoleModel[]>(
    profile.roleModels.length ? profile.roleModels : [{ name: '', reason: '' }]
  );
  const [style, setStyle] = useState(profile.communicationStyle);

  const handleSave = () => {
    onUpdateProfile({
      name,
      goals: goals.filter(g => g.trim()),
      challenges: challenges.filter(c => c.trim()),
      roleModels: roleModels.filter(rm => rm.name.trim()),
      communicationStyle: style,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-glass max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Your Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-input border-glass"
            />
          </div>

          {/* Communication Style */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Communication Style</label>
            <div className="grid gap-2">
              {[
                { value: 'direct', label: 'Direct & No-Nonsense' },
                { value: 'supportive', label: 'Warm & Supportive' },
                { value: 'balanced', label: 'Balanced' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStyle(option.value as typeof style)}
                  className={`p-3 rounded-lg border text-left text-sm transition-all ${
                    style === option.value
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-glass bg-glass text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Goals</label>
            <div className="space-y-2">
              {goals.map((goal, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={goal}
                    onChange={(e) => {
                      const newGoals = [...goals];
                      newGoals[i] = e.target.value;
                      setGoals(newGoals);
                    }}
                    className="bg-input border-glass"
                    placeholder="Enter a goal"
                  />
                  {goals.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setGoals(goals.filter((_, idx) => idx !== i))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGoals([...goals, ''])}
                className="w-full border-glass"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Goal
              </Button>
            </div>
          </div>

          {/* Role Models */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Role Models</label>
            <div className="space-y-3">
              {roleModels.map((rm, i) => (
                <div key={i} className="p-3 bg-muted/30 rounded-lg space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={rm.name}
                      onChange={(e) => {
                        const newRMs = [...roleModels];
                        newRMs[i].name = e.target.value;
                        setRoleModels(newRMs);
                      }}
                      className="bg-input border-glass"
                      placeholder="Name"
                    />
                    {roleModels.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setRoleModels(roleModels.filter((_, idx) => idx !== i))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    value={rm.reason}
                    onChange={(e) => {
                      const newRMs = [...roleModels];
                      newRMs[i].reason = e.target.value;
                      setRoleModels(newRMs);
                    }}
                    className="bg-input border-glass"
                    placeholder="Why do they inspire you?"
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRoleModels([...roleModels, { name: '', reason: '' }])}
                className="w-full border-glass"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Role Model
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-glass">
            <Button variant="outline" onClick={onReset} className="border-destructive text-destructive">
              <Trash2 className="w-4 h-4 mr-2" /> Reset All Data
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-gradient-primary text-primary-foreground">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
