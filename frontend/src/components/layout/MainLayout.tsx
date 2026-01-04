'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
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
 * 主布局组件 - Get笔记风格三栏布局
 * 
 * 布局结构：
 * ┌──────────┬─────────────────────────────┬──────────────┐
 * │ 侧边栏    │   主内容区（笔记列表+编辑器） │  AI 助手面板  │
 * │(175/60px)│        (自适应)              │   (280px)    │
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
      // Cmd/Ctrl + K 打开搜索（SearchBar 组件处理）
      // Cmd/Ctrl + N 新建笔记
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        useNotesStore.getState().createNote({
          title: '',
          content: '',
          json_content: '{"type":"doc","content":[]}',
        });
      }
      // Cmd/Ctrl + \ 切换侧边栏
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        useUIStore.getState().toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-[#f2f2f3] overflow-hidden">
      {/* 侧边栏 - 可折叠 */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 175 : 60 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="h-full flex-shrink-0 bg-[#fafafa] border-r border-[#e4e4e7]"
      >
        <Sidebar />
      </motion.aside>

      {/* 主内容区 - 自适应 */}
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
      <motion.aside
        initial={false}
        animate={{ 
          width: aiPanelOpen ? 280 : 0,
          opacity: aiPanelOpen ? 1 : 0
        }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          'h-full flex-shrink-0 bg-white border-l border-[#e4e4e7] overflow-hidden',
          aiPanelOpen && 'shadow-[-4px_0_20px_rgba(0,0,0,0.05)]'
        )}
      >
        <AIPanel />
      </motion.aside>

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
