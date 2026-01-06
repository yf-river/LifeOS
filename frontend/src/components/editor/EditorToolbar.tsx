'use client';

import { useCallback, useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MediaAnalysis } from '../media/MediaAnalysis';

/**
 * 编辑器工具栏 - Get笔记风格
 * 
 * 功能：
 * - 完整格式化工具
 * - 快捷键提示
 * - 悬浮显示工具名称
 * - 分组布局
 */

interface EditorToolbarProps {
  editor: Editor;
}

interface ToolButton {
  id: string;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  action: () => void;
  isActive?: () => boolean;
  disabled?: () => boolean;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showMediaAnalysis, setShowMediaAnalysis] = useState(false);
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  // 添加链接
  const handleAddLink = useCallback(() => {
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
      setLinkUrl('');
      setShowLinkDialog(false);
    }
  }, [editor, linkUrl]);

  // 添加图片
  const handleAddImage = useCallback(() => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageDialog(false);
    }
  }, [editor, imageUrl]);

  // 高亮颜色
  const highlightColors = [
    { name: '黄色', color: '#fef08a' },
    { name: '绿色', color: '#bbf7d0' },
    { name: '蓝色', color: '#bfdbfe' },
    { name: '粉色', color: '#fbcfe8' },
    { name: '紫色', color: '#ddd6fe' },
  ];

  // 工具组定义
  const toolGroups: { id: string; tools: ToolButton[] }[] = [
    {
      id: 'history',
      tools: [
        {
          id: 'undo',
          icon: <UndoIcon />,
          label: '撤销',
          shortcut: '⌘Z',
          action: () => editor.chain().focus().undo().run(),
          disabled: () => !editor.can().undo(),
        },
        {
          id: 'redo',
          icon: <RedoIcon />,
          label: '重做',
          shortcut: '⌘⇧Z',
          action: () => editor.chain().focus().redo().run(),
          disabled: () => !editor.can().redo(),
        },
      ],
    },
    {
      id: 'heading',
      tools: [
        {
          id: 'h1',
          icon: <H1Icon />,
          label: '一级标题',
          shortcut: '⌘⌥1',
          action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          isActive: () => editor.isActive('heading', { level: 1 }),
        },
        {
          id: 'h2',
          icon: <H2Icon />,
          label: '二级标题',
          shortcut: '⌘⌥2',
          action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          isActive: () => editor.isActive('heading', { level: 2 }),
        },
        {
          id: 'h3',
          icon: <H3Icon />,
          label: '三级标题',
          shortcut: '⌘⌥3',
          action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          isActive: () => editor.isActive('heading', { level: 3 }),
        },
      ],
    },
    {
      id: 'format',
      tools: [
        {
          id: 'bold',
          icon: <BoldIcon />,
          label: '加粗',
          shortcut: '⌘B',
          action: () => editor.chain().focus().toggleBold().run(),
          isActive: () => editor.isActive('bold'),
        },
        {
          id: 'italic',
          icon: <ItalicIcon />,
          label: '斜体',
          shortcut: '⌘I',
          action: () => editor.chain().focus().toggleItalic().run(),
          isActive: () => editor.isActive('italic'),
        },
        {
          id: 'underline',
          icon: <UnderlineIcon />,
          label: '下划线',
          shortcut: '⌘U',
          action: () => editor.chain().focus().toggleUnderline().run(),
          isActive: () => editor.isActive('underline'),
        },
        {
          id: 'strike',
          icon: <StrikeIcon />,
          label: '删除线',
          shortcut: '⌘⇧X',
          action: () => editor.chain().focus().toggleStrike().run(),
          isActive: () => editor.isActive('strike'),
        },
        {
          id: 'code',
          icon: <CodeIcon />,
          label: '行内代码',
          shortcut: '⌘E',
          action: () => editor.chain().focus().toggleCode().run(),
          isActive: () => editor.isActive('code'),
        },
      ],
    },
    {
      id: 'list',
      tools: [
        {
          id: 'bulletList',
          icon: <BulletListIcon />,
          label: '无序列表',
          shortcut: '⌘⇧8',
          action: () => editor.chain().focus().toggleBulletList().run(),
          isActive: () => editor.isActive('bulletList'),
        },
        {
          id: 'orderedList',
          icon: <OrderedListIcon />,
          label: '有序列表',
          shortcut: '⌘⇧7',
          action: () => editor.chain().focus().toggleOrderedList().run(),
          isActive: () => editor.isActive('orderedList'),
        },
        // TaskList 暂时禁用，因为 extension 未加载
        // {
        //   id: 'taskList',
        //   icon: <TaskListIcon />,
        //   label: '待办列表',
        //   shortcut: '⌘⇧9',
        //   action: () => editor.chain().focus().toggleTaskList().run(),
        //   isActive: () => editor.isActive('taskList'),
        // },
      ],
    },
    {
      id: 'block',
      tools: [
        {
          id: 'blockquote',
          icon: <QuoteIcon />,
          label: '引用',
          shortcut: '⌘⇧B',
          action: () => editor.chain().focus().toggleBlockquote().run(),
          isActive: () => editor.isActive('blockquote'),
        },
        {
          id: 'codeBlock',
          icon: <CodeBlockIcon />,
          label: '代码块',
          shortcut: '⌘⌥C',
          action: () => editor.chain().focus().toggleCodeBlock().run(),
          isActive: () => editor.isActive('codeBlock'),
        },
        {
          id: 'horizontalRule',
          icon: <HorizontalRuleIcon />,
          label: '分割线',
          action: () => editor.chain().focus().setHorizontalRule().run(),
        },
      ],
    },
    {
      id: 'insert',
      tools: [
        {
          id: 'link',
          icon: <LinkIcon />,
          label: '链接',
          shortcut: '⌘K',
          action: () => setShowLinkDialog(true),
          isActive: () => editor.isActive('link'),
        },
        {
          id: 'image',
          icon: <ImageIcon />,
          label: '图片',
          action: () => setShowImageDialog(true),
        },
        {
          id: 'table',
          icon: <TableIcon />,
          label: '表格',
          action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
        },
      ],
    },
    {
      id: 'ai',
      tools: [
        {
          id: 'media-analysis',
          icon: <AIIcon />,
          label: 'AI 分析',
          shortcut: '⌘⇧A',
          action: () => setShowMediaAnalysis(!showMediaAnalysis),
          isActive: () => showMediaAnalysis,
        },
      ],
    },
  ];

  return (
    <div className="relative">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[#e8e8e8] bg-[#fafafa] overflow-x-auto">
        {toolGroups.map((group, groupIdx) => (
          <div key={group.id} className="flex items-center">
            {groupIdx > 0 && (
              <div className="w-px h-5 bg-[#e4e4e7] mx-2" />
            )}
            <div className="flex items-center gap-0.5">
              {group.tools.map((tool) => (
                <div key={tool.id} className="relative">
                  <motion.button
                    onClick={tool.action}
                    disabled={tool.disabled?.()}
                    onMouseEnter={() => setHoveredTool(tool.id)}
                    onMouseLeave={() => setHoveredTool(null)}
                    className={cn(
                      'p-2 rounded-lg transition-all',
                      tool.isActive?.()
                        ? 'bg-[#111418] text-white'
                        : 'hover:bg-[#f0f0f0] text-[#5a5f6b]',
                      tool.disabled?.() && 'opacity-40 cursor-not-allowed'
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {tool.icon}
                  </motion.button>
                  
                  {/* 工具提示 */}
                  {hoveredTool === tool.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-[#111418] text-white text-[11px] rounded-lg whitespace-nowrap z-50 shadow-lg"
                    >
                      <span>{tool.label}</span>
                      {tool.shortcut && (
                        <span className="ml-2 text-[#8a8f99]">{tool.shortcut}</span>
                      )}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* 高亮颜色选择 */}
        <div className="w-px h-5 bg-[#e4e4e7] mx-2" />
        <div className="relative group">
          <motion.button
            className={cn(
              'p-2 rounded-lg transition-all',
              editor.isActive('highlight')
                ? 'bg-[#111418] text-white'
                : 'hover:bg-[#f0f0f0] text-[#5a5f6b]'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <HighlightIcon />
          </motion.button>
          
          {/* 颜色选择器 */}
          <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-xl shadow-lg border border-[#e8e8e8] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="flex gap-1">
              {highlightColors.map((item) => (
                <button
                  key={item.color}
                  className="w-6 h-6 rounded-lg border border-[#e8e8e8] hover:scale-110 transition-transform"
                  style={{ backgroundColor: item.color }}
                  onClick={() =>
                    editor.chain().focus().toggleHighlight({ color: item.color }).run()
                  }
                  title={item.name}
                />
              ))}
              <button
                className="w-6 h-6 rounded-lg border border-[#e8e8e8] flex items-center justify-center text-[#8a8f99] hover:bg-[#f5f5f5]"
                onClick={() => editor.chain().focus().unsetHighlight().run()}
                title="清除高亮"
              >
                <CloseIcon className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 链接对话框 */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-6 w-[400px]"
          >
            <h3 className="text-[16px] font-semibold text-[#111418] mb-4">添加链接</h3>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 border border-[#e5e6ea] rounded-xl text-[14px] focus:outline-none focus:border-[#3b82f6] mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLinkDialog(false)}
                className="px-4 py-2 text-[14px] text-[#5a5f6b] hover:bg-[#f5f5f5] rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddLink}
                className="px-4 py-2 text-[14px] bg-[#111418] text-white rounded-lg hover:bg-[#333] transition-colors"
              >
                确定
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 图片对话框 */}
      {showImageDialog && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-6 w-[400px]"
          >
            <h3 className="text-[16px] font-semibold text-[#111418] mb-4">添加图片</h3>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="图片URL"
              className="w-full px-4 py-3 border border-[#e5e6ea] rounded-xl text-[14px] focus:outline-none focus:border-[#3b82f6] mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleAddImage()}
              autoFocus
            />
            <p className="text-[12px] text-[#8a8f99] mb-4">
              支持拖拽图片到编辑器或从剪贴板粘贴
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImageDialog(false)}
                className="px-4 py-2 text-[14px] text-[#5a5f6b] hover:bg-[#f5f5f5] rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddImage}
                className="px-4 py-2 text-[14px] bg-[#111418] text-white rounded-lg hover:bg-[#333] transition-colors"
              >
                确定
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 多媒体 AI 分析面板 */}
      {showMediaAnalysis && (
        <div className="absolute top-full left-0 right-0 mt-2 mx-4 z-50">
          <MediaAnalysis
            onInsertText={(text) => {
              editor.chain().focus().insertContent(text).run();
              setShowMediaAnalysis(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

// Icons - 统一 16x16 尺寸
const iconClass = "w-4 h-4";

function UndoIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
    </svg>
  );
}

function H1Icon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h8" />
      <path d="M4 18V6" />
      <path d="M12 18V6" />
      <path d="M17 12l3-2v8" />
    </svg>
  );
}

function H2Icon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h8" />
      <path d="M4 18V6" />
      <path d="M12 18V6" />
      <path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" />
    </svg>
  );
}

function H3Icon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h8" />
      <path d="M4 18V6" />
      <path d="M12 18V6" />
      <path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2" />
      <path d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2" />
    </svg>
  );
}

function BoldIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  );
}

function UnderlineIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v6a6 6 0 0 0 12 0V4" />
      <line x1="4" y1="20" x2="20" y2="20" />
    </svg>
  );
}

function StrikeIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.3 4.9c-2.3-.6-4.4-1-6.2-.9-2.7 0-5.3.7-5.3 3.6 0 1.5 1.8 3.3 3.6 3.9h.2" />
      <path d="M8.5 15c.6.9 1.6 1.9 3 2.3 3.6 1 7.1-.5 7.1-3.5 0-.5-.1-.9-.3-1.3" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function BulletListIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

function OrderedListIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <path d="M4 6h1v4" />
      <path d="M4 10h2" />
      <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </svg>
  );
}

function TaskListIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="6" height="6" rx="1" />
      <path d="M3 17l2 2 4-4" />
      <line x1="13" y1="8" x2="21" y2="8" />
      <line x1="13" y1="16" x2="21" y2="16" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3" />
    </svg>
  );
}

function CodeBlockIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <polyline points="9 9 5 12 9 15" />
      <polyline points="15 9 19 12 15 15" />
    </svg>
  );
}

function HorizontalRuleIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

function AIIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
      <circle cx="8" cy="14" r="1" fill="currentColor" />
      <circle cx="16" cy="14" r="1" fill="currentColor" />
      <path d="M9 18h6" />
    </svg>
  );
}

function HighlightIcon() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l-6 6v3h9l3-3" />
      <path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
