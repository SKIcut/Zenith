export type TaskPriority = 'low' | 'normal' | 'high';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  priority: TaskPriority;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  deadline?: string;
  priority: TaskPriority;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  deadline?: string | null;
  priority?: TaskPriority;
  completed?: boolean;
  completed_at?: string | null;
}
