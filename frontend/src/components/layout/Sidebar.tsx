'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore, useAuthStore, useNotesStore } from '@/store';
import { cn } from '@/lib/utils';

/**
 * 侧边栏组件 - 严格按照 Get笔记 spec 实现
 * 
 * 结构（175px 固定宽度，可折叠至 60px）：
 * ┌─────────────────┐
 * │ [Logo: Get笔记]  │ ← 可点击折叠
 * ├─────────────────┤
 * │ ● 首页          │ 44px 高度
 * │   AI助手        │
 * │   知识库        │
 * │   标签          │
 * │   回收站        │
 * ├─────────────────┤
 * │ [新建笔记按钮]   │
 * ├─────────────────┤
 * │ [用户头像/信息]  │
 * └─────────────────┘
 */

// 菜单项配置
const MENU_ITEMS = [
  { id: 'home', label: '首页', icon: 'home', shortcut: '⌘1' },
  { id: 'ai', label: 'AI助手', icon: 'ai', shortcut: '⌘2' },
  { id: 'knowledge', label: '知识库', icon: 'book', shortcut: '⌘3' },
  { id: 'trash', label: '回收站', icon: 'trash', shortcut: '⌘4' },
] as const;

// 动画配置
const sidebarVariants = {
  expanded: { width: 175 },
  collapsed: { width: 60 },
};

const labelVariants = {
  expanded: { opacity: 1, x: 0, display: 'block' },
  collapsed: { opacity: 0, x: -10, transitionEnd: { display: 'none' } },
};

export function Sidebar() {
  const { activeMenu, setActiveMenu, toggleAIPanel, sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const { createNote } = useNotesStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleMenuClick = (menuId: typeof MENU_ITEMS[number]['id']) => {
    setActiveMenu(menuId);
    if (menuId === 'ai') {
      toggleAIPanel();
    }
  };

  const handleNewNote = () => {
    createNote({
      title: '',
      content: '',
      json_content: '{"type":"doc","content":[]}',
    });
    setActiveMenu('home');
  };

  // 判断是否折叠态
  const isCollapsed = !sidebarOpen;

  return (
    <motion.div
      initial={false}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      variants={sidebarVariants}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="flex flex-col h-full bg-[#fafafa] overflow-hidden"
    >
      {/* Logo 区域 - 点击折叠/展开 */}
      <div 
        className="h-[76px] flex items-center px-4 border-b border-[#e4e4e7] cursor-pointer hover:bg-white/50 transition-colors"
        onClick={toggleSidebar}
      >
        <div className="flex items-center gap-2">
          <motion.div 
            className="w-8 h-8 bg-gradient-to-br from-[#111418] to-[#2a88ff] rounded-lg flex items-center justify-center shadow-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-white text-sm font-bold">L</span>
          </motion.div>
          <motion.span 
            variants={labelVariants}
            className="text-[16px] font-semibold text-[#111418] whitespace-nowrap"
          >
            LifeOS
          </motion.span>
        </div>
      </div>

      {/* 主菜单 */}
      <nav className="flex-1 py-3 px-2">
        <ul className="space-y-1">
          {MENU_ITEMS.map((item) => (
            <li key={item.id}>
              <motion.button
                onClick={() => handleMenuClick(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  'w-full h-[44px] flex items-center gap-3 px-3 text-[15px] font-medium rounded-xl transition-all duration-200 relative',
                  activeMenu === item.id
                    ? 'text-[#111418] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                    : 'text-[#8a8f99] hover:text-[#111418] hover:bg-white/60'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <MenuIcon name={item.icon} active={activeMenu === item.id} />
                <motion.span variants={labelVariants} className="whitespace-nowrap">
                  {item.label}
                </motion.span>
                
                {/* 悬浮提示（折叠态） */}
                <AnimatePresence>
                  {isCollapsed && hoveredItem === item.id && (
                    <motion.div
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      className="absolute left-full ml-2 px-3 py-2 bg-[#111418] text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50"
                    >
                      {item.label}
                      <span className="ml-2 text-[#8a8f99]">{item.shortcut}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </li>
          ))}
        </ul>
      </nav>

      {/* 新建笔记按钮 */}
      <div className="px-2 pb-3">
        <motion.button
          onClick={handleNewNote}
          className={cn(
            'w-full h-[44px] flex items-center justify-center gap-2 rounded-xl',
            'bg-[#2a88ff] text-white font-medium shadow-sm',
            'hover:bg-[#1a78ef] transition-colors'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <PlusIcon className="w-5 h-5" />
          <motion.span variants={labelVariants} className="whitespace-nowrap">
            新建笔记
          </motion.span>
        </motion.button>
      </div>

      {/* 用户信息 */}
      <div className="p-3 border-t border-[#e4e4e7]">
        <div className={cn(
          'flex items-center gap-3 p-2 rounded-xl hover:bg-white/60 transition-colors cursor-pointer',
          isCollapsed && 'justify-center'
        )}>
          {/* 头像 */}
          <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-br from-[#adb3be] to-[#8a8f99] flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[14px] font-medium text-white">
                {user?.nickname?.charAt(0) || user?.email?.charAt(0) || '?'}
              </span>
            )}
          </div>
          
          {/* 用户名和退出按钮 */}
          <motion.div variants={labelVariants} className="flex-1 min-w-0 flex items-center justify-between">
            <p className="text-[13px] font-medium text-[#333639] truncate">
              {user?.nickname || user?.email?.split('@')[0] || '未登录'}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              className="p-1.5 hover:bg-[#f0f0f0] rounded-lg transition-colors"
              title="退出登录"
            >
              <LogoutIcon className="w-4 h-4 text-[#8a8f99]" />
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// 菜单图标组件 - 使用精心设计的 SVG 图标
function MenuIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? '#111418' : '#8a8f99';
  const strokeWidth = active ? '2' : '1.5';
  
  switch (name) {
    case 'home':
      return (
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'ai':
      return (
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
          <circle cx="8" cy="14" r="1" fill={color} />
          <circle cx="16" cy="14" r="1" fill={color} />
        </svg>
      );
    case 'book':
      return (
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="10" x2="14" y2="10" />
        </svg>
      );
    case 'trash':
      return (
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      );
    default:
      return <div className="w-5 h-5 flex-shrink-0" />;
  }
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
