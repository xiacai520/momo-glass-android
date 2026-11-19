import React from 'react';
import { Sparkles } from 'lucide-react';
import { CompanionMood } from '../types';
import yuningPortrait from '../assets/yuning.webp';

interface Props {
  name: string;
  customAvatarUrl?: string;
  mood: CompanionMood;
  pendingCount: number;
  urgentCount: number;
  onTapCompanion: () => void;
}

const MOOD_MESSAGES: Record<CompanionMood, (pending: number, urgent: number) => string> = {
  idle: (pending) =>
    pending === 0
      ? '今天的小事都清空啦，安心享受下班时光吧～'
      : `还有 ${pending} 件小事陪你一起慢慢处理，不着急哦。`,
  happy: () => '记下来就不会忘啦！交给我来帮你盯着时间～',
  urgent: (_, urgent) =>
    urgent > 0
      ? `注意看！有 ${urgent} 件事快到点啦，下班前别漏掉！`
      : '时间差不多咯，记得检查一下随身物品～',
  thinking: () => '叮咚！这个灵感先帮你锁进玻璃胶囊里啦 ✨',
  celebrate: () => '太棒啦！又搞定一件琐事，离轻松下班更近一步！',
};

export const CompanionAvatar: React.FC<Props> = ({
  name,
  customAvatarUrl,
  mood,
  pendingCount,
  urgentCount,
  onTapCompanion,
}) => {
  const effectiveMood: CompanionMood = urgentCount > 0 ? 'urgent' : mood;
  const line = MOOD_MESSAGES[effectiveMood](pendingCount, urgentCount);

  return (
    <div
      onClick={onTapCompanion}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onTapCompanion()}
      className="liquid-glass ios-spring cursor-pointer rounded-[28px] p-3.5 sm:p-4 flex items-center gap-3.5 select-none"
    >
      <div className="relative shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-[22px] overflow-hidden bg-slate-100 dark:bg-white/10 shadow-inner">
        <img
          src={customAvatarUrl || yuningPortrait}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />

        <span
          className={`absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white/80 ${
            effectiveMood === 'urgent' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
          }`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-semibold tracking-wide text-slate-800 dark:text-white/95 truncate">
            {name}
          </span>
          <span
            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{
              backgroundColor: 'rgba(var(--accent-rgb), 0.16)',
              color: 'rgb(var(--accent-rgb))',
            }}
          >
            <Sparkles className="w-2.5 h-2.5" />
            {effectiveMood === 'urgent' ? '临期提醒' : '陪伴中'}
          </span>
        </div>
        <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-200/90 line-clamp-2">
          {line}
        </p>
      </div>
    </div>
  );
};
