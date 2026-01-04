'use client';

import { useState } from 'react';
import { useNotesStore, useTagsStore, useUIStore, Note } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  MoreHorizontalIcon,
  PinIcon,
  PinOffIcon,
  TagIcon,
  TrashIcon,
  MaximizeIcon,
  MinimizeIcon,
  SaveIcon,
  Loader2Icon,
  XIcon,
  PlusIcon,
} from 'lucide-react';

interface EditorHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  isSaving: boolean;
  note: Note;
}

export function EditorHeader({
  title,
  onTitleChange,
  isSaving,
  note,
}: EditorHeaderProps) {
  const { updateNote, deleteNote, setCurrentNote } = useNotesStore();
  const { tags, createTag, addTagToNote, removeTagFromNote } = useTagsStore();
  const { editorFullscreen, toggleEditorFullscreen, showConfirmDialog } = useUIStore();
  
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // 切换置顶
  const handleTogglePin = async () => {
    await updateNote(note.id, { is_pinned: !note.is_pinned }, note.version);
  };

  // 删除笔记
  const handleDelete = () => {
    showConfirmDialog({
      title: '确认删除',
      message: '确定要删除这篇笔记吗？此操作不可恢复。',
      onConfirm: async () => {
        const success = await deleteNote(note.id);
        if (success) {
          setCurrentNote(null);
        }
      },
    });
  };

  // 添加标签
  const handleAddTag = async (tagId: string) => {
    if (note.tags?.some((t) => t.id === tagId)) return;
    await addTagToNote(note.id, [tagId]);
    // 刷新笔记数据
    useNotesStore.getState().fetchNote(note.id);
  };

  // 移除标签
  const handleRemoveTag = async (tagId: string) => {
    await removeTagFromNote(note.id, tagId);
    useNotesStore.getState().fetchNote(note.id);
  };

  // 创建新标签
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const tag = await createTag(newTagName.trim());
    if (tag) {
      await handleAddTag(tag.id);
      setNewTagName('');
    }
  };

  return (
    <div className="flex-shrink-0 border-b border-border">
      {/* 标题输入 */}
      <div className="px-8 pt-6 pb-2">
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="无标题笔记"
          className="text-2xl font-bold border-0 shadow-none focus-visible:ring-0 px-0 h-auto"
        />
      </div>

      {/* 工具行 */}
      <div className="px-8 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* 标签 */}
          <div className="flex items-center gap-1 flex-wrap">
            {note.tags?.map((tag) => (
              <Badge
                key={tag.id}
                variant="tag"
                className="group"
                style={{ borderColor: tag.color }}
              >
                {tag.name}
                <button
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            
            {/* 添加标签按钮 */}
            <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <TagIcon className="h-3 w-3 mr-1" />
                  添加标签
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>管理标签</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* 创建新标签 */}
                  <div className="flex gap-2">
                    <Input
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="新标签名称"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                    />
                    <Button onClick={handleCreateTag} size="icon">
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* 可选标签列表 */}
                  <div className="flex flex-wrap gap-2">
                    {tags
                      .filter((tag) => !note.tags?.some((t) => t.id === tag.id))
                      .map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="cursor-pointer hover:bg-accent"
                          style={{ borderColor: tag.color }}
                          onClick={() => handleAddTag(tag.id)}
                        >
                          <PlusIcon className="h-3 w-3 mr-1" />
                          {tag.name}
                        </Badge>
                      ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* 保存状态 */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
            {isSaving ? (
              <>
                <Loader2Icon className="h-3 w-3 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <SaveIcon className="h-3 w-3" />
                已保存
              </>
            )}
          </div>

          {/* 置顶 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleTogglePin}
            className="h-8 w-8"
            title={note.is_pinned ? '取消置顶' : '置顶'}
          >
            {note.is_pinned ? (
              <PinOffIcon className="h-4 w-4 text-primary" />
            ) : (
              <PinIcon className="h-4 w-4" />
            )}
          </Button>

          {/* 全屏 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleEditorFullscreen}
            className="h-8 w-8"
            title={editorFullscreen ? '退出全屏' : '全屏'}
          >
            {editorFullscreen ? (
              <MinimizeIcon className="h-4 w-4" />
            ) : (
              <MaximizeIcon className="h-4 w-4" />
            )}
          </Button>

          {/* 删除 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-8 w-8 text-destructive hover:text-destructive"
            title="删除笔记"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
