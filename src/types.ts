export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  text: string;
  priority: Priority;
  completed: boolean;
  timestamp: number;
  isRepeating: boolean;
  lastCompleted?: number;
}

export interface Analytics {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  completionRate: number;
}

export type Filter = 'all' | 'active' | 'completed';

export interface DailyTaskInfo {
  date: string;
  completedTasks: number;
  totalTasks: number;
  completedTaskIds: string[];
  repeatingTaskIds: string[];
  nonRepeatingTaskIds: string[];
}