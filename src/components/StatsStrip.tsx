import React from 'react';
import { CheckCircle2, Flame, Trophy } from 'lucide-react';
import { DailyStats } from '../types';

interface Props {
  stats: DailyStats;
}

export const StatsStrip: React.FC<Props> = ({ stats }) => {
  const items = [
    {
      label: '今日完成',
      value: stats.todayCompleted,
      unit: '项',
      icon: CheckCircle2,
    },
    {
      label: '连续陪伴',
      value: stats.streakDays,
      unit: '天',
      icon: Flame,
    },
    {
      label: '累计完成',
      value: stats.totalCompleted,
      unit: '项',
      icon: Trophy,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="liquid-glass rounded-[22px] px-3 py-2.5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-medium">{item.label}</span>
              <Icon
                className="w-3.5 h-3.5"
                style={{ color: 'rgb(var(--accent-rgb))' }}
              />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white tabular-nums">
                {item.value}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {item.unit}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
