'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { CustomImage } from '@/components/editor/extensions/CustomImage';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
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
  const { showToast, setViewMode } = useUIStore();
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

  // 文本格式下拉框状态
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const formatDropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(event.target as Node)) {
        setShowFormatDropdown(false);
      }
    };
    if (showFormatDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showFormatDropdown]);



  // Tiptap 编辑器
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder: '记录现在的想法...',
      }),
      CustomImage,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline',
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none min-h-[120px] aie-content',
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
      // 插入临时的 base64 图片，并在图片后添加两个空段落
      editor.chain()
        .focus()
        .insertContent([
          {
            type: 'image',
            attrs: { src: base64 },
          },
          {
            type: 'paragraph',
          },
          {
            type: 'paragraph',
          },
        ])
        .run();

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
      
      const newNote = await createNote({
        title: text.slice(0, 50),
        content: text,
        json_content: JSON.stringify(json),
      });

      if (newNote) {
        editor.commands.clearContent();
        showToast('笔记已创建', 'success');
      } else {
        // createNote 返回 null 表示创建失败，错误信息已在 store 中设置
        showToast('创建失败，请重试', 'error');
      }
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
          'bg-white rounded-xl transition-all duration-200 ease-out relative',
          isFocused
            ? 'shadow-xl shadow-gray-200/80'
            : 'shadow-md shadow-gray-100/80 hover:shadow-lg'
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
        <div className="relative px-4 pt-4 pb-2 max-h-[40vh] overflow-y-auto">
          {/* 放大按钮 */}
          <button
            onClick={async () => {
              if (!editor) return;
              
              const text = editor.getText();
              const json = editor.getJSON();
              
              // 创建新笔记并跳转到详情页
              const newNote = await createNote({
                title: text.slice(0, 50) || '新笔记',
                content: text,
                json_content: JSON.stringify(json),
              });
              
              if (newNote) {
                // 清空编辑器
                editor.commands.clearContent();
                // 切换到详情视图
                setViewMode('detail');
              }
            }}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
            title="全屏编辑"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
          
          <EditorContent 
            editor={editor} 
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>

        {/* 工具栏 */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-1">
            {/* 插入图片 */}
            <ToolbarButton 
              icon="image" 
              tooltip="插入图片"
              onClick={() => fileInputRef.current?.click()}
              tooltipAlign="left"
            />
            
            <div className="w-px h-5 bg-gray-200 mx-0.5" />
            
            {/* 文本格式下拉框 */}
            <div className="relative" ref={formatDropdownRef}>
              <ToolbarButton 
                icon="textFormat" 
                tooltip="切换文本格式"
                onClick={() => setShowFormatDropdown(!showFormatDropdown)} 
                active={editor?.isActive('heading')}
                hasDropdown
              />
              {showFormatDropdown && (
                <div className="absolute bottom-full left-0 mb-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[140px]">
                  <button
                    onClick={() => {
                      editor?.chain().focus().setParagraph().run();
                      setShowFormatDropdown(false);
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-3',
                      !editor?.isActive('heading') && 'bg-gray-50'
                    )}
                  >
                    <span className="text-gray-400 w-7 text-base">T</span>
                    <span className="text-sm text-gray-700">正文</span>
                  </button>
                  <button
                    onClick={() => {
                      editor?.chain().focus().toggleHeading({ level: 1 }).run();
                      setShowFormatDropdown(false);
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-3',
                      editor?.isActive('heading', { level: 1 }) && 'bg-gray-50'
                    )}
                  >
                    <span className="text-gray-400 w-7 text-lg font-semibold">H1</span>
                    <span className="text-base font-semibold text-gray-700">标题 1</span>
                  </button>
                  <button
                    onClick={() => {
                      editor?.chain().focus().toggleHeading({ level: 2 }).run();
                      setShowFormatDropdown(false);
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-3',
                      editor?.isActive('heading', { level: 2 }) && 'bg-gray-50'
                    )}
                  >
                    <span className="text-gray-400 w-7 text-base font-semibold">H2</span>
                    <span className="text-sm font-medium text-gray-700">标题 2</span>
                  </button>
                  <button
                    onClick={() => {
                      editor?.chain().focus().toggleHeading({ level: 3 }).run();
                      setShowFormatDropdown(false);
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-3',
                      editor?.isActive('heading', { level: 3 }) && 'bg-gray-50'
                    )}
                  >
                    <span className="text-gray-400 w-7 text-sm font-medium">H3</span>
                    <span className="text-sm text-gray-700">标题 3</span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="w-px h-5 bg-gray-200 mx-0.5" />
            
            {/* 加粗 */}
            <ToolbarButton 
              icon="bold" 
              tooltip="加粗 Ctrl+B"
              onClick={() => editor?.chain().focus().toggleBold().run()} 
              active={editor?.isActive('bold')} 
            />
            
            {/* 斜体 */}
            <ToolbarButton 
              icon="italic" 
              tooltip="斜体 Ctrl+I"
              onClick={() => editor?.chain().focus().toggleItalic().run()} 
              active={editor?.isActive('italic')} 
            />
            
            {/* 下划线 */}
            <ToolbarButton 
              icon="underline" 
              tooltip="下划线 Ctrl+U"
              onClick={() => editor?.chain().focus().toggleUnderline().run()} 
              active={editor?.isActive('underline')} 
            />
            
            {/* 引用 */}
            <ToolbarButton 
              icon="quote" 
              tooltip="引用"
              onClick={() => editor?.chain().focus().toggleBlockquote().run()} 
              active={editor?.isActive('blockquote')} 
            />
            
            {/* 有序列表 */}
            <ToolbarButton 
              icon="orderedList" 
              tooltip="有序列表"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()} 
              active={editor?.isActive('orderedList')} 
            />
            
            {/* 无序列表 */}
            <ToolbarButton 
              icon="bulletList" 
              tooltip="无序列表"
              onClick={() => editor?.chain().focus().toggleBulletList().run()} 
              active={editor?.isActive('bulletList')} 
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!hasContent || isSubmitting || isUploading}
            className={cn(
              'px-5 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
              'hover:scale-105 active:scale-95',
              hasContent && !isSubmitting && !isUploading
                ? 'bg-gray-900 text-white hover:bg-black'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed hover:scale-100'
            )}
          >
            {isSubmitting ? (
              <LoadingSpinner />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 快捷入口 */}
      <div>
        <p className="text-sm text-gray-500 mb-3 font-medium">你还可以：</p>
        <div className="grid grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <motion.button
              key={action.id}
              onClick={() => handleQuickAction(action.id)}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                'flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl',
                'border border-gray-200 hover:border-gray-300',
                'hover:shadow-lg transition-all duration-200',
                'group relative overflow-hidden'
              )}
            >
              {/* 悬浮背景渐变 */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ 
                  background: `linear-gradient(135deg, ${action.color}10 0%, ${action.color}05 100%)` 
                }}
              />
              
              <div className="relative z-10 flex items-center gap-3 w-full">
                <QuickActionIcon name={action.icon} color={action.color} />
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-gray-800 transition-colors">
                    {action.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{action.subtitle}</p>
                </div>
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

// 工具栏按钮（带自定义 tooltip）
function ToolbarButton({
  icon,
  tooltip,
  active,
  onClick,
  hasDropdown,
  tooltipAlign = 'center'
}: {
  icon: string;
  tooltip: string;
  active?: boolean;
  onClick?: () => void;
  hasDropdown?: boolean;
  tooltipAlign?: 'left' | 'center' | 'right';
}) {
  const tooltipPositionClass = {
    left: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    right: 'right-0'
  }[tooltipAlign];
  
  const arrowPositionClass = {
    left: 'left-4',
    center: 'left-1/2 -translate-x-1/2',
    right: 'right-4'
  }[tooltipAlign];

  return (
    <div className="relative group/btn">
      <button
        onClick={onClick}
        className={cn(
          'w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200',
          'hover:bg-gray-100 active:scale-95',
          active && 'bg-gray-200'
        )}
      >
        <ToolbarIcon name={icon} active={active} />
        {hasDropdown && (
          <svg className="w-3 h-3 ml-0.5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z" />
          </svg>
        )}
      </button>
      {/* 自定义 Tooltip */}
      <div className={cn(
        "absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none z-50",
        tooltipPositionClass
      )}>
        {tooltip}
        <div className={cn("absolute top-full border-4 border-transparent border-t-gray-900", arrowPositionClass)} />
      </div>
    </div>
  );
}

// 工具栏图标
function ToolbarIcon({ name, active }: { name: string; active?: boolean }) {
  const color = active ? '#1f2937' : '#4b5563';
  
  switch (name) {
    case 'textFormat':
      return (
        <span className="text-base font-medium" style={{ color }}>T</span>
      );
    case 'bold':
      return (
        <span className="text-base font-bold" style={{ color }}>B</span>
      );
    case 'italic':
      return (
        <span className="text-base italic font-serif" style={{ color }}>I</span>
      );
    case 'underline':
      return (
        <span className="text-base underline" style={{ color }}>U</span>
      );
    case 'quote':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={color}>
          <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
        </svg>
      );
    case 'orderedList':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={color}>
          <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
        </svg>
      );
    case 'bulletList':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={color}>
          <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
        </svg>
      );
    case 'image':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={color}>
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      );
    case 'link':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={color}>
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
