'use client';

import { useEffect } from 'react';
import { useUIStore, useAuthStore, useNotesStore, useTagsStore } from '@/store';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { AIPanel } from './AIPanel';
import { TagManager } from '../tags/TagManager';
import { TrashBin } from '../trash/TrashBin';
import { ConflictDialog } from '../dialogs/ConflictDialog';
import { Toast } from '../ui/toast';
import { cn } from '@/lib/utils';

/**
 * 主布局组件 - 严格按照 Get笔记 spec 实现三栏布局
 * 
 * 布局结构：
 * ┌──────────┬─────────────────────────────┬──────────────┐
 * │ 侧边栏    │   主内容区（笔记列表+编辑器） │  AI 助手面板  │
 * │ (175px)  │        (774px)              │   (280px)    │
 * └──────────┴─────────────────────────────┴──────────────┘
 */
export function MainLayout() {
  const { sidebarOpen, aiPanelOpen, activeMenu, toast, hideToast } = useUIStore();
  const { token } = useAuthStore();
  const { fetchNotes, conflictData } = useNotesStore();
  const { fetchTags } = useTagsStore();

  // 初始化数据
  useEffect(() => {
    if (token) {
      fetchNotes();
      fetchTags();
    }
  }, [token, fetchNotes, fetchTags]);

  // 全局键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K 打开搜索
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // TODO: 打开搜索
      }
      // Cmd/Ctrl + N 新建笔记
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        useNotesStore.getState().createNote({
          title: '',
          content: '',
          json_content: '{"type":"doc","content":[]}',
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-[#f2f2f3] overflow-hidden">
      {/* 侧边栏 - 固定 175px */}
      <aside
        className={cn(
          'h-full flex-shrink-0 bg-[#fafafa] border-r border-[#e4e4e7] transition-all duration-200',
          sidebarOpen ? 'w-[175px]' : 'w-0 overflow-hidden'
        )}
      >
        <Sidebar />
      </aside>

      {/* 主内容区 - 774px（或自适应） */}
      <main className="flex-1 min-w-0 h-full overflow-hidden">
        {activeMenu === 'tags' ? (
          <TagManager />
        ) : activeMenu === 'trash' ? (
          <TrashBin />
        ) : (
          <MainContent />
        )}
      </main>

      {/* AI 助手面板 - 280px */}
      <aside
        className={cn(
          'h-full flex-shrink-0 bg-white border-l border-[#e4e4e7] transition-all duration-200',
          aiPanelOpen ? 'w-[280px]' : 'w-0 overflow-hidden'
        )}
      >
        <AIPanel />
      </aside>

      {/* 版本冲突对话框 */}
      {conflictData && <ConflictDialog />}

      {/* Toast 通知 */}
      {toast.open && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
