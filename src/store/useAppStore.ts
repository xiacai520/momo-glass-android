import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AppSettings,
  CategoryTag,
  CompanionMood,
  DailyStats,
  ExpiryItem,
  InAppToast,
  Memo,
  Routine,
  RoutineCadence,
  Task,
  TaskStatus,
} from '../types';

const pad2 = (n: number) => String(n).padStart(2, '0');

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

// 本地日期（YYYY-MM-DD），不用 toISOString，避免 UTC 时区导致 0–8 点算成前一天
const getTodayStr = () => toDateStr(new Date());

const getYesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateStr(d);
};

// 例行要点按周期判断「本期已完成」：每日=当天、每周=本周一所在周、每月=当月、流程=手动勾选不清零
export const routinePeriodKey = (cadence: RoutineCadence, from = new Date()): string => {
  if (cadence === 'daily') return toDateStr(from);
  if (cadence === 'monthly') return `${from.getFullYear()}-${pad2(from.getMonth() + 1)}`;
  if (cadence === 'weekly') {
    const d = new Date(from);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    return `W:${toDateStr(d)}`;
  }
  return 'process';
};

export const isRoutineDone = (routine: Routine): boolean =>
  routine.lastDoneKey === routinePeriodKey(routine.cadence);

const daysFromNowStr = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDateStr(d);
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

const SEED_ROUTINES: Routine[] = [
  { id: 'seed-r1', title: '起床后看一眼今日安排', cadence: 'daily', time: '08:00', createdAt: Date.now() },
  { id: 'seed-r2', title: '睡前整理桌面和背包', cadence: 'daily', time: '22:30', createdAt: Date.now() },
  { id: 'seed-r3', title: '周复盘：花销、课程、待办', cadence: 'weekly', time: '20:00', createdAt: Date.now() },
  { id: 'seed-r4', title: '月初检查会员订阅和自动续费', cadence: 'monthly', createdAt: Date.now() },
  { id: 'seed-r5', title: '出门前检查：手机、钥匙、耳机、充电宝', cadence: 'process', createdAt: Date.now() },
];

const SEED_MEMOS: Memo[] = [
  {
    id: 'seed-m1',
    title: '欢迎使用灵感备忘',
    content: '灵感、备忘、常用信息都可以放这里，顶部搜索框支持全文检索。这是一条示例，不需要可以删掉。',
    category: '备忘',
    createdAt: Date.now(),
  },
];

const SEED_EXPIRY_ITEMS: ExpiryItem[] = [
  { id: 'seed-e1', name: '示例：牛奶', category: '食品', expiryDate: daysFromNowStr(3), note: '示例条目，可删除', createdAt: Date.now() },
  { id: 'seed-e2', name: '示例：防晒霜', category: '护肤美妆', expiryDate: daysFromNowStr(60), note: '示例条目，可删除', createdAt: Date.now() },
];

interface AppState {
  tasks: Task[];
  tags: CategoryTag[];
  settings: AppSettings;
  stats: DailyStats;
  mood: CompanionMood;
  toast: InAppToast | null;
  routines: Routine[];
  memos: Memo[];
  expiryItems: ExpiryItem[];

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

  addRoutine: (payload: { title: string; note?: string; cadence: RoutineCadence; time?: string }) => void;
  deleteRoutine: (id: string) => void;
  toggleRoutineDone: (id: string) => void;

  addMemo: (payload: { title: string; content: string; category: string }) => void;
  deleteMemo: (id: string) => void;

  addExpiryItem: (payload: { name: string; category: string; expiryDate: string; note?: string }) => void;
  deleteExpiryItem: (id: string) => void;

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
        companionName: '予宁',
        customAvatarUrl: '',
        themeMode: 'light',
        accentColor: '#f472b6',
        glassOpacity: 0.85,
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
      routines: SEED_ROUTINES,
      memos: SEED_MEMOS,
      expiryItems: SEED_EXPIRY_ITEMS,

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
        const leavingDone = prevTask && prevTask.status === 'done' && status !== 'done';

        set((state) => {
          const nextStats = { ...state.stats };
          if (nextStats.todayDate !== today) {
            nextStats.todayDate = today;
            nextStats.todayCompleted = 0;
          }

          if (leavingDone) {
            // 撤销完成要把计数减回去，否则反复点选会把统计刷高
            nextStats.totalCompleted = Math.max(0, nextStats.totalCompleted - 1);
            if (
              prevTask?.completedAt &&
              toDateStr(new Date(prevTask.completedAt)) === today
            ) {
              nextStats.todayCompleted = Math.max(0, nextStats.todayCompleted - 1);
            }
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

      addRoutine: ({ title, note, cadence, time }) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        set((state) => ({
          routines: [
            ...state.routines,
            {
              id: crypto.randomUUID(),
              title: trimmed,
              note: note?.trim() || undefined,
              cadence,
              time: time || undefined,
              createdAt: Date.now(),
            },
          ],
        }));
      },

      deleteRoutine: (id) =>
        set((state) => ({
          routines: state.routines.filter((r) => r.id !== id),
        })),

      toggleRoutineDone: (id) => {
        const routine = get().routines.find((r) => r.id === id);
        if (!routine) return;
        const key = routinePeriodKey(routine.cadence);
        set((state) => ({
          routines: state.routines.map((r) =>
            r.id === id
              ? { ...r, lastDoneKey: r.lastDoneKey === key ? undefined : key }
              : r
          ),
        }));
      },

      addMemo: ({ title, content, category }) => {
        const trimmedTitle = title.trim();
        const trimmedContent = content.trim();
        if (!trimmedTitle && !trimmedContent) return;
        set((state) => ({
          memos: [
            {
              id: crypto.randomUUID(),
              title: trimmedTitle || '无标题',
              content: trimmedContent,
              category,
              createdAt: Date.now(),
            },
            ...state.memos,
          ],
        }));
      },

      deleteMemo: (id) =>
        set((state) => ({
          memos: state.memos.filter((m) => m.id !== id),
        })),

      addExpiryItem: ({ name, category, expiryDate, note }) => {
        const trimmed = name.trim();
        if (!trimmed || !expiryDate) return;
        set((state) => ({
          expiryItems: [
            ...state.expiryItems,
            {
              id: crypto.randomUUID(),
              name: trimmed,
              category,
              expiryDate,
              note: note?.trim() || undefined,
              createdAt: Date.now(),
            },
          ],
        }));
      },

      deleteExpiryItem: (id) =>
        set((state) => ({
          expiryItems: state.expiryItems.filter((i) => i.id !== id),
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
      version: 2,
      migrate: (persistedState, version) => {
        const state = persistedState as {
          settings?: AppSettings;
          routines?: Routine[];
          memos?: Memo[];
          expiryItems?: ExpiryItem[];
        } | null;
        if (!state) return state;
        // v0 → v1：默认陪伴角色由「小桃 Momo」改为「予宁」；用户自己改过的名字不动
        if (version < 1 && state.settings?.companionName === '小桃 Momo') {
          state.settings = { ...state.settings, companionName: '予宁' };
        }
        // v1 → v2：新增例行要点、灵感备忘、到期管理三组数据，老用户补上示例数据
        if (version < 2) {
          state.routines = state.routines ?? SEED_ROUTINES;
          state.memos = state.memos ?? SEED_MEMOS;
          state.expiryItems = state.expiryItems ?? SEED_EXPIRY_ITEMS;
        }
        return state;
      },
      partialize: (state) => ({
        tasks: state.tasks,
        tags: state.tags,
        settings: state.settings,
        stats: state.stats,
        routines: state.routines,
        memos: state.memos,
        expiryItems: state.expiryItems,
      }),
    }
  )
);
