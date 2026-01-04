'use client';

import { useUIStore, useAuthStore } from '@/store';
import { cn } from '@/lib/utils';

/**
 * 侧边栏组件 - 严格按照 Get笔记 spec 实现
 * 
 * 结构（175px 固定宽度）：
 * ┌─────────────────┐
 * │ [Logo: Get笔记]  │
 * ├─────────────────┤
 * │ ● 首页          │ 44px 高度
 * │   AI助手        │
 * │   知识库        │
 * │   标签          │
 * ├─────────────────┤
 * │ [用户头像/信息]  │
 * └─────────────────┘
 */

// 菜单项配置
const MENU_ITEMS = [
  { id: 'home', label: '首页', icon: 'shouye' },
  { id: 'ai', label: 'AI助手', icon: 'zhushouxingxiang' },
  { id: 'knowledge', label: '知识库', icon: 'zhishiku' },
  { id: 'tags', label: '标签', icon: 'biaoqian1' },
  { id: 'trash', label: '回收站', icon: 'huishouzhan' },
] as const;

export function Sidebar() {
  const { activeMenu, setActiveMenu, toggleAIPanel } = useUIStore();
  const { user, logout } = useAuthStore();

  const handleMenuClick = (menuId: typeof MENU_ITEMS[number]['id']) => {
    setActiveMenu(menuId);
    // 点击 AI 助手时打开/关闭 AI 面板
    if (menuId === 'ai') {
      toggleAIPanel();
    }
  };

  return (
    <div className="flex flex-col h-full w-[175px] bg-[#fafafa]">
      {/* Logo */}
      <div className="h-[76px] flex items-center px-4 border-b border-[#e4e4e7]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#111418] rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">G</span>
          </div>
          <span className="text-[16px] font-semibold text-[#111418]">Get笔记</span>
        </div>
      </div>

      {/* 主菜单 */}
      <nav className="flex-1 py-2">
        <ul className="space-y-1">
          {MENU_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleMenuClick(item.id)}
                className={cn(
                  'w-full h-[44px] flex items-center gap-3 px-4 text-[16px] font-medium transition-colors',
                  activeMenu === item.id
                    ? 'text-[#111418] bg-white'
                    : 'text-[#8a8f99] hover:text-[#111418] hover:bg-white/50'
                )}
              >
                <MenuIcon name={item.icon} active={activeMenu === item.id} />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* 用户信息 */}
      <div className="p-4 border-t border-[#e4e4e7]">
        <div className="flex items-center gap-3">
          <div className="w-[44px] h-[44px] rounded-full bg-[rgba(173,179,190,0.3)] flex items-center justify-center">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-[16px] font-medium text-[#8a8f99]">
                {user?.nickname?.charAt(0) || user?.email?.charAt(0) || '?'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-[#333639] truncate">
              {user?.nickname || user?.email || '未登录'}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            title="退出登录"
          >
            <LogoutIcon className="w-4 h-4 text-[#8a8f99]" />
          </button>
        </div>
      </div>
    </div>
  );
}

// 菜单图标组件
function MenuIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? '#111418' : '#8a8f99';
  
  // 使用 SVG 图标（与 Get笔记 的 iconfont 对应）
  switch (name) {
    case 'shouye':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={color}>
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      );
    case 'zhushouxingxiang':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={color}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      );
    case 'zhishiku':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={color}>
          <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
        </svg>
      );
    case 'biaoqian1':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={color}>
          <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z" />
        </svg>
      );
    case 'huishouzhan':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      );
    default:
      return <div className="w-5 h-5" />;
  }
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
