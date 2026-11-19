import React, { useEffect, useRef, useState } from 'react';
import { Bell, Camera, Moon, Plus, SlidersHorizontal, Sun, X } from 'lucide-react';
import { AppSettings, CategoryTag } from '../types';
import yuningPortrait from '../assets/yuning.webp';
import {
  ensureExactAlarm,
  ensureNotificationPermission,
  isNative,
  isNotificationGranted,
  sendTestNotification,
  syncNotifications,
} from '../services/notifier';

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
  const [avatarError, setAvatarError] = useState('');
  const avatarFileRef = useRef<HTMLInputElement>(null);

  // 打开设置时读取一次真实的通知权限（原生端 window.Notification 不存在，不能靠它判断）
  useEffect(() => {
    if (!open) return;
    if (isNative()) {
      isNotificationGranted().then((ok) => setNotifStatus(ok ? 'granted' : 'default'));
    }
  }, [open]);

  if (!open) return null;

  const handleAvatarFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('请选择图片文件');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setAvatarError('图片处理失败，换一张试试');
          return;
        }
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        onUpdateSettings({ customAvatarUrl: canvas.toDataURL('image/jpeg', 0.85) });
        setAvatarError('');
      };
      img.onerror = () => setAvatarError('图片读取失败，换一张试试');
      img.src = String(reader.result);
    };
    reader.onerror = () => setAvatarError('图片读取失败，换一张试试');
    reader.readAsDataURL(file);
  };

  const requestNotificationPermission = async () => {
    const ok = await ensureNotificationPermission();
    setNotifStatus(ok ? 'granted' : 'denied');
    if (ok && isNative()) {
      await ensureExactAlarm(true); // 未开精确闹钟时跳到系统设置页
      await syncNotifications();
    }
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
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            名字和头像都可以自由修改，分享给朋友用时，让他们换成自己的名字和照片就行。
          </p>
          <div className="flex items-center gap-3">
            <img
              src={settings.customAvatarUrl || yuningPortrait}
              alt="当前头像"
              className="w-12 h-12 rounded-2xl object-cover bg-slate-100 dark:bg-white/10 shrink-0"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => avatarFileRef.current?.click()}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-white flex items-center gap-1.5"
                style={{ backgroundColor: 'rgb(var(--accent-rgb))' }}
              >
                <Camera className="w-3.5 h-3.5" /> 上传照片
              </button>
              {settings.customAvatarUrl && (
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ customAvatarUrl: '' })}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                >
                  恢复默认头像
                </button>
              )}
            </div>
            <input
              ref={avatarFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                handleAvatarFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>
          {avatarError && (
            <p className="text-[10px] text-rose-500">{avatarError}</p>
          )}
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            照片会自动裁成正方形，只保存在这台设备上，不会上传到任何服务器。
          </p>
          <input
            type="text"
            value={settings.companionName}
            onChange={(e) => onUpdateSettings({ companionName: e.target.value })}
            placeholder="角色名字（默认：予宁）"
            className="w-full px-3.5 py-2 rounded-2xl text-xs bg-white/50 dark:bg-white/5 text-slate-800 dark:text-white focus:outline-none"
          />
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

          {isNative() && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-300">
                退到桌面等 5 秒，确认能收到
              </span>
              <button
                type="button"
                onClick={() => void sendTestNotification()}
                className="px-3 py-1 rounded-full text-xs font-medium bg-white/60 dark:bg-white/10 text-slate-700 dark:text-slate-200"
              >
                发送测试通知
              </button>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/10">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
              {settings.companionName} 主动来找你
            </span>

            {(
              [
                ['morningCheckin', 'morningTime', '早安提醒'],
                ['eveningCheckin', 'eveningTime', '晚间回顾'],
              ] as const
            ).map(([flag, timeKey, label]) => (
              <div key={flag} className="flex items-center justify-between gap-2">
                <label className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings[flag]}
                    onChange={(e) =>
                      onUpdateSettings(
                        flag === 'morningCheckin'
                          ? { morningCheckin: e.target.checked }
                          : { eveningCheckin: e.target.checked }
                      )
                    }
                  />
                  {label}
                </label>
                <input
                  type="time"
                  value={settings[timeKey]}
                  disabled={!settings[flag]}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) return;
                    onUpdateSettings(
                      timeKey === 'morningTime' ? { morningTime: v } : { eveningTime: v }
                    );
                  }}
                  className="px-2.5 py-1 rounded-xl text-xs bg-white/60 dark:bg-white/10 text-slate-800 dark:text-white focus:outline-none disabled:opacity-40"
                />
              </div>
            ))}

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-300">逾期后追着提醒</span>
              <select
                value={settings.overdueNagMinutes}
                onChange={(e) => onUpdateSettings({ overdueNagMinutes: Number(e.target.value) })}
                className="px-3 py-1.5 rounded-xl text-xs bg-white/60 dark:bg-white/10 text-slate-800 dark:text-white focus:outline-none"
              >
                <option value={0}>不追</option>
                <option value={15}>每 15 分钟</option>
                <option value={30}>每 30 分钟</option>
                <option value={60}>每 1 小时</option>
              </select>
            </div>
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
