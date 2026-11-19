import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { CategoryTag, Task } from '../types';
import { TaskCard } from './TaskCard';

interface Props {
  tasks: Task[];
  tagMap: Record<string, CategoryTag | undefined>;
  now: number;
  remindBeforeMinutes: number;
  onAdd: (payload: { title: string; tagId?: string; dueAt?: number }) => void;
  onCycleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const dateKey = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const CalendarPage: React.FC<Props> = ({
  tasks,
  tagMap,
  now,
  remindBeforeMinutes,
  onAdd,
  onCycleStatus,
  onDelete,
}) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedKey, setSelectedKey] = useState(dateKey(today));
  const [newTitle, setNewTitle] = useState('');

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((t) => {
      if (typeof t.dueAt !== 'number') return;
      const key = dateKey(new Date(t.dueAt));
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    });
    return map;
  }, [tasks]);

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const result: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(new Date(viewYear, viewMonth, d));
    return result;
  }, [viewYear, viewMonth]);

  const moveMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const selectedTasks = useMemo(
    () =>
      (tasksByDay.get(selectedKey) ?? [])
        .slice()
        .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0)),
    [tasksByDay, selectedKey]
  );

  const selectedLabel = useMemo(() => {
    const [y, m, d] = selectedKey.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${m}月${d}日 · ${weekdays[dt.getDay()]}`;
  }, [selectedKey]);

  const handleAdd = () => {
    const title = newTitle.trim();
    if (!title) return;
    const [y, m, d] = selectedKey.split('-').map(Number);
    const due = new Date(y, m - 1, d, 20, 0, 0, 0).getTime();
    onAdd({ title, dueAt: due, tagId: 'work' });
    setNewTitle('');
  };

  return (
    <div className="space-y-4">
      <header className="px-1">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          日程日历
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          点任意一天看当天的安排，也能直接给这天加件事（默认 20:00 提醒）
        </p>
      </header>

      <div className="liquid-glass rounded-[28px] p-4">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/50 dark:bg-white/10 text-slate-600 dark:text-slate-300 ios-spring"
            aria-label="上个月"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-slate-800 dark:text-white">
            {viewYear} 年 {viewMonth + 1} 月
          </span>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/50 dark:bg-white/10 text-slate-600 dark:text-slate-300 ios-spring"
            aria-label="下个月"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
            <span
              key={w}
              className="text-center text-[10px] font-medium text-slate-400 dark:text-slate-500 py-1"
            >
              {w}
            </span>
          ))}
          {cells.map((date, idx) => {
            if (!date) return <span key={`empty-${idx}`} />;
            const key = dateKey(date);
            const dayTasks = tasksByDay.get(key) ?? [];
            const isToday = key === dateKey(new Date());
            const isSelected = key === selectedKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedKey(key)}
                className={`rounded-xl py-1.5 flex flex-col items-center justify-start min-h-11 text-xs transition-all ${
                  isSelected
                    ? 'text-white shadow-sm'
                    : isToday
                    ? 'ring-1 ring-slate-400/60 dark:ring-white/40 text-slate-800 dark:text-white'
                    : 'text-slate-700 dark:text-slate-200'
                }`}
                style={
                  isSelected
                    ? { backgroundColor: 'rgb(var(--accent-rgb))' }
                    : undefined
                }
              >
                <span className="font-medium leading-none mt-0.5">{date.getDate()}</span>
                {dayTasks.length > 0 && (
                  <span className="flex gap-0.5 mt-1">
                    {dayTasks.slice(0, 3).map((t) => (
                      <span
                        key={t.id}
                        className="w-1 h-1 rounded-full"
                        style={{
                          backgroundColor: isSelected
                            ? '#ffffff'
                            : tagMap[t.tagId]?.color ?? '#94a3b8',
                          opacity: t.status === 'done' ? 0.35 : 1,
                        }}
                      />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
          {selectedLabel} 的安排
        </h3>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          共 {selectedTasks.length} 项
        </span>
      </div>

      <div className="liquid-glass rounded-[24px] p-2.5 flex items-center gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="给这天加件事…"
          className="flex-1 bg-transparent px-2 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newTitle.trim()}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white shadow-sm disabled:opacity-40 ios-spring"
          style={{ backgroundColor: 'rgb(var(--accent-rgb))' }}
          aria-label="添加安排"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <section className="space-y-2.5">
        {selectedTasks.length === 0 ? (
          <div className="liquid-glass rounded-[24px] py-8 px-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              这天还没有安排
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              在上方输入框给这天加第一件事吧
            </p>
          </div>
        ) : (
          selectedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              tag={tagMap[task.tagId]}
              now={now}
              remindBeforeMinutes={remindBeforeMinutes}
              onCycleStatus={onCycleStatus}
              onDelete={onDelete}
            />
          ))
        )}
      </section>
    </div>
  );
};
