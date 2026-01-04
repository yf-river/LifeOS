'use client';

import { useState, useEffect } from 'react';
import { useNotesStore, useTagsStore, useUIStore } from '@/store';
import { Omnibar } from '../omnibar/Omnibar';
import { NoteList } from '../notes/NoteList';
import { NoteDetail } from '../notes/NoteDetail';
import { SearchBar } from '../search/SearchBar';
import { TagFilterCompact } from '../tags/TagFilter';
import { cn } from '@/lib/utils';

/**
 * 主内容区组件 - Get笔记 中间区域
 * 
 * 结构：
 * ┌────────────────────────────────────────┐
 * │ 全部笔记 ▼           🔄 刷新            │ Header (76px)
 * ├────────────────────────────────────────┤
 * │ ┌────────────────────────────────────┐ │
 * │ │ 记录现在的想法...                   │ │ Omnibar
 * │ │ [图][B][色][I][1.][•]       [发送] │ │
 * │ └────────────────────────────────────┘ │
 * │ 你还可以：                              │
 * │ [添加图片] [添加链接] [导入音视频]      │ Quick Actions
 * │                                        │
 * │ ── 昨天 ──                             │
 * │ ┌────────────────────────────────────┐ │
 * │ │ 笔记卡片 1                          │ │ Note Cards
 * │ └────────────────────────────────────┘ │
 * │ ┌────────────────────────────────────┐ │
 * │ │ 笔记卡片 2                          │ │
 * │ └────────────────────────────────────┘ │
 * └────────────────────────────────────────┘
 */
export function MainContent() {
  const { currentNote, isLoading, fetchNotes } = useNotesStore();
  const { fetchTags } = useTagsStore();
  const { viewMode } = useUIStore();
  
  // 初始化加载数据
  useEffect(() => {
    fetchNotes();
    fetchTags();
  }, [fetchNotes, fetchTags]);
  
  // 当选中笔记时显示详情页，否则显示列表
  const showDetail = currentNote !== null && viewMode === 'detail';

  return (
    <div className="flex flex-col h-full bg-white">
      {showDetail ? (
        // 笔记详情视图
        <NoteDetail />
      ) : (
        // 首页列表视图
        <>
          {/* 页面头部 */}
          <MainHeader />

          {/* Omnibar 输入区 */}
          <div className="px-[14px] pt-4">
            <Omnibar />
          </div>

          {/* 笔记列表 */}
          <div className="flex-1 overflow-y-auto px-[14px]">
            <NoteList />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * 主内容区头部
 */
function MainHeader() {
  const { fetchNotes, isLoading, filterTagId, searchKeyword } = useNotesStore();
  const [showFilters, setShowFilters] = useState(false);

  // 是否有活动筛选
  const hasActiveFilter = filterTagId !== null || searchKeyword !== '';

  return (
    <header className="border-b border-[#e4e4e7]">
      {/* 主标题栏 */}
      <div className="h-[76px] flex items-center justify-between px-[14px]">
        <div className="flex items-center gap-2">
          <h1 className="text-[24px] font-medium text-[#111418]">全部笔记</h1>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "text-[#8a8f99] hover:text-[#333639] transition-transform",
              showFilters && "rotate-180"
            )}
          >
            <ChevronDownIcon className="w-5 h-5" />
          </button>
          {hasActiveFilter && (
            <span className="w-2 h-2 bg-[#2a88ff] rounded-full" />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* 搜索框 */}
          <SearchBar className="w-[240px]" />
          
          <button
            onClick={() => fetchNotes()}
            disabled={isLoading}
            className="p-2 hover:bg-[#f5f5f5] rounded-lg transition-colors disabled:opacity-50"
            title="刷新"
          >
            <RefreshIcon className={cn("w-5 h-5 text-[#8a8f99]", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>
      
      {/* 标签筛选栏 */}
      {showFilters && (
        <div className="border-t border-[#e4e4e7] bg-[#fafafa]">
          <TagFilterCompact />
        </div>
      )}
    </header>
  );
}

// Icons
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
