import React from 'react';
import { BellRing, CheckCircle2, Sparkles, X } from 'lucide-react';
import { InAppToast } from '../types';

interface Props {
  toast: InAppToast | null;
  onClose: () => void;
}

export const DynamicBanner: React.FC<Props> = ({ toast, onClose }) => {
  if (!toast) return null;

  const Icon =
    toast.type === 'urgent'
      ? BellRing
      : toast.type === 'success'
      ? CheckCircle2
      : Sparkles;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-glass-enter">
      <div
        className={`liquid-glass-elevated rounded-full px-4 py-2.5 flex items-center gap-3 ${
          toast.type === 'urgent' ? 'liquid-glass-urgent' : ''
        }`}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white shadow-sm"
          style={{ backgroundColor: 'rgb(var(--accent-rgb))' }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
            {toast.title}
          </p>
          {toast.subtitle && (
            <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
              {toast.subtitle}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="关闭提醒"
          className="p-1 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
