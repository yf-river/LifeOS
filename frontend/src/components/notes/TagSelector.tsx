'use client';

import { useState, useEffect, useRef } from 'react';
import { useTagsStore } from '@/store';
import { Tag } from '@/store/tags';
import { cn } from '@/lib/utils';

interface TagSelectorProps {
  selectedTags: Tag[];
  onTagAdd: (tag: Tag) => void;
  onClose: () => void;
}

/**
 * 标签选择器组件
 * 功能：
 * 1. 显示所有可用标签
 * 2. 搜索框可以过滤标签
 * 3. 如果搜索的标签不存在，显示"创建标签 xxx"选项
 * 4. 点击标签添加到笔记
 */
export function TagSelector({ selectedTags, onTagAdd, onClose }: TagSelectorProps) {
  const { tags, fetchTags, createTag } = useTagsStore();
  const [searchText, setSearchText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取所有标签
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // 自动聚焦到搜索框
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // 过滤标签：排除已选中的，并根据搜索文本筛选
  const selectedTagIds = new Set(selectedTags.map(t => t.id));
  const filteredTags = tags
    .filter(tag => !selectedTagIds.has(tag.id))
    .filter(tag => tag.name.toLowerCase().includes(searchText.toLowerCase()));

  // 判断是否需要显示"创建标签"选项
  const trimmedSearch = searchText.trim();
  const exactMatch = tags.find(tag => tag.name.toLowerCase() === trimmedSearch.toLowerCase());
  const showCreateOption = trimmedSearch && !exactMatch;

  // 创建新标签
  const handleCreateTag = async () => {
    if (!trimmedSearch || isCreating) return;
    
    setIsCreating(true);
    const newTag = await createTag(trimmedSearch);
    setIsCreating(false);
    
    if (newTag) {
      onTagAdd(newTag);
      setSearchText('');
      // 不关闭下拉框，让用户可以继续添加
      inputRef.current?.focus();
    }
  };

  // 选择标签
  const handleSelectTag = (tag: Tag) => {
    onTagAdd(tag);
    setSearchText('');
    // 不关闭下拉框，让用户可以继续添加
    inputRef.current?.focus();
  };

  // 按回车创建或选择第一个标签
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showCreateOption) {
        handleCreateTag();
      } else if (filteredTags.length > 0) {
        handleSelectTag(filteredTags[0]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      ref={containerRef}
      className="absolute top-full left-0 mt-1 w-64 bg-white border border-[#e4e4e7] rounded-lg shadow-lg z-50"
    >
      {/* 搜索框 */}
      <div className="p-2">
        <input
          ref={inputRef}
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="搜索标签..."
          className="w-full px-3 py-2 text-sm border border-[#e4e4e7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2a88ff] focus:border-transparent"
        />
      </div>

      {/* 标签列表 */}
      <div className="max-h-64 overflow-y-auto">
        {/* 创建新标签选项 */}
        {showCreateOption && (
          <button
            onClick={handleCreateTag}
            disabled={isCreating}
            className="w-full px-3 py-2 text-left text-sm hover:bg-[#f5f5f5] transition-colors flex items-center gap-2 text-[#2a88ff]"
          >
            <PlusIcon className="w-4 h-4" />
            <span>创建标签 "{trimmedSearch}"</span>
            {isCreating && <span className="text-xs text-[#8a8f99]">创建中...</span>}
          </button>
        )}

        {/* 已有标签列表 */}
        {filteredTags.length > 0 ? (
          filteredTags.map(tag => (
            <button
              key={tag.id}
              onClick={() => handleSelectTag(tag)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-[#f5f5f5] transition-colors flex items-center justify-between group"
            >
              <span className="text-[#333639]">{tag.name}</span>
              {tag.note_count !== undefined && (
                <span className="text-xs text-[#8a8f99]">{tag.note_count}</span>
              )}
            </button>
          ))
        ) : !showCreateOption ? (
          <div className="px-3 py-6 text-center text-sm text-[#8a8f99]">
            {searchText ? '没有找到匹配的标签' : '暂无标签'}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Plus 图标
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}
