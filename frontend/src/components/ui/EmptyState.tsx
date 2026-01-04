'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * 空状态组件 - Get笔记风格
 * 
 * 用于：
 * - 笔记列表为空
 * - 搜索无结果
 * - 标签无内容
 * - 回收站为空
 */

type EmptyStateType = 'notes' | 'search' | 'tags' | 'trash' | 'knowledge' | 'custom';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

// 预设配置
const PRESETS: Record<EmptyStateType, { icon: string; title: string; description: string }> = {
  notes: {
    icon: '📝',
    title: '开始记录你的想法',
    description: '点击下方按钮或使用 ⌘N 创建第一篇笔记',
  },
  search: {
    icon: '🔍',
    title: '没有找到相关内容',
    description: '尝试使用不同的关键词搜索',
  },
  tags: {
    icon: '🏷️',
    title: '还没有标签',
    description: '为笔记添加标签，让内容更容易找到',
  },
  trash: {
    icon: '🗑️',
    title: '回收站是空的',
    description: '删除的笔记会在这里保留 30 天',
  },
  knowledge: {
    icon: '📚',
    title: '知识库为空',
    description: '将笔记整理成知识库，构建你的知识体系',
  },
  custom: {
    icon: '📄',
    title: '暂无内容',
    description: '',
  },
};

export function EmptyState({ 
  type = 'custom', 
  title, 
  description, 
  icon,
  action,
  className 
}: EmptyStateProps) {
  const preset = PRESETS[type];
  const displayIcon = icon || preset.icon;
  const displayTitle = title || preset.title;
  const displayDescription = description || preset.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center py-16 px-8',
        className
      )}
    >
      {/* 图标/插画 */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="mb-6"
      >
        {typeof displayIcon === 'string' ? (
          <div className="relative">
            {/* 背景装饰 */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#f0f4ff] to-[#e8f5e9] rounded-full scale-150 blur-2xl opacity-60" />
            <span className="relative text-[72px] block">{displayIcon}</span>
          </div>
        ) : (
          displayIcon
        )}
      </motion.div>

      {/* 标题 */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-[18px] font-semibold text-[#111418] mb-2 text-center"
      >
        {displayTitle}
      </motion.h3>

      {/* 描述 */}
      {displayDescription && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[14px] text-[#8a8f99] text-center max-w-[300px] leading-relaxed"
        >
          {displayDescription}
        </motion.p>
      )}

      {/* 操作按钮 */}
      {action && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={action.onClick}
          className={cn(
            'mt-6 px-6 py-3 rounded-xl font-medium text-[14px]',
            'bg-[#2a88ff] text-white',
            'hover:bg-[#1a78ef] transition-colors',
            'shadow-[0_4px_14px_rgba(42,136,255,0.25)]',
            'active:scale-95 transition-transform'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {action.label}
        </motion.button>
      )}

      {/* 快捷键提示（仅笔记空状态） */}
      {type === 'notes' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex items-center gap-4 text-[12px] text-[#adb3be]"
        >
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-[#f5f5f5] rounded text-[#8a8f99] font-mono">⌘ N</kbd>
            <span>新建笔记</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-[#f5f5f5] rounded text-[#8a8f99] font-mono">⌘ K</kbd>
            <span>搜索</span>
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

// 带插图的空状态变体（用于更大的空间）
export function EmptyStateIllustrated({ 
  type = 'notes',
  action,
  className 
}: Omit<EmptyStateProps, 'icon' | 'title' | 'description'>) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'flex flex-col items-center justify-center py-20 px-8',
        className
      )}
    >
      {/* SVG 插图 */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        {type === 'notes' && <NotesIllustration />}
        {type === 'search' && <SearchIllustration />}
        {type === 'trash' && <TrashIllustration />}
      </motion.div>

      {/* 内容 */}
      <EmptyState type={type} action={action} icon={null} className="py-0" />
    </motion.div>
  );
}

// 笔记插图
function NotesIllustration() {
  return (
    <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
      {/* 背景卡片 */}
      <rect x="30" y="20" width="140" height="120" rx="12" fill="#f5f7fa" />
      <rect x="40" y="30" width="120" height="100" rx="8" fill="white" filter="url(#shadow1)" />
      
      {/* 卡片内容线条 */}
      <rect x="52" y="46" width="60" height="8" rx="4" fill="#e4e4e7" />
      <rect x="52" y="62" width="96" height="6" rx="3" fill="#f0f0f0" />
      <rect x="52" y="76" width="80" height="6" rx="3" fill="#f0f0f0" />
      <rect x="52" y="90" width="88" height="6" rx="3" fill="#f0f0f0" />
      
      {/* 装饰元素 */}
      <circle cx="160" cy="40" r="20" fill="#eff6ff" />
      <circle cx="160" cy="40" r="12" fill="#2a88ff" opacity="0.2" />
      <path d="M156 40L159 43L165 37" stroke="#2a88ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* 加号图标 */}
      <circle cx="100" cy="110" r="16" fill="#2a88ff" />
      <path d="M100 104V116M94 110H106" stroke="white" strokeWidth="2" strokeLinecap="round" />
      
      <defs>
        <filter id="shadow1" x="36" y="28" width="128" height="108" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.08" />
        </filter>
      </defs>
    </svg>
  );
}

// 搜索插图
function SearchIllustration() {
  return (
    <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
      {/* 放大镜 */}
      <circle cx="90" cy="70" r="40" stroke="#e4e4e7" strokeWidth="8" />
      <path d="M118 98L145 125" stroke="#e4e4e7" strokeWidth="8" strokeLinecap="round" />
      
      {/* 问号 */}
      <text x="78" y="82" fontSize="40" fill="#adb3be" fontWeight="bold">?</text>
      
      {/* 装饰圆点 */}
      <circle cx="50" cy="40" r="6" fill="#eff6ff" />
      <circle cx="160" cy="50" r="8" fill="#fef3c7" />
      <circle cx="150" cy="120" r="5" fill="#ecfdf5" />
    </svg>
  );
}

// 回收站插图
function TrashIllustration() {
  return (
    <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
      {/* 垃圾桶 */}
      <path d="M60 50H140V130C140 136.627 134.627 142 128 142H72C65.3726 142 60 136.627 60 130V50Z" fill="#f5f7fa" stroke="#e4e4e7" strokeWidth="2" />
      <rect x="55" y="40" width="90" height="14" rx="4" fill="#e4e4e7" />
      <rect x="85" y="30" width="30" height="14" rx="4" fill="#e4e4e7" />
      
      {/* 垃圾桶线条 */}
      <line x1="80" y1="65" x2="80" y2="125" stroke="#e4e4e7" strokeWidth="2" strokeLinecap="round" />
      <line x1="100" y1="65" x2="100" y2="125" stroke="#e4e4e7" strokeWidth="2" strokeLinecap="round" />
      <line x1="120" y1="65" x2="120" y2="125" stroke="#e4e4e7" strokeWidth="2" strokeLinecap="round" />
      
      {/* 闪光效果 */}
      <path d="M145 35L150 45L160 40" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
