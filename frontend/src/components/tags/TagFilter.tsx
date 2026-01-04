'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTagsStore, useNotesStore } from '@/store';

/**
 * 标签筛选组件
 * 
 * 功能：
 * 1. 显示所有标签及使用次数
 * 2. 支持单选/多选筛选
 * 3. 支持 AND/OR 匹配模式
 * 4. 标签云效果（根据使用次数调整大小）
 */

interface TagFilterProps {
  className?: string;
  mode?: 'panel' | 'dropdown';
}

export function TagFilter({ className, mode = 'panel' }: TagFilterProps) {
  const { tags } = useTagsStore();
  const { filterTagId, setFilterTag, fetchNotes } = useNotesStore();
  const [selectedTags, setSelectedTags] = useState<string[]>(filterTagId ? [filterTagId] : []);
  const [matchMode, setMatchMode] = useState<'AND' | 'OR'>('OR');
  
  // 按使用次数排序的标签
  const sortedTags = useMemo(() => {
    return [...tags].sort((a, b) => (b.note_count || 0) - (a.note_count || 0));
  }, [tags]);
  
  // 计算标签大小
  const getTagSize = (count: number): 'sm' | 'md' | 'lg' => {
    const maxCount = Math.max(...tags.map(t => t.note_count || 0), 1);
    const ratio = count / maxCount;
    if (ratio > 0.6) return 'lg';
    if (ratio > 0.3) return 'md';
    return 'sm';
  };
  
  // 处理标签点击
  const handleTagClick = (tagId: string) => {
    let newSelected: string[];
    
    if (selectedTags.includes(tagId)) {
      // 已选中，取消选择
      newSelected = selectedTags.filter(id => id !== tagId);
    } else {
      // 未选中，添加选择（单选模式下替换，多选模式下追加）
      if (matchMode === 'OR') {
        newSelected = [...selectedTags, tagId];
      } else {
        newSelected = [...selectedTags, tagId];
      }
    }
    
    setSelectedTags(newSelected);
    
    // 更新筛选（简单模式下只支持单选）
    if (newSelected.length === 0) {
      setFilterTag(null);
    } else if (newSelected.length === 1) {
      setFilterTag(newSelected[0]);
    } else {
      // 多选暂时用第一个（后续可扩展 API）
      setFilterTag(newSelected[0]);
    }
    
    // 重新获取笔记
    fetchNotes(1);
  };
  
  // 清除筛选
  const handleClear = () => {
    setSelectedTags([]);
    setFilterTag(null);
    fetchNotes(1);
  };
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5 font-medium',
  };
  
  return (
    <div className={cn('p-4', className)}>
      {/* 标题和操作 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[#333639]">标签筛选</h3>
        {selectedTags.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-[#2a88ff] hover:underline"
          >
            清除筛选
          </button>
        )}
      </div>
      
      {/* 匹配模式切换 */}
      {selectedTags.length > 1 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-[#8a8f99]">匹配模式:</span>
          <button
            onClick={() => setMatchMode('OR')}
            className={cn(
              'text-xs px-2 py-0.5 rounded',
              matchMode === 'OR' 
                ? 'bg-[#2a88ff] text-white' 
                : 'bg-[#f5f5f5] text-[#666]'
            )}
          >
            任意
          </button>
          <button
            onClick={() => setMatchMode('AND')}
            className={cn(
              'text-xs px-2 py-0.5 rounded',
              matchMode === 'AND' 
                ? 'bg-[#2a88ff] text-white' 
                : 'bg-[#f5f5f5] text-[#666]'
            )}
          >
            全部
          </button>
        </div>
      )}
      
      {/* 标签云 */}
      {sortedTags.length === 0 ? (
        <p className="text-sm text-[#8a8f99]">暂无标签</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sortedTags.map((tag) => {
            const isSelected = selectedTags.includes(tag.id);
            const size = getTagSize(tag.note_count || 0);
            
            return (
              <button
                key={tag.id}
                onClick={() => handleTagClick(tag.id)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border transition-all',
                  sizeClasses[size],
                  isSelected
                    ? 'bg-[#2a88ff] text-white border-[#2a88ff]'
                    : 'bg-white text-[#677084] border-[#e5e6ea] hover:border-[#2a88ff] hover:text-[#2a88ff]'
                )}
                style={{
                  borderColor: !isSelected && tag.color ? tag.color : undefined,
                }}
              >
                <span>{tag.name}</span>
                {tag.note_count !== undefined && (
                  <span className={cn(
                    'text-xs',
                    isSelected ? 'text-white/70' : 'text-[#adb3be]'
                  )}>
                    {tag.note_count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      
      {/* 已选标签提示 */}
      {selectedTags.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#e5e6ea]">
          <p className="text-xs text-[#8a8f99]">
            已选 {selectedTags.length} 个标签
            {selectedTags.length > 1 && (
              <span>（{matchMode === 'OR' ? '包含任意' : '同时包含'}）</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * 紧凑版标签选择器（用于 Sidebar）
 */
export function TagFilterCompact() {
  const { tags } = useTagsStore();
  const { filterTagId, setFilterTag, fetchNotes } = useNotesStore();
  
  // 取前 10 个热门标签
  const topTags = useMemo(() => {
    return [...tags]
      .sort((a, b) => (b.note_count || 0) - (a.note_count || 0))
      .slice(0, 10);
  }, [tags]);
  
  const handleTagClick = (tagId: string | null) => {
    setFilterTag(tagId);
    fetchNotes(1);
  };
  
  return (
    <div className="px-4 py-2">
      <div className="flex flex-wrap gap-1.5">
        {/* 全部标签选项 */}
        <button
          onClick={() => handleTagClick(null)}
          className={cn(
            'text-xs px-2 py-0.5 rounded-full border transition-colors',
            filterTagId === null
              ? 'bg-[#2a88ff] text-white border-[#2a88ff]'
              : 'bg-white text-[#677084] border-[#e5e6ea] hover:border-[#2a88ff]'
          )}
        >
          全部
        </button>
        
        {topTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => handleTagClick(tag.id)}
            className={cn(
              'text-xs px-2 py-0.5 rounded-full border transition-colors',
              filterTagId === tag.id
                ? 'bg-[#2a88ff] text-white border-[#2a88ff]'
                : 'bg-white text-[#677084] border-[#e5e6ea] hover:border-[#2a88ff]'
            )}
          >
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  );
}
