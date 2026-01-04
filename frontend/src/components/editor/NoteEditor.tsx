'use client';

import { useEffect, useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
// TaskList 和 TaskItem 暂时移除，因为 @tiptap/extension-task-item 依赖有问题
// import TaskList from '@tiptap/extension-task-list';
// import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useNotesStore, useUIStore } from '@/store';
import { EditorToolbar } from './EditorToolbar';
import { EditorHeader } from './EditorHeader';
import { LinkPreview } from './extensions/LinkPreview';
import { cn } from '@/lib/utils';
import debounce from 'lodash.debounce';

const lowlight = createLowlight(common);

export function NoteEditor() {
  const { currentNote, updateNote, isSaving } = useNotesStore();
  const { editorFullscreen } = useUIStore();
  const [title, setTitle] = useState('');
  const [lastSavedVersion, setLastSavedVersion] = useState(0);

  // 初始化编辑器
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: '开始记录你的想法...',
      }),
      // TaskList 和 TaskItem 暂时禁用
      // TaskList,
      // TaskItem.configure({
      //   nested: true,
      // }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
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
      LinkPreview,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[calc(100vh-200px)]',
      },
    },
    onUpdate: ({ editor }) => {
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
      }
    }, 1000),
    [currentNote, title, updateNote]
  );

  // 加载笔记内容
  useEffect(() => {
    if (currentNote && editor) {
      setTitle(currentNote.title || '');
      setLastSavedVersion(currentNote.version);
      
      try {
        const content = currentNote.json_content
          ? JSON.parse(currentNote.json_content)
          : { type: 'doc', content: [{ type: 'paragraph' }] };
        editor.commands.setContent(content);
      } catch (e) {
        // 如果 JSON 解析失败，使用纯文本
        editor.commands.setContent(currentNote.content || '');
      }
    }
  }, [currentNote?.id, editor]);

  // 标题变更保存
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      if (currentNote) {
        debounce(() => {
          updateNote(
            currentNote.id,
            { title: newTitle },
            currentNote.version
          );
        }, 500)();
      }
    },
    [currentNote, updateNote]
  );

  // 无笔记选中状态
  if (!currentNote) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium mb-2">选择或创建一篇笔记</h3>
          <p className="text-sm">
            点击左侧笔记列表或按 <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘ N</kbd> 新建
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-background',
        editorFullscreen && 'fixed inset-0 z-40'
      )}
    >
      {/* 编辑器头部 */}
      <EditorHeader
        title={title}
        onTitleChange={handleTitleChange}
        isSaving={isSaving}
        note={currentNote}
      />

      {/* 工具栏 */}
      {editor && <EditorToolbar editor={editor} />}

      {/* 编辑器内容 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-6">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
