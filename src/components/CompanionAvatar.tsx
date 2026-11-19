import React from 'react';
import { Sparkles } from 'lucide-react';
import { CompanionMood } from '../types';

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
      <div className="relative shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-[22px] overflow-hidden bg-gradient-to-br from-pink-200/80 via-fuchsia-100/70 to-purple-200/80 dark:from-pink-950/70 dark:via-purple-950/60 dark:to-indigo-950/70 shadow-inner flex items-center justify-center">
        {customAvatarUrl ? (
          <img
            src={customAvatarUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full transition-transform duration-500 hover:scale-105"
            aria-label={name}
          >
            <defs>
              <linearGradient id="pinkHairBack" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f9a8d4" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="pinkHairFront" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fbcfe8" />
                <stop offset="65%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#db2777" />
              </linearGradient>
              <linearGradient id="ribbonGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>

            <path
              d="M22 52 C16 82, 18 106, 28 118 L92 118 C102 106, 104 82, 98 52 C94 26, 78 16, 60 16 C42 16, 26 26, 22 52 Z"
              fill="url(#pinkHairBack)"
            />

            <path
              d="M36 96 C44 90, 76 90, 84 96 L94 120 L26 120 Z"
              fill="#ffffff"
              fillOpacity="0.92"
            />
            <path d="M52 94 L60 106 L68 94" fill="none" stroke="#f472b6" strokeWidth="2.5" strokeLinecap="round" />

            <rect x="53" y="76" width="14" height="16" rx="6" fill="#ffe4d6" />
            <path
              d="M35 52 C35 34, 85 34, 85 52 C85 72, 74 84, 60 84 C46 84, 35 72, 35 52 Z"
              fill="#fff0e8"
            />

            <ellipse cx="44" cy="65" rx="5.5" ry="3" fill="#fb7185" fillOpacity="0.35" />
            <ellipse cx="76" cy="65" rx="5.5" ry="3" fill="#fb7185" fillOpacity="0.35" />

            {effectiveMood === 'happy' || effectiveMood === 'celebrate' ? (
              <>
                <path d="M43 57 Q48 51 53 57" fill="none" stroke="#4a2545" strokeWidth="2.6" strokeLinecap="round" />
                <path d="M67 57 Q72 51 77 57" fill="none" stroke="#4a2545" strokeWidth="2.6" strokeLinecap="round" />
                <path d="M55 70 Q60 76 65 70 Z" fill="#fb7185" />
              </>
            ) : effectiveMood === 'urgent' ? (
              <>
                <circle cx="48" cy="57" r="4.2" fill="#4a2545" />
                <circle cx="49.5" cy="55.5" r="1.4" fill="#ffffff" />
                <circle cx="72" cy="57" r="4.2" fill="#4a2545" />
                <circle cx="73.5" cy="55.5" r="1.4" fill="#ffffff" />
                <path d="M42 49 L52 51" stroke="#831843" strokeWidth="2" strokeLinecap="round" />
                <path d="M78 49 L68 51" stroke="#831843" strokeWidth="2" strokeLinecap="round" />
                <ellipse cx="60" cy="71" rx="3.5" ry="4" fill="#fb7185" />
              </>
            ) : (
              <>
                <ellipse cx="48" cy="57" rx="3.8" ry="4.6" fill="#4a2545" />
                <circle cx="49.3" cy="55.2" r="1.5" fill="#ffffff" />
                <ellipse cx="72" cy="57" rx="3.8" ry="4.6" fill="#4a2545" />
                <circle cx="73.3" cy="55.2" r="1.5" fill="#ffffff" />
                <path d="M56 70 Q60 73.5 64 70" fill="none" stroke="#be185d" strokeWidth="2.2" strokeLinecap="round" />
              </>
            )}

            <path
              d="M31 54 C31 28, 46 18, 60 18 C74 18, 89 28, 89 54 C85 43, 79 38, 74 49 C70 38, 64 36, 60 48 C56 36, 50 38, 46 49 C41 38, 35 43, 31 54 Z"
              fill="url(#pinkHairFront)"
            />
            <path
              d="M42 32 Q60 26 78 32"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.65"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path d="M78 28 L88 22 L86 33 Z" fill="url(#ribbonGrad)" />
            <path d="M94 31 L86 33 L91 23 Z" fill="url(#ribbonGrad)" />
            <circle cx="86" cy="29" r="2.2" fill="#ffffff" />
          </svg>
        )}

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
