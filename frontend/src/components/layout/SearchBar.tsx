'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotesStore } from '@/store';
import { cn } from '@/lib/utils';

/**
 * 全局搜索栏组件 - Get笔记风格
 * 
 * 特性：
 * - ⌘K 快捷键唤起
 * - 实时搜索建议
 * - 搜索历史
 * - 高亮匹配文字
 */

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className }: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recentSearches] = useState<string[]>(['会议记录', 'React', '项目计划']);
  const inputRef = useRef<HTMLInputElement>(null);
  const { notes, setCurrentNote } = useNotesStore();

  // 搜索结果
  const searchResults = query.trim()
    ? notes.filter(note => 
        note.title?.toLowerCase().includes(query.toLowerCase()) ||
        note.content?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  // 快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 打开时聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = useCallback((noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setCurrentNote(note);
      setIsOpen(false);
      setQuery('');
    }
  }, [notes, setCurrentNote]);

  // 高亮匹配文字
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-[#fff3cd] text-[#111418] px-0.5 rounded">{part}</mark>
        : part
    );
  };

  return (
    <>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center gap-2 h-10 px-4 bg-[#f5f5f5] hover:bg-[#ebebeb] rounded-xl transition-colors',
          'text-[#8a8f99] text-sm',
          className
        )}
      >
        <SearchIcon className="w-4 h-4" />
        <span>搜索笔记</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded text-xs text-[#adb3be] shadow-sm">
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </button>

      {/* 搜索弹窗 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 遮罩层 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsOpen(false);
                setQuery('');
              }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />

            {/* 搜索框 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-[560px] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {/* 输入区 */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[#f0f0f0]">
                <SearchIcon className="w-5 h-5 text-[#8a8f99]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索笔记标题或内容..."
                  className="flex-1 text-[16px] text-[#111418] placeholder-[#adb3be] outline-none"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1 hover:bg-[#f5f5f5] rounded-lg transition-colors"
                  >
                    <CloseIcon className="w-4 h-4 text-[#adb3be]" />
                  </button>
                )}
                <kbd className="px-2 py-1 bg-[#f5f5f5] rounded text-xs text-[#8a8f99]">ESC</kbd>
              </div>

              {/* 搜索结果 */}
              <div className="max-h-[400px] overflow-y-auto">
                {query.trim() ? (
                  searchResults.length > 0 ? (
                    <div className="py-2">
                      <div className="px-5 py-2 text-xs text-[#8a8f99] font-medium">搜索结果</div>
                      {searchResults.map((note) => (
                        <button
                          key={note.id}
                          onClick={() => handleSelect(note.id)}
                          className="w-full flex items-start gap-3 px-5 py-3 hover:bg-[#f5f7fa] transition-colors text-left"
                        >
                          <NoteIcon className="w-5 h-5 text-[#8a8f99] mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-medium text-[#111418] truncate">
                              {highlightMatch(note.title || '无标题', query)}
                            </div>
                            <div className="text-[13px] text-[#8a8f99] truncate mt-0.5">
                              {highlightMatch(note.content?.slice(0, 100) || '', query)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="text-[40px] mb-3">🔍</div>
                      <div className="text-[#8a8f99]">没有找到相关笔记</div>
                    </div>
                  )
                ) : (
                  <div className="py-2">
                    {recentSearches.length > 0 && (
                      <>
                        <div className="px-5 py-2 text-xs text-[#8a8f99] font-medium">最近搜索</div>
                        {recentSearches.map((term, idx) => (
                          <button
                            key={idx}
                            onClick={() => setQuery(term)}
                            className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-[#f5f7fa] transition-colors text-left"
                          >
                            <ClockIcon className="w-4 h-4 text-[#adb3be]" />
                            <span className="text-[14px] text-[#333639]">{term}</span>
                          </button>
                        ))}
                      </>
                    )}
                    
                    {/* 快捷操作提示 */}
                    <div className="px-5 py-3 border-t border-[#f0f0f0] mt-2">
                      <div className="flex items-center gap-4 text-xs text-[#adb3be]">
                        <span className="flex items-center gap-1">
                          <kbd className="px-1.5 py-0.5 bg-[#f5f5f5] rounded">↑↓</kbd> 导航
                        </span>
                        <span className="flex items-center gap-1">
                          <kbd className="px-1.5 py-0.5 bg-[#f5f5f5] rounded">↵</kbd> 选择
                        </span>
                        <span className="flex items-center gap-1">
                          <kbd className="px-1.5 py-0.5 bg-[#f5f5f5] rounded">ESC</kbd> 关闭
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// 图标组件
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
