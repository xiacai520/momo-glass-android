import React, { useMemo, useState } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { Routine, RoutineCadence } from '../types';
import { isRoutineDone } from '../store/useAppStore';

interface Props {
  routines: Routine[];
  onAdd: (payload: { title: string; note?: string; cadence: RoutineCadence; time?: string }) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

const FILTERS: { id: RoutineCadence | 'all'; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'daily', label: '每日' },
  { id: 'weekly', label: '每周' },
  { id: 'monthly', label: '每月' },
  { id: 'process', label: '流程清单' },
];

const CADENCE_LABEL: Record<RoutineCadence, string> = {
  daily: '每日',
  weekly: '每周',
  monthly: '每月',
  process: '流程',
};

export const RoutinesPage: React.FC<Props> = ({ routines, onAdd, onDelete, onToggle }) => {
  const [filter, setFilter] = useState<RoutineCadence | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [cadence, setCadence] = useState<RoutineCadence>('daily');
  const [time, setTime] = useState('');

  const visible = useMemo(
    () =>
      routines
        .filter((r) => (filter === 'all' ? true : r.cadence === filter))
        .slice()
        .sort((a, b) => {
          const ta = a.time ?? '99:99';
          const tb = b.time ?? '99:99';
          if (ta !== tb) return ta < tb ? -1 : 1;
          return a.createdAt - b.createdAt;
        }),
    [routines, filter]
  );

  const doneCount = visible.filter(isRoutineDone).length;

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd({ title, note: note || undefined, cadence, time: time || undefined });
    setTitle('');
    setNote('');
    setTime('');
    setCadence('daily');
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <header className="px-1 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            生活要点
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            反复要做的小事按周期捋顺，本期进度 {doneCount}/{visible.length}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 rounded-full text-xs font-medium text-white flex items-center gap-1 shrink-0 ios-spring"
          style={{ backgroundColor: 'rgb(var(--accent-rgb))' }}
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? '收起' : '新增要点'}
        </button>
      </header>

      {showForm && (
        <div className="liquid-glass rounded-[24px] p-3.5 space-y-3 animate-glass-enter">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="要点内容，例如：睡前充电、检查门窗"
            className="w-full px-3.5 py-2 rounded-2xl text-sm bg-white/50 dark:bg-white/5 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="备注（可选）"
            className="w-full px-3.5 py-2 rounded-2xl text-xs bg-white/50 dark:bg-white/5 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTERS.filter((f) => f.id !== 'all').map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCadence(f.id as RoutineCadence)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  cadence === f.id
                    ? 'text-white'
                    : 'bg-white/40 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                }`}
                style={
                  cadence === f.id
                    ? { backgroundColor: 'rgb(var(--accent-rgb))' }
                    : undefined
                }
              >
                {f.label}
              </button>
            ))}
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="px-2.5 py-1 rounded-full text-xs bg-white/50 dark:bg-white/5 text-slate-700 dark:text-slate-200 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!title.trim()}
            className="w-full py-2 rounded-2xl text-sm font-medium text-white disabled:opacity-40 ios-spring"
            style={{ backgroundColor: 'rgb(var(--accent-rgb))' }}
          >
            添加要点
          </button>
        </div>
      )}

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
              filter === f.id
                ? 'text-white shadow-xs'
                : 'liquid-pill text-slate-600 dark:text-slate-300'
            }`}
            style={
              filter === f.id
                ? { backgroundColor: 'rgb(var(--accent-rgb))' }
                : undefined
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <section className="space-y-2.5">
        {visible.length === 0 ? (
          <div className="liquid-glass rounded-[24px] py-10 px-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              这个分类下还没有要点
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              点右上角「新增要点」把反复要做的小事记下来
            </p>
          </div>
        ) : (
          visible.map((routine) => {
            const done = isRoutineDone(routine);
            return (
              <div
                key={routine.id}
                className="liquid-glass rounded-[22px] p-3 flex items-center gap-3"
              >
                <button
                  type="button"
                  onClick={() => onToggle(routine.id)}
                  aria-label={done ? '标记为未完成' : '标记为已完成'}
                  className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center transition-all ios-spring ${
                    done
                      ? 'text-white'
                      : 'ring-1 ring-slate-300 dark:ring-white/30 text-transparent'
                  }`}
                  style={
                    done
                      ? { backgroundColor: 'rgb(var(--accent-rgb))' }
                      : undefined
                  }
                >
                  <Check className="w-4 h-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      done
                        ? 'text-slate-400 dark:text-slate-500 line-through'
                        : 'text-slate-800 dark:text-white'
                    }`}
                  >
                    {routine.title}
                  </p>
                  {routine.note && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {routine.note}
                    </p>
                  )}
                </div>
                {routine.time && (
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                    {routine.time}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/50 dark:bg-white/10 text-slate-500 dark:text-slate-300 shrink-0">
                  {CADENCE_LABEL[routine.cadence]}
                </span>
                <button
                  type="button"
                  onClick={() => onDelete(routine.id)}
                  aria-label="删除要点"
                  className="text-slate-300 hover:text-rose-500 dark:text-slate-600 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </section>

      <p className="text-[11px] text-slate-400 dark:text-slate-500 px-1">
        每日要点每天清零，每周要点每周一清零，每月要点每月清零；流程清单勾了就一直算完成，再点一次取消。
      </p>
    </div>
  );
};
