import React, { useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Settings2, Sparkles } from 'lucide-react';
import { useAppStore } from './store/useAppStore';
import { useTaskMonitor } from './hooks/useTaskMonitor';
import { CompanionAvatar } from './components/CompanionAvatar';
import { DynamicBanner } from './components/DynamicBanner';
import { StatsStrip } from './components/StatsStrip';
import { QuickCaptureBar } from './components/QuickCaptureBar';
import { TaskCard } from './components/TaskCard';
import { SettingsModal } from './components/SettingsModal';

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
    addTask,
    cycleTaskStatus,
    deleteTask,
    addTag,
    removeTag,
    updateSettings,
    setMood,
    clearToast,
  } = useAppStore();

  const [activeTagFilter, setActiveTagFilter] = useState<string>('all');
  const [hideDone, setHideDone] = useState<boolean>(false);
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
    return tasks
      .filter((t) => (activeTagFilter === 'all' ? true : t.tagId === activeTagFilter))
      .filter((t) => (hideDone ? t.status !== 'done' : true))
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
  }, [tasks, activeTagFilter, hideDone]);

  const todayFormatted = useMemo(() => {
    const d = new Date();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${d.getMonth() + 1}月${d.getDate()}日 · ${weekdays[d.getDay()]}`;
  }, []);

  return (
    <div
      className={`min-h-screen transition-colors duration-500 pb-24 ${
        settings.themeMode === 'dark'
          ? 'ambient-wallpaper-dark text-white'
          : 'ambient-wallpaper-light text-slate-900'
      }`}
    >
      <DynamicBanner toast={toast} onClose={clearToast} />

      <main className="max-w-xl mx-auto px-4 pt-[max(1.25rem,env(safe-area-inset-top))] space-y-4">
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
                当前分类下没有待办小事
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
      </main>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div className="liquid-glass-elevated pointer-events-auto rounded-full px-4 py-1.5 flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300">
          <span>待处理 {pendingTasks.length} 项</span>
          <span className="opacity-30">|</span>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="font-medium hover:underline"
            style={{ color: 'rgb(var(--accent-rgb))' }}
          >
            玻璃透明度 {Math.round(settings.glassOpacity * 100)}%
          </button>
        </div>
      </div>

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
