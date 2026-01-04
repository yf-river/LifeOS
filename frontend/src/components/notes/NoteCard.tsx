'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatRelativeTime, formatAbsoluteTime } from '@/lib/formatTime';
import { LinkPreview } from './LinkPreview';

/**
 * 笔记卡片组件 - Get笔记风格深度还原
 * 
 * 结构：
 * ┌────────────────────────────────────────────────────────────┐
 * │ [AI标识] [置顶标识]                                        │
 * │                                                            │
 * │ [标题/内容预览]                                            │
 * │ 内容预览文本（最多3行）...                                  │
 * │                                                            │
 * │ [图片预览区域 - 最多4张，带圆角]                            │
 * │ [链接预览卡片]                                              │
 * │                                                            │
 * │ [标签1] [标签2] [+N]                                       │
 * ├────────────────────────────────────────────────────────────┤
 * │ 📅 3分钟前 · 今天 14:30                              [···] │
 * └────────────────────────────────────────────────────────────┘
 */

// URL 正则
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;

// 系统标签配置
const SYSTEM_TAGS = {
  ai_link: { label: 'AI链接', icon: 'link', color: '#3b82f6', bg: '#eff6ff' },
  image: { label: '图片', icon: 'image', color: '#10b981', bg: '#ecfdf5' },
  audio: { label: '录音', icon: 'audio', color: '#8b5cf6', bg: '#f5f3ff' },
  video: { label: '视频', icon: 'video', color: '#f59e0b', bg: '#fffbeb' },
};

interface Note {
  id: string;
  title?: string;
  content?: string;
  json_content?: string;
  note_type?: string;
  ai_generated?: boolean;
  is_pinned?: boolean;
  source_url?: string;
  images?: string[];
  tags?: Array<{ id: string; name: string; type?: string; color?: string }>;
  created_at: string;
  updated_at: string;
}

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  isSelected?: boolean;
}

export function NoteCard({ note, onClick, isSelected }: NoteCardProps) {
  const [imageError, setImageError] = useState<Set<number>>(new Set());
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // 解析笔记类型
  const noteType = note.note_type as keyof typeof SYSTEM_TAGS | undefined;
  const systemTag = noteType && SYSTEM_TAGS[noteType];
  const isAINote = note.ai_generated || noteType === 'ai_link';

  // 解析图片（从 json_content 或 images 字段）
  const images = useMemo(() => {
    if (note.images && note.images.length > 0) {
      return note.images.slice(0, 4);
    }
    return [];
  }, [note.images]);

  // 提取链接
  const links = useMemo(() => {
    if (!note.content) return [];
    const matches = note.content.match(URL_REGEX) || [];
    return Array.from(new Set(matches)).slice(0, 1);
  }, [note.content]);

  // 格式化时间
  const displayTime = useMemo(() => formatRelativeTime(note.created_at), [note.created_at]);
  const absoluteTime = useMemo(() => formatAbsoluteTime(note.created_at), [note.created_at]);
  
  // 获取短时间（时:分）
  const shortTime = useMemo(() => {
    const date = new Date(note.created_at);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }, [note.created_at]);

  // 用户标签
  const userTags = useMemo(() => {
    return (note.tags || []).filter(tag => tag.type !== 'system');
  }, [note.tags]);

  const visibleTags = userTags.slice(0, 3);
  const hiddenTagsCount = Math.max(0, userTags.length - 3);

  // 处理图片加载错误
  const handleImageError = (index: number) => {
    setImageError(prev => new Set(prev).add(index));
  };

  return (
    <motion.div
      layout
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl overflow-hidden cursor-pointer',
        'transition-all duration-200 ease-out',
        isSelected
          ? 'ring-2 ring-[#2a88ff] shadow-[0_4px_24px_rgba(42,136,255,0.15)]'
          : 'shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1'
      )}
      whileHover={{ scale: isSelected ? 1 : 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* 主内容区 */}
      <div className="p-4">
        {/* 顶部标识区 */}
        <div className="flex items-center gap-2 mb-2">
          {note.is_pinned && (
            <span className="flex items-center gap-1 text-[#f59e0b]">
              <PinIcon className="w-3.5 h-3.5" />
            </span>
          )}
          {isAINote && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-[#eff6ff] rounded-full">
              <AISparkleIcon className="w-3.5 h-3.5 text-[#3b82f6]" />
              <span className="text-[11px] font-medium text-[#3b82f6]">AI</span>
            </span>
          )}
        </div>

        {/* 标题 */}
        {note.title && (
          <h3 className="text-[15px] font-semibold text-[#111418] mb-1.5 line-clamp-2">
            {note.title}
          </h3>
        )}

        {/* 内容预览 */}
        <p className="text-[14px] text-[#5a5f6b] leading-relaxed line-clamp-3">
          {note.content || '无内容'}
        </p>

        {/* 图片预览网格 */}
        {images.length > 0 && (
          <div className={cn(
            'mt-3 grid gap-2',
            images.length === 1 && 'grid-cols-1',
            images.length === 2 && 'grid-cols-2',
            images.length >= 3 && 'grid-cols-2'
          )}>
            {images.map((img, idx) => (
              !imageError.has(idx) && (
                <div
                  key={idx}
                  className={cn(
                    'relative rounded-xl overflow-hidden bg-[#f5f5f5]',
                    images.length === 1 ? 'aspect-video' : 'aspect-square',
                    images.length === 3 && idx === 0 && 'row-span-2 aspect-auto h-full'
                  )}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={() => handleImageError(idx)}
                  />
                  {/* 多图数量提示 */}
                  {images.length > 4 && idx === 3 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-lg font-semibold">+{images.length - 4}</span>
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
        )}

        {/* 链接预览 */}
        {links.length > 0 && images.length === 0 && (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <LinkPreview url={links[0]} compact />
          </div>
        )}

        {/* 标签区 */}
        {(systemTag || visibleTags.length > 0) && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {/* 系统标签 */}
            {systemTag && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg"
                style={{ backgroundColor: systemTag.bg, color: systemTag.color }}
              >
                <SystemTagIcon type={noteType!} />
                {systemTag.label}
              </span>
            )}

            {/* 用户标签 */}
            {visibleTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-1 text-[11px] rounded-lg bg-[#f5f5f5] text-[#5a5f6b] hover:bg-[#ebebeb] transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: tag.color || '#8a8f99' }} />
                {tag.name}
              </span>
            ))}

            {/* 更多标签数量 */}
            {hiddenTagsCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 text-[11px] rounded-lg bg-[#f5f5f5] text-[#8a8f99]">
                +{hiddenTagsCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 底部信息栏 */}
      <div className="px-4 py-3 border-t border-[#f5f5f5] flex items-center justify-between bg-[#fafafa]/50">
        <div className="flex items-center gap-2 text-[12px] text-[#8a8f99]">
          <CalendarIcon className="w-3.5 h-3.5" />
          <span title={absoluteTime}>{displayTime}</span>
          <span className="text-[#e0e0e0]">·</span>
          <span>{shortTime}</span>
        </div>
        
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMoreMenu(!showMoreMenu);
            }}
            className="p-1.5 hover:bg-white rounded-lg transition-colors"
          >
            <MoreIcon className="w-4 h-4 text-[#adb3be]" />
          </button>

          {/* 更多操作菜单 */}
          {showMoreMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute right-0 bottom-full mb-1 bg-white rounded-xl shadow-lg border border-[#f0f0f0] py-1 min-w-[120px] z-10"
            >
              <button className="w-full px-3 py-2 text-left text-[13px] text-[#333639] hover:bg-[#f5f5f5] transition-colors flex items-center gap-2">
                <PinIcon className="w-4 h-4" />
                置顶
              </button>
              <button className="w-full px-3 py-2 text-left text-[13px] text-[#333639] hover:bg-[#f5f5f5] transition-colors flex items-center gap-2">
                <TagIcon className="w-4 h-4" />
                添加标签
              </button>
              <button className="w-full px-3 py-2 text-left text-[13px] text-[#ef4444] hover:bg-[#fef2f2] transition-colors flex items-center gap-2">
                <TrashIcon className="w-4 h-4" />
                删除
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// 图标组件
function AISparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
      <circle cx="5" cy="12" r="1.5" />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function SystemTagIcon({ type }: { type: keyof typeof SYSTEM_TAGS }) {
  const className = 'w-3 h-3';
  switch (type) {
    case 'ai_link':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
        </svg>
      );
    case 'image':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      );
    case 'audio':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
        </svg>
      );
    case 'video':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
        </svg>
      );
    default:
      return null;
  }
}
