import React, { useMemo, useState } from 'react';
import { Plus, Trash2, TriangleAlert, X } from 'lucide-react';
import { ExpiryItem } from '../types';

interface Props {
  items: ExpiryItem[];
  onAdd: (payload: { name: string; category: string; expiryDate: string; note?: string }) => void;
  onDelete: (id: string) => void;
}

const CATEGORIES = ['食品', '护肤美妆', '药品', '日用品', '证件', '会员订阅', '其他'];

const parseLocalDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

const daysLeftOf = (item: ExpiryItem): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = parseLocalDate(item.expiryDate);
  return Math.round((exp.getTime() - today.getTime()) / 86400000);
};

const statusOf = (days: number): 'expired' | 'soon' | 'ok' =>
  days < 0 ? 'expired' : days <= 7 ? 'soon' : 'ok';

const STATUS_COLOR = {
  expired: '#f43f5e',
  soon: '#f59e0b',
  ok: '#10b981',
} as const;

export const ExpiryPage: React.FC<Props> = ({ items, onAdd, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('食品');
  const [expiryDate, setExpiryDate] = useState('');
  const [note, setNote] = useState('');

  const enriched = useMemo(
    () =>
      items
        .map((item) => ({ item, days: daysLeftOf(item) }))
        .sort((a, b) => a.days - b.days),
    [items]
  );

  const stats = useMemo(() => {
    const expired = enriched.filter((e) => e.days < 0).length;
    const soon = enriched.filter((e) => e.days >= 0 && e.days <= 7).length;
    const ok = enriched.filter((e) => e.days > 7).length;
    return { total: items.length, expired, soon, ok };
  }, [enriched, items.length]);

  const attention = enriched.filter((e) => e.days <= 7);

  const handleAdd = () => {
    if (!name.trim() || !expiryDate) return;
    onAdd({ name, category, expiryDate, note: note || undefined });
    setName('');
    setNote('');
    setExpiryDate('');
    setCategory('食品');
    setShowForm(false);
  };

  const statCards = [
    { label: '全部物品', value: stats.total, color: '#64748b' },
    { label: '已过期', value: stats.expired, color: STATUS_COLOR.expired },
    { label: '7 天内到期', value: stats.soon, color: STATUS_COLOR.soon },
    { label: '效期充足', value: stats.ok, color: STATUS_COLOR.ok },
  ];

  return (
    <div className="space-y-4">
      <header className="px-1 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            到期管理
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            食品、护肤、药品、证件、会员的到期日一站管理
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 rounded-full text-xs font-medium text-white flex items-center gap-1 shrink-0 ios-spring"
          style={{ backgroundColor: 'rgb(var(--accent-rgb))' }}
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? '收起' : '新增物品'}
        </button>
      </header>

      {showForm && (
        <div className="liquid-glass rounded-[24px] p-3.5 space-y-3 animate-glass-enter">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="物品名，例如：牛奶、学生证、视频会员"
            className="w-full px-3.5 py-2 rounded-2xl text-sm bg-white/50 dark:bg-white/5 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  category === c
                    ? 'text-white'
                    : 'bg-white/40 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                }`}
                style={
                  category === c
                    ? { backgroundColor: 'rgb(var(--accent-rgb))' }
                    : undefined
                }
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
              到期日
            </span>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="flex-1 px-3 py-2 rounded-2xl text-xs bg-white/50 dark:bg-white/5 text-slate-700 dark:text-slate-200 focus:outline-none"
            />
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="备注（可选，例如规格、存放位置）"
            className="w-full px-3.5 py-2 rounded-2xl text-xs bg-white/50 dark:bg-white/5 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!name.trim() || !expiryDate}
            className="w-full py-2 rounded-2xl text-sm font-medium text-white disabled:opacity-40 ios-spring"
            style={{ backgroundColor: 'rgb(var(--accent-rgb))' }}
          >
            添加物品
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {statCards.map((card) => (
          <div key={card.label} className="liquid-glass rounded-[22px] px-3.5 py-3">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {card.label}
            </p>
            <p
              className="text-2xl font-bold tracking-tight tabular-nums mt-0.5"
              style={{ color: card.color }}
            >
              {card.value}
              <span className="text-xs font-medium text-slate-400 ml-1">件</span>
            </p>
          </div>
        ))}
      </div>

      {attention.length > 0 && (
        <div className="liquid-glass rounded-[24px] p-3.5 border-l-4 border-l-amber-400">
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <TriangleAlert className="w-3.5 h-3.5" />
            效期预警 · {attention.length} 件需要尽快处理
          </p>
          <div className="mt-2 space-y-1">
            {attention.slice(0, 5).map(({ item, days }) => (
              <p key={item.id} className="text-xs text-slate-600 dark:text-slate-300">
                {item.name} ·{' '}
                <span style={{ color: STATUS_COLOR[statusOf(days)] }} className="font-medium">
                  {days < 0 ? `已过期 ${-days} 天` : days === 0 ? '今天到期' : `仅剩 ${days} 天`}
                </span>
              </p>
            ))}
          </div>
        </div>
      )}

      <section className="space-y-2.5">
        {enriched.length === 0 ? (
          <div className="liquid-glass rounded-[24px] py-10 px-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">还没有记录物品</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              点右上角「新增物品」，把容易过期的东西记下来
            </p>
          </div>
        ) : (
          enriched.map(({ item, days }) => {
            const status = statusOf(days);
            return (
              <div
                key={item.id}
                className="liquid-glass rounded-[22px] p-3.5 flex items-center gap-3 border-l-4"
                style={{ borderLeftColor: STATUS_COLOR[status] }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/50 dark:bg-white/10 text-slate-500 dark:text-slate-300">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      到期 {item.expiryDate}
                    </span>
                  </div>
                  {item.note && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                      {item.note}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p
                    className="text-2xl font-bold tabular-nums leading-none"
                    style={{ color: STATUS_COLOR[status] }}
                  >
                    {Math.abs(days)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {days < 0 ? '天前已过期' : days === 0 ? '今天到期' : '天后到期'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  aria-label="删除物品"
                  className="text-slate-300 hover:text-rose-500 dark:text-slate-600 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};
