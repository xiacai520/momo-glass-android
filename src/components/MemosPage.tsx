import React, { useMemo, useState } from 'react';
import { Plus, Search, Trash2, X } from 'lucide-react';
import { Memo } from '../types';

interface Props {
  memos: Memo[];
  onAdd: (payload: { title: string; content: string; category: string }) => void;
  onDelete: (id: string) => void;
}

const CATEGORIES = ['灵感', '备忘', '常用信息', '学习'];

export const MemosPage: React.FC<Props> = ({ memos, onAdd, onDelete }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('全部');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [formCategory, setFormCategory] = useState<string>('备忘');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return memos.filter((m) => {
      if (category !== '全部' && m.category !== category) return false;
      if (!q) return true;
      return (
        m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q)
      );
    });
  }, [memos, query, category]);

  const handleAdd = () => {
    if (!title.trim() && !content.trim()) return;
    onAdd({ title, content, category: formCategory });
    setTitle('');
    setContent('');
    setFormCategory('备忘');
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <header className="px-1 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            灵感备忘
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            灵感、备忘、常用信息集中放，全文检索随手可查
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 rounded-full text-xs font-medium text-white flex items-center gap-1 shrink-0 ios-spring"
          style={{ backgroundColor: 'rgb(var(--accent-rgb))' }}
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? '收起' : '新增备忘'}
        </button>
      </header>

      {showForm && (
        <div className="liquid-glass rounded-[24px] p-3.5 space-y-3 animate-glass-enter">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="标题"
            className="w-full px-3.5 py-2 rounded-2xl text-sm bg-white/50 dark:bg-white/5 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="内容，写详细点方便以后搜…"
            rows={3}
            className="w-full px-3.5 py-2 rounded-2xl text-xs bg-white/50 dark:bg-white/5 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none"
          />
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFormCategory(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  formCategory === c
                    ? 'text-white'
                    : 'bg-white/40 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                }`}
                style={
                  formCategory === c
                    ? { backgroundColor: 'rgb(var(--accent-rgb))' }
                    : undefined
                }
              >
                {c}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!title.trim() && !content.trim()}
            className="w-full py-2 rounded-2xl text-sm font-medium text-white disabled:opacity-40 ios-spring"
            style={{ backgroundColor: 'rgb(var(--accent-rgb))' }}
          >
            保存备忘
          </button>
        </div>
      )}

      <div className="liquid-glass rounded-full px-3.5 py-2 flex items-center gap-2">
        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜标题或内容…"
          className="flex-1 bg-transparent text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {['全部', ...CATEGORIES].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
              category === c
                ? 'text-white shadow-xs'
                : 'liquid-pill text-slate-600 dark:text-slate-300'
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

      <section className="space-y-2.5">
        {visible.length === 0 ? (
          <div className="liquid-glass rounded-[24px] py-10 px-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {query || category !== '全部' ? '没有找到匹配的备忘' : '还没有备忘'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              点右上角「新增备忘」记第一条
            </p>
          </div>
        ) : (
          visible.map((memo) => (
            <div key={memo.id} className="liquid-glass rounded-[24px] p-3.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {memo.title}
                </p>
                <button
                  type="button"
                  onClick={() => onDelete(memo.id)}
                  aria-label="删除备忘"
                  className="text-slate-300 hover:text-rose-500 dark:text-slate-600 shrink-0 mt-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {memo.content && (
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 mt-1.5 whitespace-pre-wrap">
                  {memo.content}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2.5">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{
                    backgroundColor: 'rgba(var(--accent-rgb), 0.14)',
                    color: 'rgb(var(--accent-rgb))',
                  }}
                >
                  {memo.category}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {new Date(memo.createdAt).toLocaleDateString('zh-CN', {
                    month: 'numeric',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};
