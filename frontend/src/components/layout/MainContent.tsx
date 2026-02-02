'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNotesStore, useUIStore } from '@/store';
import { Omnibar } from '../omnibar/Omnibar';
import { NoteList } from '../notes/NoteList';
import { NoteDetail } from '../notes/NoteDetail';
import { SearchBar } from './SearchBar';
import { EmptyState } from '../ui/EmptyState';
import { cn } from '@/lib/utils';

/**
 * 主内容区组件 - Get笔记风格深度还原
 * 
 * 结构：
 * ┌────────────────────────────────────────┐
 * │ 全部笔记 ▼    [🔍 搜索笔记 ⌘K]  🔄     │ Header (76px)
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
  const { currentNote, notes, isLoading, fetchNotes } = useNotesStore();
  const { viewMode } = useUIStore();
  
  // 初始化加载数据
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);
  
  // 当选中笔记时显示详情页，否则显示列表
  const showDetail = currentNote !== null && viewMode === 'detail';
  const isEmpty = notes.length === 0 && !isLoading;

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa]">
      {showDetail ? (
        // 笔记详情视图
        <NoteDetail />
      ) : (
        // 首页列表视图
        <>
          {/* 页面头部 */}
          <MainHeader />

          {/* 主要内容区 */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[800px] mx-auto px-4 sm:px-6">
              {/* Omnibar 输入区 */}
              <motion.div 
                className="pt-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Omnibar />
              </motion.div>

              {/* 笔记列表或空状态 */}
              <div className="py-6">
                {isEmpty ? (
                  <EmptyState 
                    type="notes" 
                    action={{
                      label: '创建第一篇笔记',
                      onClick: () => {
                        useNotesStore.getState().createNote({
                          title: '',
                          content: '',
                          json_content: '{"type":"doc","content":[]}',
                        });
                      }
                    }}
                  />
                ) : (
                  <NoteList />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * 主内容区头部 - 现代化样式
 */
function MainHeader() {
  const { fetchNotes, isLoading, searchKeyword } = useNotesStore();
  const { notes } = useNotesStore();
  const [showFilters, setShowFilters] = useState(false);

  // 是否有活动筛选
  const hasActiveFilter = searchKeyword !== '';

  return (
    <header className="bg-white border-b border-[#e8e8e8] sticky top-0 z-10">
      {/* 主标题栏 */}
      <div className="h-[64px] flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          {/* 标题和下拉 */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 hover:bg-[#f5f5f5] px-3 py-2 rounded-xl transition-colors"
          >
            <h1 className="text-[20px] font-semibold text-[#111418]">全部笔记</h1>
            <motion.div
              animate={{ rotate: showFilters ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDownIcon className="w-5 h-5 text-[#8a8f99]" />
            </motion.div>
          </button>
          
          {/* 筛选指示器 */}
          {hasActiveFilter && (
            <span className="flex items-center gap-1 px-2 py-1 bg-[#eff6ff] rounded-lg text-[12px] text-[#2a88ff] font-medium">
              <FilterIcon className="w-3.5 h-3.5" />
              已筛选
            </span>
          )}

          {/* 笔记数量 */}
          <span className="text-[13px] text-[#8a8f99]">
            {notes.length} 篇笔记
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 搜索框 */}
          <SearchBar />

          {/* 刷新按钮 */}
          <motion.button
            onClick={() => fetchNotes()}
            disabled={isLoading}
            className={cn(
              "p-2.5 rounded-xl transition-colors",
              "bg-[#f5f5f5] hover:bg-[#ebebeb]",
              "disabled:opacity-50"
            )}
            title="刷新 (⌘R)"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
              transition={isLoading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
            >
              <RefreshIcon className="w-4 h-4 text-[#5a5f6b]" />
            </motion.div>
          </motion.button>
        </div>
      </div>
      
      {/* 标签筛选栏 - 动画展开 */}
      <motion.div
        initial={false}
        animate={{ 
          height: showFilters ? 'auto' : 0,
          opacity: showFilters ? 1 : 0
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden border-t border-[#f0f0f0]"
      >
      </motion.div>
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

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}
