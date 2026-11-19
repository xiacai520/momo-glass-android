import React from 'react';
import { Check, Clock, Lightbulb, Play, Trash2 } from 'lucide-react';
import { CategoryTag, Task } from '../types';

interface Props {
  task: Task;
  tag?: CategoryTag;
  now: number;
  remindBeforeMinutes: number;
  onCycleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatCountdown(dueAt: number, now: number): { text: string; isOverdue: boolean } {
  const diff = dueAt - now;
  if (diff <= 0) {
    const overdueMin = Math.floor(Math.abs(diff) / 60000);
    return {
      text: overdueMin < 1 ? '刚刚到期' : `已超时 ${overdueMin}m`,
      isOverdue: true,
    };
  }
  const totalSec = Math.floor(diff / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (hours >= 24) {
    const d = new Date(dueAt);
    return {
      text: `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(
        d.getMinutes()
      ).padStart(2, '0')}`,
      isOverdue: false,
    };
  }
  if (hours > 0) {
    return { text: `剩 ${hours}h ${mins}m`, isOverdue: false };
  }
  return {
    text: `剩 ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
    isOverdue: false,
  };
}

export const TaskCard: React.FC<Props> = ({
  task,
  tag,
  now,
  remindBeforeMinutes,
  onCycleStatus,
  onDelete,
}) => {
  const isDone = task.status === 'done';
  const isDoing = task.status === 'doing';

  const isUrgent =
    !isDone &&
    typeof task.dueAt === 'number' &&
    task.dueAt - now <= remindBeforeMinutes * 60 * 1000;

  const countdown = task.dueAt ? formatCountdown(task.dueAt, now) : null;

  return (
    <div
      className={`liquid-glass animate-glass-enter rounded-[24px] p-3.5 flex items-start gap-3 group ${
        isUrgent ? 'liquid-glass-urgent' : ''
      } ${isDone ? 'opacity-60' : ''}`}
    >
      <button
        type="button"
        onClick={() => onCycleStatus(task.id)}
        title="点击切换状态：未完成 → 进行中 → 已完成"
        className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ios-spring ${
          isDone
            ? 'text-white shadow-sm'
            : isDoing
            ? 'ring-2 ring-offset-1 ring-offset-transparent bg-white/60 dark:bg-white/10'
            : 'border-[1.8px] border-slate-400/60 dark:border-slate-500/70 bg-white/30 dark:bg-white/5'
        }`}
        style={
          isDone
            ? { backgroundColor: 'rgb(var(--accent-rgb))' }
            : isDoing
            ? { borderColor: 'rgb(var(--accent-rgb))', color: 'rgb(var(--accent-rgb))' }
            : undefined
        }
      >
        {isDone && <Check className="w-3.5 h-3.5 stroke-[2.8]" />}
        {isDoing && <Play className="w-3 h-3 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {task.isIdea && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-400/20 text-amber-700 dark:text-amber-300">
              <Lightbulb className="w-2.5 h-2.5" /> 灵感
            </span>
          )}
          <h3
            className={`text-[14px] font-medium leading-snug break-words ${
              isDone
                ? 'line-through text-slate-500 dark:text-slate-400'
                : 'text-slate-800 dark:text-white'
            }`}
          >
            {task.title}
          </h3>
        </div>

        {task.note && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300/80 leading-relaxed">
            {task.note}
          </p>
        )}

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {tag && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/45 dark:bg-white/10 text-slate-600 dark:text-slate-200">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </span>
          )}

          {isDoing && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{
                backgroundColor: 'rgba(var(--accent-rgb), 0.16)',
                color: 'rgb(var(--accent-rgb))',
              }}
            >
              进行中
            </span>
          )}

          {countdown && !isDone && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium tabular-nums ${
                isUrgent
                  ? 'text-white shadow-xs'
                  : 'bg-white/45 dark:bg-white/10 text-slate-600 dark:text-slate-300'
              }`}
              style={isUrgent ? { backgroundColor: 'rgb(var(--accent-rgb))' } : undefined}
            >
              <Clock className="w-3 h-3" />
              {countdown.text}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDelete(task.id)}
        aria-label="删除任务"
        className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
