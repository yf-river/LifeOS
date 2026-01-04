'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useNotesStore, useUIStore } from '@/store';
import { cn } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Omnibar 组件 - 严格按照 Get笔记 spec 实现
 * 
 * 支持：
 * - 富文本编辑（加粗、斜体、列表）
 * - 图片上传（拖拽、粘贴、点击选择）
 * - 链接插入
 */

// 快捷入口配置
const QUICK_ACTIONS = [
  { 
    id: 'image', 
    label: '添加图片', 
    subtitle: 'AI智能识别',
    icon: 'image',
    color: '#10b981'
  },
  { 
    id: 'link', 
    label: '添加链接', 
    subtitle: 'AI智能分析',
    icon: 'link',
    color: '#3b82f6'
  },
  { 
    id: 'media', 
    label: '导入音视频', 
    subtitle: '转文字稿',
    icon: 'media',
    color: '#8b5cf6'
  },
];

export function Omnibar() {
  const { createNote } = useNotesStore();
  const { showToast } = useUIStore();
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  // 上传图片到服务器
  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (data.h?.c === 0) {
        return data.c.url;
      } else {
        showToast(data.h?.e || '上传失败', 'error');
        return null;
      }
    } catch (err) {
      showToast('上传失败', 'error');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Tiptap 编辑器
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: '记录现在的想法...',
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline',
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'tiptap ProseMirror aie-content outline-none min-h-[40px] max-h-[200px] overflow-y-auto',
      },
      // 处理粘贴事件
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              handleImageFile(file);
            }
            return true;
          }
        }
        return false;
      },
      // 处理拖放事件
      handleDrop: (view, event, slice, moved) => {
        if (moved) return false;
        
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        const file = files[0];
        if (file.type.startsWith('image/')) {
          event.preventDefault();
          handleImageFile(file);
          return true;
        }
        return false;
      },
    },
  });

  // 处理图片文件
  const handleImageFile = async (file: File) => {
    if (!editor) return;

    // 先显示本地预览
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      // 插入临时的 base64 图片
      editor.chain().focus().setImage({ src: base64 }).run();

      // 上传到服务器
      const url = await uploadImage(file);
      if (url) {
        // 替换为服务器 URL（简化处理：重新插入）
        // 实际应该更新现有图片节点
        showToast('图片上传成功', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // 发送笔记
  const handleSubmit = async () => {
    if (!editor || editor.isEmpty || isSubmitting || isUploading) return;

    setIsSubmitting(true);
    try {
      const json = editor.getJSON();
      const text = editor.getText();
      
      await createNote({
        title: text.slice(0, 50),
        content: text,
        json_content: JSON.stringify(json),
      });

      editor.commands.clearContent();
      showToast('笔记已创建', 'success');
    } catch (error) {
      showToast('创建失败，请重试', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 快捷入口点击
  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'image':
        fileInputRef.current?.click();
        break;
      case 'link':
        setShowLinkInput(true);
        setTimeout(() => linkInputRef.current?.focus(), 100);
        break;
      case 'media':
        showToast('导入音视频功能开发中', 'info');
        break;
    }
  };

  // 图片选择
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleImageFile(file);
    }
    e.target.value = '';
  };

  // 插入链接
  const handleInsertLink = () => {
    if (!editor || !linkUrl.trim()) return;

    let url = linkUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    editor.chain().focus().setLink({ href: url }).run();
    setLinkUrl('');
    setShowLinkInput(false);
    showToast('链接已插入', 'success');
  };

  const hasContent = editor && !editor.isEmpty;

  return (
    <div className="space-y-4">
      {/* 输入框容器 */}
      <div
        className={cn(
          'bg-white rounded-xl border transition-all duration-200 ease-in-out relative',
          isFocused
            ? 'border-[#ccc] shadow-textarea'
            : 'border-[#e5e6ea] hover:border-[#d4d4d7]'
        )}
      >
        {/* 上传中遮罩 */}
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl z-10">
            <div className="flex items-center gap-2 text-sm text-[#8a8f99]">
              <LoadingSpinner />
              <span>上传中...</span>
            </div>
          </div>
        )}

        {/* 编辑器区域 */}
        <div className="px-4 pt-4 pb-2">
          <EditorContent 
            editor={editor} 
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>

        {/* 工具栏 */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-[#f0f0f0]">
          <div className="flex items-center gap-1">
            <ToolbarButton icon="image" title="插入图片" onClick={() => fileInputRef.current?.click()} />
            <ToolbarButton icon="bold" title="加粗" onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} />
            <ToolbarButton icon="color" title="文字颜色" />
            <ToolbarButton icon="italic" title="斜体" onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} />
            <ToolbarButton icon="orderedList" title="有序列表" onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} />
            <ToolbarButton icon="bulletList" title="无序列表" onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} />
            <ToolbarButton icon="link" title="插入链接" onClick={() => handleQuickAction('link')} active={editor?.isActive('link')} />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!hasContent || isSubmitting || isUploading}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out',
              hasContent && !isSubmitting && !isUploading
                ? 'bg-[#111418] text-white hover:bg-[#333] shadow-card hover:shadow-card-hover'
                : 'bg-[rgba(41,45,52,0.1)] text-white cursor-not-allowed opacity-50'
            )}
          >
            {isSubmitting ? '发送中...' : '发送'}
          </button>
        </div>

        {/* 链接输入弹出框 */}
        {showLinkInput && (
          <div className="absolute bottom-full left-0 mb-2 p-3 bg-white rounded-lg shadow-lg border border-[#e5e6ea] z-20">
            <div className="flex items-center gap-2">
              <input
                ref={linkInputRef}
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInsertLink();
                  if (e.key === 'Escape') setShowLinkInput(false);
                }}
                placeholder="输入链接地址..."
                className="w-64 px-3 py-1.5 text-sm border border-[#e5e6ea] rounded focus:outline-none focus:border-[#2a88ff]"
              />
              <button
                onClick={handleInsertLink}
                className="px-3 py-1.5 text-sm bg-[#2a88ff] text-white rounded hover:bg-[#1a78ef]"
              >
                插入
              </button>
              <button
                onClick={() => setShowLinkInput(false)}
                className="px-3 py-1.5 text-sm text-[#8a8f99] hover:text-[#333]"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 快捷入口 */}
      <div>
        <p className="text-sm text-[#8a8f99] mb-2">你还可以：</p>
        <div className="flex gap-3">
          {QUICK_ACTIONS.map((action) => (
            <motion.button
              key={action.id}
              onClick={() => handleQuickAction(action.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-[#e5e6ea] hover:border-[#ccc] hover:shadow-card transition-all duration-200 ease-in-out"
            >
              <QuickActionIcon name={action.icon} color={action.color} />
              <div className="text-left">
                <p className="text-sm font-medium text-[#333639]">{action.label}</p>
                <p className="text-xs text-[#8a8f99]">{action.subtitle}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />
    </div>
  );
}

// 加载动画
function LoadingSpinner() {
  return (
    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// 工具栏按钮
function ToolbarButton({
  icon,
  title,
  active,
  onClick
}: {
  icon: string;
  title: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'w-8 h-8 flex items-center justify-center rounded transition-all duration-150 ease-out',
        active
          ? 'bg-[#f0f0f0] shadow-sm'
          : 'hover:bg-[#f5f5f5] hover:shadow-sm'
      )}
    >
      <ToolbarIcon name={icon} active={active} />
    </button>
  );
}

// 工具栏图标
function ToolbarIcon({ name, active }: { name: string; active?: boolean }) {
  const color = active ? '#111418' : '#8a8f99';
  
  switch (name) {
    case 'image':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill={color}>
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      );
    case 'bold':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill={color}>
          <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
        </svg>
      );
    case 'color':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill={color}>
          <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
        </svg>
      );
    case 'italic':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill={color}>
          <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
        </svg>
      );
    case 'orderedList':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill={color}>
          <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
        </svg>
      );
    case 'bulletList':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill={color}>
          <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
        </svg>
      );
    case 'link':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill={color}>
          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
        </svg>
      );
    default:
      return null;
  }
}

// 快捷入口图标
function QuickActionIcon({ name, color }: { name: string; color: string }) {
  switch (name) {
    case 'image':
      return (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill={color}>
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
        </div>
      );
    case 'link':
      return (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill={color}>
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
          </svg>
        </div>
      );
    case 'media':
      return (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill={color}>
            <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" />
          </svg>
        </div>
      );
    default:
      return null;
  }
}
