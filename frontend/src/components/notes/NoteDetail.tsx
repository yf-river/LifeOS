'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useNotesStore, useUIStore } from '@/store';
import { cn } from '@/lib/utils';
import debounce from 'lodash.debounce';
import { VersionHistory } from './VersionHistory';

const lowlight = createLowlight(common);

/**
 * 笔记详情页组件 - 严格按照 Get笔记 spec 实现
 * 
 * 结构：
 * ┌────────────────────────────────────────────────────────────────┐
 * │ ← 返回上一页    [追加笔记] [✎ 编辑] [分享笔记] [···]           │
 * ├────────────────────────────────────────────────────────────────┤
 * │                                                                │
 * │  Coze智能体开发实战教程：从入门到精通的10个案例解析             │
 * │  编辑于：2026-01-02 17:38:05                                   │
 * │                                                                │
 * │  标签: [AI链接笔记] [Cos智能体] [大模型应用] [AI插件开发]      │
 * │        [+ 添加标签] [✨ 智能标签]                              │
 * │                                                                │
 * │  ┌──────────────────────────────────────────────────────────┐ │
 * │  │ 🔗 原始链接预览卡片                                       │ │
 * │  └──────────────────────────────────────────────────────────┘ │
 * │                                                                │
 * │  📖 笔记正文内容...                                           │
 * │                                                                │
 * └────────────────────────────────────────────────────────────────┘
 */
export function NoteDetail() {
  const { currentNote, updateNote, setCurrentNote, isSaving } = useNotesStore();
  const { setViewMode, showToast } = useUIStore();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tiptap 编辑器
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: '开始记录你的想法...',
      }),
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
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded-lg',
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: '',
    editable: isEditing,
    editorProps: {
      attributes: {
        class: 'tiptap ProseMirror aie-content prose prose-sm max-w-none focus:outline-none min-h-[200px]',
      },
    },
    onUpdate: ({ editor }) => {
      if (isEditing) {
        debouncedSave(editor.getJSON(), editor.getText());
      }
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
    }
  }, [currentNote?.id, editor]);

  // 更新编辑器可编辑状态
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  // 返回列表
  const handleBack = () => {
    setCurrentNote(null);
    setViewMode('list');
  };

  // 切换编辑模式
  const handleToggleEdit = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // 退出编辑时保存
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
      }
    }
  };

  // 分享
  const handleShare = () => {
    showToast('分享功能开发中', 'info');
  };

  // 导出 Markdown
  const handleExportMarkdown = async () => {
    if (!currentNote) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/export/note/${currentNote.id}/markdown`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) throw new Error('导出失败');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentNote.title || 'note'}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('导出成功', 'success');
      setShowMenu(false);
    } catch (error) {
      showToast('导出失败', 'error');
    }
  };

  // 导出 JSON
  const handleExportJSON = async () => {
    if (!currentNote) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/export/note/${currentNote.id}/json`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) throw new Error('导出失败');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentNote.title || 'note'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('导出成功', 'success');
      setShowMenu(false);
    } catch (error) {
      showToast('导出失败', 'error');
    }
  };

  if (!currentNote) {
    return null;
  }

  // 格式化更新时间
  const formatUpdatedTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `编辑于：${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* 头部工具栏 */}
      <header className="h-[76px] flex items-center justify-between px-6 border-b border-[#e4e4e7]">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-[#333639] hover:text-[#111418] transition-colors"
        >
          <BackIcon className="w-5 h-5" />
          <span className="text-sm">返回上一页</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#333639] hover:bg-[#f5f5f5] rounded-lg transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            追加笔记
          </button>
          <button
            onClick={handleToggleEdit}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors',
              isEditing
                ? 'bg-[#2a88ff] text-white'
                : 'text-[#333639] hover:bg-[#f5f5f5]'
            )}
          >
            <EditIcon className="w-4 h-4" />
            {isEditing ? '保存' : '编辑'}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#333639] hover:bg-[#f5f5f5] rounded-lg transition-colors"
          >
            <ShareIcon className="w-4 h-4" />
            分享笔记
          </button>
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-[#8a8f99] hover:bg-[#f5f5f5] rounded-lg transition-colors"
            >
              <MoreIcon className="w-5 h-5" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-[#e4e4e7] py-1 z-50">
                <button
                  onClick={handleExportMarkdown}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#333639] hover:bg-[#f5f5f5] transition-colors"
                >
                  <DownloadIcon className="w-4 h-4" />
                  导出为 Markdown
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#333639] hover:bg-[#f5f5f5] transition-colors"
                >
                  <DownloadIcon className="w-4 h-4" />
                  导出为 JSON
                </button>
                <div className="h-px bg-[#e4e4e7] my-1" />
                <button
                  onClick={() => {
                    showToast('复制链接功能开发中', 'info');
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#333639] hover:bg-[#f5f5f5] transition-colors"
                >
                  <LinkIcon className="w-4 h-4" />
                  复制链接
                </button>
                <button
                  onClick={() => {
                    setShowVersionHistory(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#333639] hover:bg-[#f5f5f5] transition-colors"
                >
                  <HistoryIcon className="w-4 h-4" />
                  版本历史
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[710px] mx-auto px-6 py-8">
          {/* 标题 */}
          {isEditing ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入标题..."
              className="w-full text-[24px] font-medium text-[#111418] border-none outline-none mb-2"
            />
          ) : (
            <h1 className="text-[24px] font-medium text-[#111418] mb-2">
              {currentNote.title || '无标题笔记'}
            </h1>
          )}

          {/* 更新时间 */}
          <p className="text-xs text-[#8a8f99] mb-4">
            {formatUpdatedTime(currentNote.updated_at)}
            {isSaving && <span className="ml-2">保存中...</span>}
          </p>

          {/* 标签区 */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-[#8a8f99]">标签:</span>
            {currentNote.tags?.map((tag: any) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-white border border-[#e5e6ea] text-[#677084]"
              >
                {tag.name}
              </span>
            ))}
            <button className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-[#8a8f99] hover:text-[#333639] transition-colors">
              <PlusIcon className="w-3 h-3" />
              添加标签
            </button>
            <button className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-[#8a8f99] hover:text-[#333639] transition-colors">
              ✨ 智能标签
            </button>
          </div>

          {/* AI 链接笔记卡片 */}
          {currentNote.note_type === 'ai_link' && currentNote.source_url && (
            <div className="mb-6 p-4 bg-[#f5f7fa] rounded-lg border border-[#e5e6ea]">
              <a
                href={currentNote.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#2a88ff] hover:underline"
              >
                <LinkIcon className="w-4 h-4" />
                <span className="text-sm">{currentNote.source_url}</span>
              </a>
            </div>
          )}

          {/* 编辑器内容 */}
          <div className="prose prose-sm max-w-none">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

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

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
