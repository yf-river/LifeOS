'use client';

import { useCallback, useState } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListOrderedIcon,
  CheckSquareIcon,
  QuoteIcon,
  LinkIcon,
  ImageIcon,
  HighlighterIcon,
  UndoIcon,
  RedoIcon,
  MinusIcon,
  FileCodeIcon,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

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
      setLinkDialogOpen(false);
    }
  }, [editor, linkUrl]);

  // 添加图片
  const handleAddImage = useCallback(() => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setImageDialogOpen(false);
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

  return (
    <div className="flex items-center gap-0.5 px-8 py-2 border-b border-border bg-muted/30 flex-wrap">
      {/* 撤销/重做 */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <UndoIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <RedoIcon className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* 标题 */}
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', editor.isActive('heading', { level: 1 }) && 'bg-accent')}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1Icon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', editor.isActive('heading', { level: 2 }) && 'bg-accent')}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2Icon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', editor.isActive('heading', { level: 3 }) && 'bg-accent')}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3Icon className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* 文本格式 */}
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', editor.isActive('bold') && 'bg-accent')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <BoldIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', editor.isActive('italic') && 'bg-accent')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <ItalicIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', editor.isActive('strike') && 'bg-accent')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <StrikethroughIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', editor.isActive('code') && 'bg-accent')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <CodeIcon className="h-4 w-4" />
      </Button>

      {/* 高亮 */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', editor.isActive('highlight') && 'bg-accent')}
          >
            <HighlighterIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="flex gap-1">
            {highlightColors.map((item) => (
              <button
                key={item.color}
                className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: item.color }}
                onClick={() =>
                  editor.chain().focus().toggleHighlight({ color: item.color }).run()
                }
                title={item.name}
              />
            ))}
            <button
              className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-accent"
              onClick={() => editor.chain().focus().unsetHighlight().run()}
              title="清除高亮"
            >
              ✕
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <div className="w-px h-6 bg-border mx-1" />

      {/* 列表 */}
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', editor.isActive('bulletList') && 'bg-accent')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', editor.isActive('orderedList') && 'bg-accent')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrderedIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', editor.isActive('taskList') && 'bg-accent')}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <CheckSquareIcon className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* 引用和代码块 */}
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', editor.isActive('blockquote') && 'bg-accent')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <QuoteIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', editor.isActive('codeBlock') && 'bg-accent')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <FileCodeIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <MinusIcon className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* 链接 */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', editor.isActive('link') && 'bg-accent')}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>添加链接</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
            />
            <Button onClick={handleAddLink}>确定</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 图片 */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ImageIcon className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>添加图片</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="图片URL或拖拽上传"
              onKeyDown={(e) => e.key === 'Enter' && handleAddImage()}
            />
            <Button onClick={handleAddImage}>确定</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
