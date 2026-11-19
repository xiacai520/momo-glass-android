export type TaskStatus = 'todo' | 'doing' | 'done';

export type CompanionMood = 'idle' | 'happy' | 'urgent' | 'thinking' | 'celebrate';

export interface CategoryTag {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  note?: string;
  tagId: string;
  status: TaskStatus;
  dueAt?: number;
  isIdea?: boolean;
  notified?: boolean;
  createdAt: number;
  completedAt?: number;
}

export interface AppSettings {
  companionName: string;
  customAvatarUrl: string;
  themeMode: 'light' | 'dark';
  accentColor: string;
  glassOpacity: number;
  remindBeforeMinutes: number;
}

export interface DailyStats {
  todayDate: string;
  todayCompleted: number;
  streakDays: number;
  lastCompletedDate: string | null;
  totalCompleted: number;
}

export interface InAppToast {
  id: string;
  title: string;
  subtitle?: string;
  type: 'urgent' | 'info' | 'success';
}

export type RoutineCadence = 'daily' | 'weekly' | 'monthly' | 'process';

export interface Routine {
  id: string;
  title: string;
  note?: string;
  cadence: RoutineCadence;
  time?: string;
  lastDoneKey?: string;
  createdAt: number;
}

export interface Memo {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: number;
}

export interface ExpiryItem {
  id: string;
  name: string;
  category: string;
  expiryDate: string;
  note?: string;
  createdAt: number;
}
