import React, { useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Search, Settings2, Sparkles } from 'lucide-react';
import { useAppStore } from './store/useAppStore';
import { useTaskMonitor } from './hooks/useTaskMonitor';
import { CompanionAvatar } from './components/CompanionAvatar';
import { DynamicBanner } from './components/DynamicBanner';
import { StatsStrip } from './components/StatsStrip';
import { QuickCaptureBar } from './components/QuickCaptureBar';
import { TaskCard } from './components/TaskCard';
import { SettingsModal } from './components/SettingsModal';
import { TabBar, TabKey } from './components/TabBar';
import { CalendarPage } from './components/CalendarPage';
import { RoutinesPage } from './components/RoutinesPage';
import { MemosPage } from './components/MemosPage';
import { ExpiryPage } from './components/ExpiryPage';

function hexToRgbString(hex: string): string {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return '244, 114, 182';
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

export default function App() {
  const now = useTaskMonitor();
  const {
    tasks,
    tags,
    settings,
    stats,
    mood,
    toast,
    routines,
    memos,
    expiryItems,
    addTask,
    cycleTaskStatus,
    deleteTask,
    addTag,
    removeTag,
    updateSettings,
    setMood,
    clearToast,
    addRoutine,
    deleteRoutine,
    toggleRoutineDone,
    addMemo,
    deleteMemo,
    addExpiryItem,
    deleteExpiryItem,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [activeTagFilter, setActiveTagFilter] = useState<string>('all');
  const [hideDone, setHideDone] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    const isDark = settings.themeMode === 'dark';
    root.classList.toggle('dark', isDark);
    root.style.setProperty('--glass-opacity', String(settings.glassOpacity));
    root.style.setProperty('--accent-rgb', hexToRgbString(settings.accentColor));

    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
      StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {});
    }
  }, [settings.themeMode, settings.glassOpacity, settings.accentColor]);

  const tagMap = useMemo(
    () => Object.fromEntries(tags.map((t) => [t.id, t])),
    [tags]
  );

  const pendingTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'done'),
    [tasks]
  );

  const urgentCount = useMemo(() => {
    const leadMs = settings.remindBeforeMinutes * 60 * 1000;
    return pendingTasks.filter(
      (t) => typeof t.dueAt === 'number' && t.dueAt - now <= leadMs
    ).length;
  }, [pendingTasks, settings.remindBeforeMinutes, now]);

  const visibleTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks
      .filter((t) => (activeTagFilter === 'all' ? true : t.tagId === activeTagFilter))
      .filter((t) => (hideDone ? t.status !== 'done' : true))
      .filter(
        (t) =>
          !q ||
          t.title.toLowerCase().includes(q) ||
          (t.note ?? '').toLowerCase().includes(q)
      )
      .sort((a, b) => {
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (a.status !== 'done' && b.status === 'done') return -1;
        if (a.status === 'doing' && b.status !== 'doing') return -1;
        if (a.status !== 'doing' && b.status === 'doing') return 1;
        if (a.dueAt && b.dueAt) return a.dueAt - b.dueAt;
        if (a.dueAt) return -1;
        if (b.dueAt) return 1;
        return b.createdAt - a.createdAt;
      });
  }, [tasks, activeTagFilter, hideDone, searchQuery]);

  const todayTasks = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return tasks
      .filter(
        (t) =>
          t.status !== 'done' &&
          typeof t.dueAt === 'number' &&
          t.dueAt <= end.getTime()
      )
      .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0))
      .slice(0, 5);
  }, [tasks]);

  const todayFormatted = useMemo(() => {
    const d = new Date();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${d.getMonth() + 1}月${d.getDate()}日 · ${weekdays[d.getDay()]}`;
  }, []);

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        settings.themeMode === 'dark'
          ? 'ambient-wallpaper-dark text-white'
          : 'ambient-wallpaper-light text-slate-900'
      }`}
    >
      <DynamicBanner toast={toast} onClose={clearToast} />

      <main className="max-w-xl mx-auto px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-28 space-y-4">
        {activeTab === 'home' && (
          <>
            <header className="flex items-center justify-between px-1">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {todayFormatted}
                </p>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  下班前的小确幸清单
                </h1>
              </div>

              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                aria-label="打开个性化设置"
                className="liquid-pill w-10 h-10 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200"
              >
                <Settings2 className="w-4 h-4" />
              </button>
            </header>

            <CompanionAvatar
              name={settings.companionName}
              customAvatarUrl={settings.customAvatarUrl}
              mood={mood}
              pendingCount={pendingTasks.length}
              urgentCount={urgentCount}
              onTapCompanion={() =>
                setMood(mood === 'happy' ? 'idle' : 'happy')
              }
            />

            <StatsStrip stats={stats} />

            <QuickCaptureBar tags={tags} onAdd={addTask} />

            <section className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                  今日安排
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('todos')}
                  className="text-[11px] font-medium hover:underline"
                  style={{ color: 'rgb(var(--accent-rgb))' }}
                >
                  查看全部待办
                </button>
              </div>
              {todayTasks.length === 0 ? (
                <div className="liquid-glass rounded-[24px] py-8 px-6 text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    今天没有到点的安排，安心啦
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    没有截止时间的任务在「待办」页里
                  </p>
                </div>
              ) : (
                todayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    tag={tagMap[task.tagId]}
                    now={now}
                    remindBeforeMinutes={settings.remindBeforeMinutes}
                    onCycleStatus={cycleTaskStatus}
                    onDelete={deleteTask}
                  />
                ))
              )}
            </section>
          </>
        )}

        {activeTab === 'todos' && (
          <>
            <header className="px-1">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                每日待办
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                临时小事都在这里，到点自动提醒，不再漏掉
              </p>
            </header>

            <QuickCaptureBar tags={tags} onAdd={addTask} />

            <div className="liquid-glass rounded-full px-3.5 py-2 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜任务标题或备注…"
                className="flex-1 bg-transparent text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTagFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
                    activeTagFilter === 'all'
                      ? 'text-white shadow-xs'
                      : 'liquid-pill text-slate-600 dark:text-slate-300'
                  }`}
                  style={
                    activeTagFilter === 'all'
                      ? { backgroundColor: 'rgb(var(--accent-rgb))' }
                      : undefined
                  }
                >
                  全部 ({tasks.length})
                </button>

                {tags.map((tag) => {
                  const active = activeTagFilter === tag.id;
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => setActiveTagFilter(tag.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all ${
                        active
                          ? 'text-white shadow-xs'
                          : 'liquid-pill text-slate-600 dark:text-slate-300'
                      }`}
                      style={active ? { backgroundColor: tag.color } : undefined}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: active ? '#fff' : tag.color }}
                      />
                      {tag.name}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setHideDone((v) => !v)}
                className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white shrink-0 px-2 py-1"
              >
                {hideDone ? '显示已完成' : '隐藏已完成'}
              </button>
            </div>

            <section className="space-y-2.5">
              {visibleTasks.length === 0 ? (
                <div className="liquid-glass rounded-[28px] py-12 px-6 text-center space-y-2">
                  <Sparkles
                    className="w-6 h-6 mx-auto opacity-80"
                    style={{ color: 'rgb(var(--accent-rgb))' }}
                  />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {searchQuery.trim()
                      ? '没有搜到匹配的任务'
                      : '当前分类下没有待办小事'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    随时在上方输入框记一笔，或点「灵感」快速保存想法
                  </p>
                </div>
              ) : (
                visibleTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    tag={tagMap[task.tagId]}
                    now={now}
                    remindBeforeMinutes={settings.remindBeforeMinutes}
                    onCycleStatus={cycleTaskStatus}
                    onDelete={deleteTask}
                  />
                ))
              )}
            </section>
          </>
        )}

        {activeTab === 'calendar' && (
          <CalendarPage
            tasks={tasks}
            tagMap={tagMap}
            now={now}
            remindBeforeMinutes={settings.remindBeforeMinutes}
            onAdd={addTask}
            onCycleStatus={cycleTaskStatus}
            onDelete={deleteTask}
          />
        )}

        {activeTab === 'routines' && (
          <RoutinesPage
            routines={routines}
            onAdd={addRoutine}
            onDelete={deleteRoutine}
            onToggle={toggleRoutineDone}
          />
        )}

        {activeTab === 'memos' && (
          <MemosPage memos={memos} onAdd={addMemo} onDelete={deleteMemo} />
        )}

        {activeTab === 'expiry' && (
          <ExpiryPage
            items={expiryItems}
            onAdd={addExpiryItem}
            onDelete={deleteExpiryItem}
          />
        )}
      </main>

      <TabBar
        active={activeTab}
        onChange={setActiveTab}
        pendingCount={pendingTasks.length}
      />

      <SettingsModal
        open={settingsOpen}
        settings={settings}
        tags={tags}
        onClose={() => setSettingsOpen(false)}
        onUpdateSettings={updateSettings}
        onAddTag={addTag}
        onRemoveTag={removeTag}
      />
    </div>
  );
}
