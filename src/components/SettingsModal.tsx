import React, { useState } from 'react';
import { Bell, Moon, Plus, SlidersHorizontal, Sun, X } from 'lucide-react';
import { AppSettings, CategoryTag } from '../types';

interface Props {
  open: boolean;
  settings: AppSettings;
  tags: CategoryTag[];
  onClose: () => void;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onAddTag: (name: string, color: string) => void;
  onRemoveTag: (id: string) => void;
}

const ACCENT_PRESETS = [
  { name: '樱花粉', hex: '#f472b6' },
  { name: '薄雾紫', hex: '#a78bfa' },
  { name: '晴空蓝', hex: '#38bdf8' },
  { name: '青柠绿', hex: '#34d399' },
  { name: '珊瑚橘', hex: '#fb7185' },
];

export const SettingsModal: React.FC<Props> = ({
  open,
  settings,
  tags,
  onClose,
  onUpdateSettings,
  onAddTag,
  onRemoveTag,
}) => {
  const [newTagName, setNewTagName] = useState('');
  const [notifStatus, setNotifStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  if (!open) return null;

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifStatus(perm);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/25 backdrop-blur-xs">
      <div className="liquid-glass-elevated animate-glass-enter w-full max-w-md rounded-[32px] p-5 max-h-[88vh] overflow-y-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal
              className="w-4 h-4"
              style={{ color: 'rgb(var(--accent-rgb))' }}
            />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Liquid Glass 个性化
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-[22px] p-3.5 bg-white/40 dark:bg-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800 dark:text-white">
              玻璃材质透明度
            </span>
            <span className="tabular-nums font-medium text-slate-500 dark:text-slate-400">
              {Math.round(settings.glassOpacity * 100)}%（
              {settings.glassOpacity < 0.35
                ? '极致通透'
                : settings.glassOpacity > 0.68
                ? '高可读磨砂'
                : '均衡玻璃'}
              ）
            </span>
          </div>
          <input
            type="range"
            min={0.15}
            max={0.85}
            step={0.02}
            value={settings.glassOpacity}
            onChange={(e) =>
              onUpdateSettings({ glassOpacity: parseFloat(e.target.value) })
            }
            className="w-full accent-pink-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Clear 更通透</span>
            <span>Tinted 更醇厚</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              外观模式
            </span>
            <div className="flex p-1 rounded-full bg-black/5 dark:bg-white/10">
              <button
                type="button"
                onClick={() => onUpdateSettings({ themeMode: 'light' })}
                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
                  settings.themeMode === 'light'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> 浅色
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ themeMode: 'dark' })}
                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
                  settings.themeMode === 'dark'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> 深色
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              主题主色调
            </span>
            <div className="flex items-center gap-2">
              {ACCENT_PRESETS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => onUpdateSettings({ accentColor: c.hex })}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    settings.accentColor.toLowerCase() === c.hex
                      ? 'scale-115 ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900'
                      : ''
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => onUpdateSettings({ accentColor: e.target.value })}
                className="w-6 h-6 rounded-full overflow-hidden border-0 cursor-pointer bg-transparent"
                title="自定义色值"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2.5 pt-2 border-t border-black/5 dark:border-white/10">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
            陪伴角色设定
          </span>
          <div className="grid grid-cols-1 gap-2">
            <input
              type="text"
              value={settings.companionName}
              onChange={(e) => onUpdateSettings({ companionName: e.target.value })}
              placeholder="角色名字（默认：予宁）"
              className="w-full px-3.5 py-2 rounded-2xl text-xs bg-white/50 dark:bg-white/5 text-slate-800 dark:text-white focus:outline-none"
            />
            <input
              type="url"
              value={settings.customAvatarUrl}
              onChange={(e) => onUpdateSettings({ customAvatarUrl: e.target.value })}
              placeholder="自定义头像图片 URL（留空则使用默认头像：予宁）"
              className="w-full px-3.5 py-2 rounded-2xl text-xs bg-white/50 dark:bg-white/5 text-slate-800 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2.5 pt-2 border-t border-black/5 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              提前预警时间
            </span>
            <select
              value={settings.remindBeforeMinutes}
              onChange={(e) =>
                onUpdateSettings({ remindBeforeMinutes: Number(e.target.value) })
              }
              className="px-3 py-1.5 rounded-xl text-xs bg-white/60 dark:bg-white/10 text-slate-800 dark:text-white focus:outline-none"
            >
              <option value={5}>提前 5 分钟</option>
              <option value={10}>提前 10 分钟</option>
              <option value={15}>提前 15 分钟</option>
              <option value={30}>提前 30 分钟</option>
              <option value={60}>提前 1 小时</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" /> 系统级桌面/锁屏推送
            </span>
            <button
              type="button"
              onClick={requestNotificationPermission}
              className="px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: 'rgb(var(--accent-rgb))' }}
            >
              {notifStatus === 'granted' ? '已开启通知' : '授权通知'}
            </button>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/10">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
            分类标签管理
          </span>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white/50 dark:bg-white/10 text-slate-700 dark:text-slate-200"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
                {tags.length > 1 && (
                  <button
                    onClick={() => onRemoveTag(tag.id)}
                    className="text-slate-400 hover:text-rose-500 ml-0.5"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="新增标签名..."
              className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-white/50 dark:bg-white/5 text-slate-800 dark:text-white focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (!newTagName.trim()) return;
                onAddTag(newTagName, settings.accentColor);
                setNewTagName('');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-white flex items-center gap-1"
              style={{ backgroundColor: 'rgb(var(--accent-rgb))' }}
            >
              <Plus className="w-3.5 h-3.5" /> 添加
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
