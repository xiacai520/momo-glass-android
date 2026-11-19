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
  /** 早安提醒：每天固定时间由陪伴角色主动来问「今天要做什么」 */
  morningCheckin: boolean;
  morningTime: string;
  /** 晚间回顾：每天固定时间提醒「今天有什么忘了记 / 还有几件没做」 */
  eveningCheckin: boolean;
  eveningTime: string;
  /** 任务逾期后每隔多少分钟再提醒一次（最多 4 次），0 = 不追提醒 */
  overdueNagMinutes: number;
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
  /** 每周要点的星期几，0=周日 … 6=周六（与 Date.getDay 一致） */
  weekday?: number;
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
