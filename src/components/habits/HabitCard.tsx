import React from 'react';
import { Habit, HabitCheck } from '@/hooks/useHabits';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface Props {
  habit: Habit;
  checks: HabitCheck[];
  onToggle: (habitId: string, date: string) => void;
  onDelete?: (habitId: string) => void;
}

function formatDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const HabitCard: React.FC<Props> = ({ habit, checks, onToggle, onDelete }) => {
  const days = 30;
  const today = new Date();
  const checkSet = new Set(checks.filter(c => c.habit_id === habit.id).map(c => c.checked_date));

  const dayItems = [] as { date: Date; key: string; checked: boolean }[];
  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date(today);
    dt.setDate(today.getDate() - i);
    const key = formatDateKey(dt);
    dayItems.push({ date: dt, key, checked: checkSet.has(key) });
  }

  const habitColor = habit.color || undefined;
  const borderColor = habitColor ? `border-l-4` : '';
  const borderStyle = habitColor ? { borderLeftColor: habitColor } : {};

  return (
    <div 
      className={`p-4 bg-card rounded-lg border border-glass ${borderColor}`}
      style={borderStyle}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {habitColor && (
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: habitColor }}
              title="Habit color"
            />
          )}
          <div>
            <div className="font-semibold text-foreground">{habit.title}</div>
            {habit.description && <div className="text-sm text-muted-foreground">{habit.description}</div>}
          </div>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          {onDelete && (
            <Button variant="ghost" size="icon" onClick={() => onDelete(habit.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-10 gap-1">
        {dayItems.map(d => (
          <button
            key={d.key}
            onClick={() => onToggle(habit.id, d.key)}
            className={`w-4 h-4 rounded border border-glass transition-all ${
              d.checked 
                ? habitColor 
                  ? 'opacity-100 scale-110' 
                  : 'bg-primary'
                : 'bg-muted/30'
            }`}
            style={d.checked && habitColor ? { backgroundColor: habitColor } : undefined}
            title={d.key}
            aria-pressed={d.checked}
          />
        ))}
      </div>
    </div>
  );
};

export default HabitCard;
