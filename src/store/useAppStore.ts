import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AppSettings,
  CategoryTag,
  CompanionMood,
  DailyStats,
  InAppToast,
  Task,
  TaskStatus,
} from '../types';

const pad2 = (n: number) => String(n).padStart(2, '0');

// 本地日期（YYYY-MM-DD），不用 toISOString，避免 UTC 时区导致 0–8 点算成前一天
const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const getYesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const DEFAULT_TAGS: CategoryTag[] = [
  { id: 'work', name: '工作琐事', color: '#a78bfa' },
  { id: 'offwork', name: '下班带走', color: '#f472b6' },
  { id: 'habit', name: '日常习惯', color: '#34d399' },
  { id: 'idea', name: '突发灵感', color: '#fbbf24' },
];

const INITIAL_TASKS: Task[] = [
  {
    id: 'demo-1',
    title: '下班前把报销单据放进背包',
    note: '财务室 18:00 前截止，别又忘在工位抽屉里啦',
    tagId: 'offwork',
    status: 'doing',
    dueAt: Date.now() + 12 * 60 * 1000,
    createdAt: Date.now() - 3600 * 1000,
  },
  {
    id: 'demo-2',
    title: '给设计评审群同步新版原型链接',
    tagId: 'work',
    status: 'todo',
    dueAt: Date.now() + 90 * 60 * 1000,
    createdAt: Date.now() - 1800 * 1000,
  },
  {
    id: 'demo-3',
    title: '晚饭后顺路取快递 + 买无糖乌龙茶',
    tagId: 'habit',
    status: 'todo',
    createdAt: Date.now() - 900 * 1000,
  },
];

interface AppState {
  tasks: Task[];
  tags: CategoryTag[];
  settings: AppSettings;
  stats: DailyStats;
  mood: CompanionMood;
  toast: InAppToast | null;

  addTask: (payload: {
    title: string;
    note?: string;
    tagId?: string;
    dueAt?: number;
    isIdea?: boolean;
  }) => void;
  cycleTaskStatus: (id: string) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
  markTaskNotified: (id: string) => void;

  addTag: (name: string, color: string) => void;
  removeTag: (id: string) => void;

  updateSettings: (partial: Partial<AppSettings>) => void;
  setMood: (mood: CompanionMood) => void;
  showToast: (toast: Omit<InAppToast, 'id'>) => void;
  clearToast: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: INITIAL_TASKS,
      tags: DEFAULT_TAGS,
      settings: {
        companionName: '小桃 Momo',
        customAvatarUrl: '',
        themeMode: 'light',
        accentColor: '#f472b6',
        glassOpacity: 0.52,
        remindBeforeMinutes: 15,
      },
      stats: {
        todayDate: getTodayStr(),
        todayCompleted: 0,
        streakDays: 0,
        lastCompletedDate: null,
        totalCompleted: 0,
      },
      mood: 'idle',
      toast: null,

      addTask: ({ title, note, tagId, dueAt, isIdea }) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        const newTask: Task = {
          id: crypto.randomUUID(),
          title: trimmed,
          note: note?.trim() || undefined,
          tagId: tagId || (isIdea ? 'idea' : 'work'),
          status: 'todo',
          dueAt,
          isIdea,
          notified: false,
          createdAt: Date.now(),
        };
        set((state) => ({
          tasks: [newTask, ...state.tasks],
          mood: isIdea ? 'thinking' : 'happy',
        }));
        get().showToast({
          title: isIdea ? '灵感已捕捉 ✨' : '已记在小本本上啦',
          subtitle: trimmed,
          type: 'info',
        });
      },

      cycleTaskStatus: (id) => {
        const order: TaskStatus[] = ['todo', 'doing', 'done'];
        const target = get().tasks.find((t) => t.id === id);
        if (!target) return;
        const nextStatus = order[(order.indexOf(target.status) + 1) % order.length];
        get().setTaskStatus(id, nextStatus);
      },

      setTaskStatus: (id, status) => {
        const today = getTodayStr();
        const yesterday = getYesterdayStr();
        const prevTask = get().tasks.find((t) => t.id === id);
        const becomingDone = prevTask && prevTask.status !== 'done' && status === 'done';

        set((state) => {
          const nextStats = { ...state.stats };
          if (nextStats.todayDate !== today) {
            nextStats.todayDate = today;
            nextStats.todayCompleted = 0;
          }

          if (becomingDone) {
            nextStats.todayCompleted += 1;
            nextStats.totalCompleted += 1;
            if (nextStats.lastCompletedDate === today) {
              // keep streak
            } else if (nextStats.lastCompletedDate === yesterday) {
              nextStats.streakDays += 1;
              nextStats.lastCompletedDate = today;
            } else {
              nextStats.streakDays = 1;
              nextStats.lastCompletedDate = today;
            }
          }

          return {
            tasks: state.tasks.map((t) =>
              t.id === id
                ? {
                    ...t,
                    status,
                    completedAt: status === 'done' ? Date.now() : undefined,
                  }
                : t
            ),
            stats: nextStats,
            mood: becomingDone ? 'celebrate' : state.mood,
          };
        });

        if (becomingDone && prevTask) {
          get().showToast({
            title: '搞定一件小事！',
            subtitle: `「${prevTask.title}」已完成`,
            type: 'success',
          });
        }
      },

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      markTaskNotified: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, notified: true } : t)),
        })),

      addTag: (name, color) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) => ({
          tags: [...state.tags, { id: `tag-${Date.now()}`, name: trimmed, color }],
        }));
      },

      removeTag: (id) =>
        set((state) => ({
          tags: state.tags.filter((t) => t.id !== id),
        })),

      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),

      setMood: (mood) => set({ mood }),

      showToast: (toast) => {
        const id = String(Date.now());
        set({ toast: { ...toast, id } });
        setTimeout(() => {
          if (get().toast?.id === id) {
            set({ toast: null });
          }
        }, 4200);
      },

      clearToast: () => set({ toast: null }),
    }),
    {
      name: 'momo-liquid-glass-storage-v1',
      partialize: (state) => ({
        tasks: state.tasks,
        tags: state.tags,
        settings: state.settings,
        stats: state.stats,
      }),
    }
  )
);
