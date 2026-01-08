'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { common, createLowlight } from 'lowlight';
import { CustomImage } from '@/components/editor/extensions/CustomImage';
import { useNotesStore, useUIStore } from '@/store';
import { cn } from '@/lib/utils';
import debounce from 'lodash.debounce';
import { VersionHistory } from './VersionHistory';

const lowlight = createLowlight(common);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * 笔记详情页编辑器组件 - 沉浸式书写体验
 * 
 * 布局结构：
 * ┌────────────────────────────────────────────────────────────────┐
 * │ ← 返回上一页                              [取消]  [保存(⌘+S)] │
 * ├────────────────────────────────────────────────────────────────┤
 * │ ↺ ↻ │ 📷 │ B I U │ <> ☑ 🔗 │ 正文▼ │ ☰ ≡ ⇐ ⇒ │ 66 {} ⊞     │
 * ├────────────────────────────────────────────────────────────────┤
 * │                                                                │
 * │  请输入标题                                                    │
 * │                                                                │
 * │  标签: [+ 添加标签]                                           │
 * │                                                                │
 * │  记录现在的想法...                                            │
 * │                                                                │
 * └────────────────────────────────────────────────────────────────┘
 */
export function NoteDetail() {
  const { currentNote, updateNote, setCurrentNote, isSaving } = useNotesStore();
  const { setViewMode, showToast } = useUIStore();
  const [title, setTitle] = useState('');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const formatDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

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
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: '记录现在的想法...',
      }),
      Underline,
      TaskItem.configure({
        nested: true,
      }),
      TaskList,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#2a88ff] underline cursor-pointer',
        },
      }),
      CustomImage,
      Highlight.configure({
        multicolor: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '',
    editable: true,
    editorProps: {
      attributes: {
        class: 'tiptap ProseMirror aie-content prose prose-sm max-w-none focus:outline-none min-h-[400px]',
      },
    },
    onUpdate: ({ editor }) => {
      setHasUnsavedChanges(true);
      debouncedSave(editor.getJSON(), editor.getText());
    },
  });

  // 防抖保存
  const debouncedSave = useCallback(
    debounce((json: any, text: string) => {
      if (currentNote && currentNote.version) {
        updateNote(
          currentNote.id,
          {
            title,
            content: text,
            json_content: JSON.stringify(json),
          },
          currentNote.version
        );
        setHasUnsavedChanges(false);
      }
    }, 1000),
    [currentNote, title, updateNote]
  );

  // 加载笔记内容
  useEffect(() => {
    if (currentNote && editor) {
      setTitle(currentNote.title || '');
      
      try {
        const content = currentNote.json_content
          ? JSON.parse(currentNote.json_content)
          : { type: 'doc', content: [{ type: 'paragraph' }] };
        editor.commands.setContent(content);
      } catch (e) {
        editor.commands.setContent(currentNote.content || '');
      }
      
      // 自动聚焦到编辑器
      setTimeout(() => {
        if (!currentNote.title) {
          // 如果没有标题，聚焦到标题输入框
          titleInputRef.current?.focus();
        } else {
          // 否则聚焦到编辑器
          editor.commands.focus('end');
        }
      }, 100);
    }
  }, [currentNote?.id, editor]);

  // 手动保存
  const handleSave = useCallback(() => {
    if (editor && currentNote) {
      updateNote(
        currentNote.id,
        {
          title,
          content: editor.getText(),
          json_content: JSON.stringify(editor.getJSON()),
        },
        currentNote.version
      );
      setHasUnsavedChanges(false);
      showToast('保存成功', 'success');
    }
  }, [editor, currentNote, title, updateNote, showToast]);

  // 快捷键保存 (⌘+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // 返回列表
  const handleBack = () => {
    if (hasUnsavedChanges) {
      handleSave();
    }
    setCurrentNote(null);
    setViewMode('list');
  };

  // 取消编辑
  const handleCancel = () => {
    setCurrentNote(null);
    setViewMode('list');
  };

  // 处理图片文件
  const handleImageFile = async (file: File) => {
    if (!editor) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
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
        ])
        .run();

      const url = await uploadImage(file);
      if (url) {
        showToast('图片上传成功', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // 图片选择
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleImageFile(file);
    }
    e.target.value = '';
  };

  // 插入表格
  const handleInsertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  if (!currentNote) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 顶部导航栏 */}
      <header>
        <div className="max-w-[900px] mx-auto px-6 py-4 flex items-center justify-between border-b border-[#e4e4e7]">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 text-[#333639] hover:bg-[#f5f5f5] rounded-lg border border-[#e4e4e7] transition-colors"
          >
            <BackIcon className="w-4 h-4" />
            <span className="text-sm">返回上一页</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-[#333639] hover:bg-[#f5f5f5] rounded-lg border border-[#e4e4e7] transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm text-white bg-[#333639] hover:bg-[#1f2937] rounded-lg transition-colors flex items-center gap-2"
            >
              <span>保存</span>
              <span className="text-xs opacity-70">(⌘+S)</span>
            </button>
          </div>
        </div>
      </header>

      {/* 工具栏 */}
      <div className="bg-white">
        <div className="max-w-[900px] mx-auto px-6 py-2 flex flex-wrap items-center gap-1 border-b border-[#e4e4e7]">
        {/* 撤销/重做 */}
        <ToolbarButton
          icon="undo"
          tooltip="撤销"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
        />
        <ToolbarButton
          icon="redo"
          tooltip="重做"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
        />

        <ToolbarDivider />

        {/* 图片 */}
        <ToolbarButton
          icon="image"
          tooltip="插入图片"
          onClick={() => fileInputRef.current?.click()}
        />

        <ToolbarDivider />

        {/* 文本格式 */}
        <ToolbarButton
          icon="bold"
          tooltip="加粗 (⌘+B)"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          active={editor?.isActive('bold')}
        />
        <ToolbarButton
          icon="italic"
          tooltip="斜体 (⌘+I)"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          active={editor?.isActive('italic')}
        />
        <ToolbarButton
          icon="underline"
          tooltip="下划线 (⌘+U)"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          active={editor?.isActive('underline')}
        />

        <ToolbarDivider />

        {/* 代码/任务/链接 */}
        <ToolbarButton
          icon="code"
          tooltip="行内代码"
          onClick={() => editor?.chain().focus().toggleCode().run()}
          active={editor?.isActive('code')}
        />
        <ToolbarButton
          icon="task"
          tooltip="待办事项"
          onClick={() => editor?.chain().focus().toggleTaskList().run()}
          active={editor?.isActive('taskList')}
        />
        <ToolbarButton
          icon="link"
          tooltip="插入链接"
          onClick={() => {
            const url = window.prompt('请输入链接地址:');
            if (url) {
              editor?.chain().focus().setLink({ href: url }).run();
            }
          }}
          active={editor?.isActive('link')}
        />

        <ToolbarDivider />

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
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-[#e4e4e7] py-1 z-50 min-w-[140px]">
              <button
                onClick={() => {
                  editor?.chain().focus().setParagraph().run();
                  setShowFormatDropdown(false);
                }}
                className={cn(
                  'w-full px-3 py-2 text-left hover:bg-[#f5f5f5] flex items-center gap-3',
                  !editor?.isActive('heading') && 'bg-[#f5f5f5]'
                )}
              >
                <span className="text-[#8a8f99] w-7 text-base">T</span>
                <span className="text-sm text-[#333639]">正文</span>
              </button>
              <button
                onClick={() => {
                  editor?.chain().focus().toggleHeading({ level: 1 }).run();
                  setShowFormatDropdown(false);
                }}
                className={cn(
                  'w-full px-3 py-2 text-left hover:bg-[#f5f5f5] flex items-center gap-3',
                  editor?.isActive('heading', { level: 1 }) && 'bg-[#f5f5f5]'
                )}
              >
                <span className="text-[#8a8f99] w-7 text-lg font-semibold">H1</span>
                <span className="text-base font-semibold text-[#333639]">标题 1</span>
              </button>
              <button
                onClick={() => {
                  editor?.chain().focus().toggleHeading({ level: 2 }).run();
                  setShowFormatDropdown(false);
                }}
                className={cn(
                  'w-full px-3 py-2 text-left hover:bg-[#f5f5f5] flex items-center gap-3',
                  editor?.isActive('heading', { level: 2 }) && 'bg-[#f5f5f5]'
                )}
              >
                <span className="text-[#8a8f99] w-7 text-base font-semibold">H2</span>
                <span className="text-sm font-medium text-[#333639]">标题 2</span>
              </button>
              <button
                onClick={() => {
                  editor?.chain().focus().toggleHeading({ level: 3 }).run();
                  setShowFormatDropdown(false);
                }}
                className={cn(
                  'w-full px-3 py-2 text-left hover:bg-[#f5f5f5] flex items-center gap-3',
                  editor?.isActive('heading', { level: 3 }) && 'bg-[#f5f5f5]'
                )}
              >
                <span className="text-[#8a8f99] w-7 text-sm font-medium">H3</span>
                <span className="text-sm text-[#333639]">标题 3</span>
              </button>
            </div>
          )}
        </div>

        <ToolbarDivider />

        {/* 列表 */}
        <ToolbarButton
          icon="bulletList"
          tooltip="无序列表"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          active={editor?.isActive('bulletList')}
        />
        <ToolbarButton
          icon="orderedList"
          tooltip="有序列表"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          active={editor?.isActive('orderedList')}
        />
        <ToolbarButton
          icon="outdent"
          tooltip="减少缩进"
          onClick={() => editor?.chain().focus().liftListItem('listItem').run()}
        />
        <ToolbarButton
          icon="indent"
          tooltip="增加缩进"
          onClick={() => editor?.chain().focus().sinkListItem('listItem').run()}
        />

        <ToolbarDivider />

        {/* 引用/代码块/表格 */}
        <ToolbarButton
          icon="quote"
          tooltip="引用"
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          active={editor?.isActive('blockquote')}
        />
        <ToolbarButton
          icon="codeBlock"
          tooltip="代码块"
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          active={editor?.isActive('codeBlock')}
        />
        <ToolbarButton
          icon="table"
          tooltip="插入表格"
          onClick={handleInsertTable}
        />
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[900px] mx-auto px-6 py-8">
          {/* 标题输入框 */}
          <input
            ref={titleInputRef}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasUnsavedChanges(true);
            }}
            placeholder="请输入标题"
            className="w-full text-[28px] font-medium text-[#333639] placeholder-[#c4c6cc] border-none outline-none mb-4"
          />

          {/* 标签区 */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-[#8a8f99]">标签:</span>
            {currentNote.tags?.map((tag: any) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-[#f5f5f5] border border-[#e5e6ea] text-[#677084]"
              >
                {tag.name}
              </span>
            ))}
            <button className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#8a8f99] hover:text-[#333639] hover:bg-[#f5f5f5] rounded-full border border-dashed border-[#d4d6dc] transition-colors">
              <PlusIcon className="w-3 h-3" />
              添加标签
            </button>
          </div>

          {/* 编辑器内容 */}
          <div className="prose prose-sm max-w-none">
            <EditorContent editor={editor} />
          </div>

          {/* 保存状态提示 */}
          {isSaving && (
            <div className="fixed bottom-6 right-6 px-4 py-2 bg-[#333639] text-white text-sm rounded-lg shadow-lg">
              保存中...
            </div>
          )}
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

      {/* 版本历史弹窗 */}
      {showVersionHistory && currentNote && (
        <VersionHistory
          noteId={currentNote.id}
          onClose={() => setShowVersionHistory(false)}
        />
      )}
    </div>
  );
}

// 工具栏分隔线
function ToolbarDivider() {
  return <div className="w-px h-6 bg-[#e4e4e7] mx-1.5" />;
}

// 工具栏按钮
function ToolbarButton({
  icon,
  tooltip,
  active,
  disabled,
  onClick,
  hasDropdown,
}: {
  icon: string;
  tooltip: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  hasDropdown?: boolean;
}) {
  return (
    <div className="relative group/btn">
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'w-9 h-9 flex items-center justify-center rounded transition-all duration-200',
          'hover:bg-[#f5f5f5] active:scale-95',
          active && 'bg-[#e8e8e8]',
          disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent'
        )}
      >
        <ToolbarIcon name={icon} active={active} />
        {hasDropdown && (
          <svg className="w-3 h-3 ml-0.5 text-[#8a8f99]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z" />
          </svg>
        )}
      </button>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#333639] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none z-50">
        {tooltip}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#333639]" />
      </div>
    </div>
  );
}

// 工具栏图标
function ToolbarIcon({ name, active }: { name: string; active?: boolean }) {
  const color = active ? '#1f2937' : '#6b7280';

  switch (name) {
    case 'undo':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4" />
        </svg>
      );
    case 'redo':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 00-5 5v2m15-7l-4-4m4 4l-4 4" />
        </svg>
      );
    case 'image':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={color}>
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      );
    case 'bold':
      return <span className="text-base font-bold" style={{ color }}>B</span>;
    case 'italic':
      return <span className="text-base italic font-serif" style={{ color }}>I</span>;
    case 'underline':
      return <span className="text-base underline" style={{ color }}>U</span>;
    case 'code':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 6l-4 6 4 6m8-12l4 6-4 6" />
        </svg>
      );
    case 'task':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    case 'link':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={color}>
          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
        </svg>
      );
    case 'textFormat':
      return <span className="text-sm font-medium" style={{ color }}>正文</span>;
    case 'bulletList':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={color}>
          <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
        </svg>
      );
    case 'orderedList':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={color}>
          <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
        </svg>
      );
    case 'outdent':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={color}>
          <path d="M11 17h10v-2H11v2zm-8-5l4 4V8l-4 4zm0 9h18v-2H3v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z" />
        </svg>
      );
    case 'indent':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={color}>
          <path d="M3 21h18v-2H3v2zM3 8v8l4-4-4-4zm8 9h10v-2H11v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z" />
        </svg>
      );
    case 'quote':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={color}>
          <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
        </svg>
      );
    case 'codeBlock':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <path d="M8 8l-2 4 2 4m8-8l2 4-2 4" />
        </svg>
      );
    case 'table':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
      );
    default:
      return null;
  }
}

// Icons
function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}
