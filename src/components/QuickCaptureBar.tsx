import React, { useState } from 'react';
import { Clock, Lightbulb, Plus, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { CategoryTag } from '../types';

interface Props {
  tags: CategoryTag[];
  onAdd: (payload: {
    title: string;
    note?: string;
    tagId?: string;
    dueAt?: number;
    isIdea?: boolean;
  }) => void;
}

export const QuickCaptureBar: React.FC<Props> = ({ tags, onAdd }) => {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>(tags[0]?.id || 'work');
  const [duePreset, setDuePreset] = useState<'none' | '15m' | '30m' | '18:00' | 'custom'>('none');
  const [customTime, setCustomTime] = useState('');
  const [expanded, setExpanded] = useState(false);

  const computeDueAt = (): number | undefined => {
    const now = new Date();
    if (duePreset === 'none') return undefined;
    if (duePreset === '15m') return Date.now() + 15 * 60 * 1000;
    if (duePreset === '30m') return Date.now() + 30 * 60 * 1000;
    if (duePreset === '18:00') {
      const target = new Date();
      target.setHours(18, 0, 0, 0);
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }
      return target.getTime();
    }
    if (duePreset === 'custom' && customTime) {
      const parsed = new Date(customTime).getTime();
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  };

  // 选中的标签可能刚在设置里被删掉：提交和渲染都以「还存在的标签」为准，
  // 否则界面上没有任何标签高亮，任务落到哪个分类也全靠 store 兜底
  const effectiveTagId = tags.some((t) => t.id === selectedTag)
    ? selectedTag
    : tags[0]?.id || 'work';

  const handleSubmit = (isIdea = false) => {
    if (!title.trim()) return;
    onAdd({
      title,
      note: expanded ? note : undefined,
      tagId: isIdea ? 'idea' : effectiveTagId,
      dueAt: isIdea ? undefined : computeDueAt(),
      isIdea,
    });
    setTitle('');
    setNote('');
    setDuePreset('none');
    setCustomTime('');
    setExpanded(false);
  };

  return (
    <div className="liquid-glass rounded-[26px] p-3 transition-all">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          title="展开详细设置"
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-white/50 dark:bg-white/10 text-slate-700 dark:text-slate-200 ios-spring"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(false);
            }
          }}
          placeholder="下班前别忘的小事，或随手记个灵感..."
          className="flex-1 bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
        />

        <button
          type="button"
          onClick={() => handleSubmit(true)}
          title="一键记录灵感（无需选时间）"
          className="px-2.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 bg-amber-400/20 text-amber-700 dark:text-amber-300 hover:bg-amber-400/30 ios-spring shrink-0"
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">灵感</span>
        </button>

        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={!title.trim()}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white shadow-sm disabled:opacity-40 ios-spring"
          style={{ backgroundColor: 'rgb(var(--accent-rgb))' }}
          aria-label="添加任务"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10 space-y-3 animate-glass-enter">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="补充备注（可选，例如放在哪、注意事项）"
            className="w-full px-3.5 py-2 rounded-2xl text-xs bg-white/45 dark:bg-white/5 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none"
          />

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {tags.map((tag) => {
              const active = effectiveTagId === tag.id;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setSelectedTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all ${
                    active
                      ? 'text-white shadow-sm'
                      : 'bg-white/40 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                  }`}
                  style={active ? { backgroundColor: tag.color } : undefined}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: active ? '#fff' : tag.color }}
                  />
                  {tag.name}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
              <Clock className="w-3 h-3" /> 提醒：
            </span>
            {[
              { id: 'none', label: '无定时' },
              { id: '15m', label: '15分钟后' },
              { id: '30m', label: '30分钟后' },
              { id: '18:00', label: '下班 18:00' },
              { id: 'custom', label: '自定义' },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setDuePreset(preset.id as typeof duePreset)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                  duePreset === preset.id
                    ? 'text-white'
                    : 'bg-white/40 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                }`}
                style={
                  duePreset === preset.id
                    ? { backgroundColor: 'rgb(var(--accent-rgb))' }
                    : undefined
                }
              >
                {preset.label}
              </button>
            ))}

            {duePreset === 'custom' && (
              <input
                type="datetime-local"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="mt-1 sm:mt-0 px-2.5 py-1 rounded-xl text-xs bg-white/60 dark:bg-white/10 text-slate-700 dark:text-slate-200 focus:outline-none"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
