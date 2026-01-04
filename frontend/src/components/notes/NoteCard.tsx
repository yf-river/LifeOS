'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatRelativeTime, formatAbsoluteTime } from '@/lib/formatTime';
import { LinkPreview } from './LinkPreview';

/**
 * 笔记卡片组件 - 严格按照 Get笔记 spec 实现
 * 
 * 结构：
 * ┌────────────────────────────────────────────────────────────┐
 * │ [AI标识]                                                   │
 * │                                                            │
 * │ [AI链接笔记标题/普通笔记内容]                               │
 * │ 内容预览文本...                                            │
 * │                                                            │
 * │ [图片预览区域 - 最多4张]                                    │
 * │ [链接预览卡片]                                              │
 * │                                                            │
 * │ [AI链接笔记] [标签1] [标签2] ...                           │
 * ├────────────────────────────────────────────────────────────┤
 * │ 创建于 2026-01-02 17:36:55                          [···] │
 * └────────────────────────────────────────────────────────────┘
 */

// URL 正则
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;

// 系统标签配置
const SYSTEM_TAGS = {
  ai_link: { label: 'AI链接笔记', icon: 'ai_link', color: '#3b82f6' },
  image: { label: '图片笔记', icon: 'image', color: '#10b981' },
  audio: { label: '录音笔记', icon: 'audio', color: '#8b5cf6' },
  video: { label: '视频笔记', icon: 'video', color: '#f59e0b' },
};

interface Note {
  id: string;
  title?: string;
  content?: string;
  json_content?: string;
  note_type?: string;
  ai_generated?: boolean;
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
  // 解析笔记类型
  const noteType = note.note_type as keyof typeof SYSTEM_TAGS | undefined;
  const systemTag = noteType && SYSTEM_TAGS[noteType];
  const isAINote = note.ai_generated || noteType === 'ai_link';

  // 解析图片（从 json_content 或 images 字段）
  const images = useMemo(() => {
    if (note.images && note.images.length > 0) {
      return note.images.slice(0, 4);
    }
    // TODO: 从 json_content 解析图片
    return [];
  }, [note.images]);

  // 提取链接（用于显示链接预览）
  const links = useMemo(() => {
    if (!note.content) return [];
    const matches = note.content.match(URL_REGEX) || [];
    return Array.from(new Set(matches)).slice(0, 1); // 只显示第一个链接
  }, [note.content]);

  // 格式化时间 - 使用相对时间显示
  const displayTime = useMemo(() => {
    return formatRelativeTime(note.created_at);
  }, [note.created_at]);
  
  // 绝对时间（用于悬浮提示）
  const absoluteTime = useMemo(() => {
    return formatAbsoluteTime(note.created_at);
  }, [note.created_at]);

  // 用户标签（排除系统标签）
  const userTags = useMemo(() => {
    return (note.tags || []).filter(tag => tag.type !== 'system').slice(0, 5);
  }, [note.tags]);

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-[#2a88ff]'
      )}
    >
      {/* 主内容区 */}
      <div className="p-4">
        {/* AI 标识 */}
        {isAINote && (
          <div className="flex items-center gap-1 mb-2">
            <AIIcon className="w-4 h-4 text-[#3b82f6]" />
          </div>
        )}

        {/* 标题/内容 - AI 链接笔记显示链接标题 */}
        {noteType === 'ai_link' && note.title ? (
          <div className="mb-2">
            <div className="flex items-center gap-2 p-3 bg-[#f5f7fa] rounded-lg">
              <LinkIcon className="w-4 h-4 text-[#3b82f6] flex-shrink-0" />
              <span className="text-sm font-medium text-[#333639] line-clamp-2">{note.title}</span>
            </div>
          </div>
        ) : null}

        {/* 内容预览 */}
        <div className="note-content tiptap-preview text-[#333639] text-sm leading-relaxed line-clamp-4">
          {note.content || '无内容'}
        </div>

        {/* 图片预览 */}
        {images.length > 0 && (
          <div className="mt-3 flex gap-2">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="w-[100px] h-[100px] rounded-lg overflow-hidden bg-[#f5f5f5]"
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {/* 链接预览 */}
        {links.length > 0 && (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <LinkPreview url={links[0]} compact />
          </div>
        )}

        {/* 标签区 */}
        <div className="mt-3 flex flex-wrap gap-2">
          {/* 系统标签 */}
          {systemTag && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-white border border-[#e5e6ea] text-[#677084]"
            >
              <SystemTagIcon type={noteType!} />
              {systemTag.label}
            </span>
          )}

          {/* 用户标签 */}
          {userTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-white border border-[#e5e6ea] text-[#677084]"
              style={{ borderColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      {/* 底部信息栏 */}
      <div className="px-4 py-2 border-t border-[#f0f0f0] flex items-center justify-between">
        <span 
          className="text-xs text-[#adb3be] cursor-help"
          title={absoluteTime}
        >
          {displayTime}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // TODO: 打开更多操作菜单
          }}
          className="p-1 hover:bg-[#f5f5f5] rounded transition-colors"
        >
          <MoreIcon className="w-5 h-5 text-[#adb3be]" />
        </button>
      </div>
    </div>
  );
}

// AI 图标
function AIIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );
}

// 链接图标
function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
    </svg>
  );
}

// 更多图标
function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
      <circle cx="5" cy="12" r="2" />
    </svg>
  );
}

// 系统标签图标
function SystemTagIcon({ type }: { type: keyof typeof SYSTEM_TAGS }) {
  switch (type) {
    case 'ai_link':
      return (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
        </svg>
      );
    case 'image':
      return (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      );
    case 'audio':
      return (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
        </svg>
      );
    case 'video':
      return (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
        </svg>
      );
    default:
      return null;
  }
}
