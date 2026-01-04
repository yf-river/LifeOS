'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useNotesStore } from '@/store';
import { useDebounce } from '@/hooks';

/**
 * 搜索栏组件
 * 
 * 功能：
 * 1. 实时搜索（防抖）
 * 2. 搜索历史
 * 3. 快捷键支持 (Cmd/Ctrl + K)
 * 4. 高亮匹配结果
 */

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({ 
  className, 
  placeholder = '搜索笔记...', 
  autoFocus = false 
}: SearchBarProps) {
  const { searchNotes, searchKeyword, fetchNotes, isLoading } = useNotesStore();
  const [inputValue, setInputValue] = useState(searchKeyword);
  const [isFocused, setIsFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 防抖搜索
  const debouncedSearch = useDebounce(inputValue, 300);
  
  // 监听防抖值变化，执行搜索
  useEffect(() => {
    if (debouncedSearch.trim()) {
      searchNotes(debouncedSearch);
      // 添加到历史
      setSearchHistory(prev => {
        const filtered = prev.filter(h => h !== debouncedSearch);
        return [debouncedSearch, ...filtered].slice(0, 10);
      });
    } else if (debouncedSearch === '') {
      // 清空搜索，获取全部笔记
      fetchNotes(1);
    }
  }, [debouncedSearch, searchNotes, fetchNotes]);
  
  // 全局快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Escape 清空
      if (e.key === 'Escape' && isFocused) {
        setInputValue('');
        inputRef.current?.blur();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);
  
  // 处理输入
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);
  
  // 清空搜索
  const handleClear = useCallback(() => {
    setInputValue('');
    inputRef.current?.focus();
  }, []);
  
  // 使用历史记录
  const handleHistoryClick = useCallback((keyword: string) => {
    setInputValue(keyword);
    inputRef.current?.focus();
  }, []);
  
  return (
    <div className={cn('relative', className)}>
      {/* 搜索框 */}
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 bg-white border rounded-lg transition-all',
        isFocused ? 'border-[#2a88ff] ring-2 ring-[#2a88ff]/20' : 'border-[#e5e6ea]'
      )}>
        <SearchIcon className="w-4 h-4 text-[#8a8f99] flex-shrink-0" />
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="flex-1 text-sm text-[#333639] placeholder-[#adb3be] outline-none bg-transparent"
        />
        
        {/* 加载中 */}
        {isLoading && (
          <LoadingSpinner className="w-4 h-4 text-[#2a88ff]" />
        )}
        
        {/* 清空按钮 */}
        {inputValue && !isLoading && (
          <button
            onClick={handleClear}
            className="p-0.5 hover:bg-[#f5f5f5] rounded transition-colors"
          >
            <CloseIcon className="w-4 h-4 text-[#8a8f99]" />
          </button>
        )}
        
        {/* 快捷键提示 */}
        {!inputValue && !isFocused && (
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-[#8a8f99] bg-[#f5f5f5] rounded">
            <span>⌘</span>
            <span>K</span>
          </kbd>
        )}
      </div>
      
      {/* 搜索历史下拉 */}
      {isFocused && searchHistory.length > 0 && !inputValue && (
        <div className="absolute top-full left-0 right-0 mt-1 py-2 bg-white border border-[#e5e6ea] rounded-lg shadow-lg z-10">
          <div className="px-3 pb-1 text-xs text-[#8a8f99]">搜索历史</div>
          {searchHistory.map((keyword, idx) => (
            <button
              key={idx}
              onClick={() => handleHistoryClick(keyword)}
              className="w-full px-3 py-1.5 text-sm text-[#333639] text-left hover:bg-[#f5f5f5] transition-colors"
            >
              <span className="flex items-center gap-2">
                <HistoryIcon className="w-3.5 h-3.5 text-[#adb3be]" />
                {keyword}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 搜索结果高亮组件
 */
export function HighlightText({ 
  text, 
  keyword 
}: { 
  text: string; 
  keyword: string;
}) {
  if (!keyword.trim()) {
    return <span>{text}</span>;
  }
  
  const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-[#fff3cd] text-inherit rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

// 转义正则特殊字符
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Icons
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} viewBox="0 0 24 24" fill="none">
      <circle 
        className="opacity-25" 
        cx="12" cy="12" r="10" 
        stroke="currentColor" 
        strokeWidth="4" 
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
      />
    </svg>
  );
}
