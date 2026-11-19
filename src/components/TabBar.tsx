import React from 'react';
import {
  CalendarDays,
  ClipboardList,
  Home,
  Hourglass,
  Lightbulb,
  ListChecks,
  type LucideIcon,
} from 'lucide-react';

export type TabKey = 'home' | 'todos' | 'calendar' | 'routines' | 'memos' | 'expiry';

interface Props {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  pendingCount: number;
}

const TABS: { id: TabKey; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'todos', label: '待办', icon: ListChecks },
  { id: 'calendar', label: '日历', icon: CalendarDays },
  { id: 'routines', label: '要点', icon: ClipboardList },
  { id: 'memos', label: '备忘', icon: Lightbulb },
  { id: 'expiry', label: '效期', icon: Hourglass },
];

export const TabBar: React.FC<Props> = ({ active, onChange, pendingCount }) => {
  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-xl">
      <div className="liquid-glass-elevated rounded-[26px] px-2 py-1.5 grid grid-cols-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className="relative flex flex-col items-center gap-0.5 py-1.5 rounded-2xl ios-spring"
              style={isActive ? { color: 'rgb(var(--accent-rgb))' } : undefined}
              aria-label={tab.label}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? '' : 'text-slate-500 dark:text-slate-400'}`}
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? '' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </span>
              {tab.id === 'todos' && pendingCount > 0 && (
                <span
                  className="absolute top-0.5 left-1/2 translate-x-1.5 min-w-4 h-4 px-0.5 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                  style={{ backgroundColor: 'rgb(var(--accent-rgb))' }}
                >
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
