'use client';

import { useState, useMemo } from 'react';
import { useTagsStore, Tag } from '@/store';
import { cn } from '@/lib/utils';

/**
 * 标签管理页面组件
 * 
 * 功能：
 * 1. 查看所有标签列表
 * 2. 创建新标签
 * 3. 重命名标签
 * 4. 修改标签颜色
 * 5. 删除标签
 * 6. 合并标签
 */

// 预设颜色
const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#666666', // gray
];

interface EditingTag {
  id: string;
  name: string;
  color: string;
}

export function TagManager() {
  const { tags, isLoading, createTag, updateTag, deleteTag, mergeTags, fetchTags } = useTagsStore();
  
  const [editingTag, setEditingTag] = useState<EditingTag | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const [mergeSource, setMergeSource] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'count' | 'date'>('count');

  // 过滤和排序标签
  const filteredTags = useMemo(() => {
    let result = [...tags];
    
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(query));
    }
    
    // 排序
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
        break;
      case 'count':
        result.sort((a, b) => (b.note_count || 0) - (a.note_count || 0));
        break;
      case 'date':
        result.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        break;
    }
    
    return result;
  }, [tags, searchQuery, sortBy]);

  // 创建标签
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    const result = await createTag(newTagName.trim(), newTagColor);
    if (result) {
      setNewTagName('');
      setNewTagColor('#3b82f6');
      setShowNewTagForm(false);
    }
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingTag || !editingTag.name.trim()) return;
    
    const success = await updateTag(editingTag.id, {
      name: editingTag.name.trim(),
      color: editingTag.color,
    });
    
    if (success) {
      setEditingTag(null);
    }
  };

  // 删除标签
  const handleDelete = async (id: string) => {
    const tag = tags.find(t => t.id === id);
    if (!tag) return;
    
    const confirmed = window.confirm(
      `确定要删除标签「${tag.name}」吗？${tag.note_count ? `该标签下有 ${tag.note_count} 篇笔记。` : ''}`
    );
    
    if (confirmed) {
      await deleteTag(id);
    }
  };

  // 合并标签
  const handleMerge = async (targetId: string) => {
    if (!mergeSource || mergeSource === targetId) return;
    
    const sourceTag = tags.find(t => t.id === mergeSource);
    const targetTag = tags.find(t => t.id === targetId);
    if (!sourceTag || !targetTag) return;
    
    const confirmed = window.confirm(
      `确定要将标签「${sourceTag.name}」合并到「${targetTag.name}」吗？\n合并后「${sourceTag.name}」将被删除，其下的笔记将自动添加「${targetTag.name}」标签。`
    );
    
    if (confirmed) {
      const result = await mergeTags(mergeSource, targetId);
      if (result) {
        setMergeSource(null);
        // 可以显示成功提示
      }
    }
  };

  // 取消合并模式
  const cancelMerge = () => {
    setMergeSource(null);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 页面头部 */}
      <header className="h-[76px] flex items-center justify-between px-6 border-b border-[#e4e4e7]">
        <div className="flex items-center gap-4">
          <h1 className="text-[24px] font-medium text-[#111418]">标签管理</h1>
          <span className="text-sm text-[#8a8f99]">
            共 {tags.length} 个标签
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 搜索框 */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8f99]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索标签..."
              className="pl-9 pr-4 py-2 w-[200px] text-sm border border-[#e4e4e7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2a88ff]/20 focus:border-[#2a88ff]"
            />
          </div>
          
          {/* 排序 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 text-sm border border-[#e4e4e7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2a88ff]/20 focus:border-[#2a88ff]"
          >
            <option value="count">按使用次数</option>
            <option value="name">按名称</option>
            <option value="date">按创建时间</option>
          </select>
          
          {/* 新建标签按钮 */}
          <button
            onClick={() => setShowNewTagForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2a88ff] text-white text-sm font-medium rounded-lg hover:bg-[#1a78ef] transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            新建标签
          </button>
        </div>
      </header>

      {/* 合并模式提示 */}
      {mergeSource && (
        <div className="px-6 py-3 bg-[#fef3c7] border-b border-[#fcd34d] flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-[#92400e]">
            <MergeIcon className="w-4 h-4" />
            <span>
              正在合并标签「{tags.find(t => t.id === mergeSource)?.name}」，请选择目标标签
            </span>
          </div>
          <button
            onClick={cancelMerge}
            className="text-sm text-[#92400e] hover:underline"
          >
            取消
          </button>
        </div>
      )}

      {/* 新建标签表单 */}
      {showNewTagForm && (
        <div className="px-6 py-4 border-b border-[#e4e4e7] bg-[#fafafa]">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm text-[#666] mb-1">标签名称</label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="输入标签名称..."
                className="w-full px-3 py-2 text-sm border border-[#e4e4e7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2a88ff]/20 focus:border-[#2a88ff]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateTag();
                  if (e.key === 'Escape') setShowNewTagForm(false);
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm text-[#666] mb-1">颜色</label>
              <div className="flex items-center gap-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewTagColor(color)}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 transition-transform',
                      newTagColor === color ? 'border-[#111418] scale-110' : 'border-transparent'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewTagForm(false)}
                className="px-3 py-2 text-sm text-[#666] hover:bg-[#e4e4e7] rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateTag}
                disabled={!newTagName.trim()}
                className="px-3 py-2 text-sm bg-[#2a88ff] text-white rounded-lg hover:bg-[#1a78ef] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 标签列表 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <span className="text-sm text-[#8a8f99]">加载中...</span>
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-[#8a8f99]">
            {searchQuery ? (
              <>
                <SearchIcon className="w-8 h-8 mb-2" />
                <span className="text-sm">未找到匹配的标签</span>
              </>
            ) : (
              <>
                <TagIcon className="w-8 h-8 mb-2" />
                <span className="text-sm">暂无标签</span>
                <button
                  onClick={() => setShowNewTagForm(true)}
                  className="mt-2 text-sm text-[#2a88ff] hover:underline"
                >
                  创建第一个标签
                </button>
              </>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-[#fafafa] border-b border-[#e4e4e7]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#8a8f99] uppercase tracking-wider">
                  标签
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#8a8f99] uppercase tracking-wider">
                  笔记数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#8a8f99] uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#8a8f99] uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e4e7]">
              {filteredTags.map((tag) => (
                <TagRow
                  key={tag.id}
                  tag={tag}
                  isEditing={editingTag?.id === tag.id}
                  editingData={editingTag}
                  isMergeSource={mergeSource === tag.id}
                  isMergeMode={mergeSource !== null}
                  onEdit={() => setEditingTag({ id: tag.id, name: tag.name, color: tag.color || '#666666' })}
                  onEditChange={(data) => setEditingTag(data)}
                  onSave={handleSaveEdit}
                  onCancelEdit={() => setEditingTag(null)}
                  onDelete={() => handleDelete(tag.id)}
                  onStartMerge={() => setMergeSource(tag.id)}
                  onMerge={() => handleMerge(tag.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// 标签行组件
interface TagRowProps {
  tag: Tag;
  isEditing: boolean;
  editingData: EditingTag | null;
  isMergeSource: boolean;
  isMergeMode: boolean;
  onEdit: () => void;
  onEditChange: (data: EditingTag) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onStartMerge: () => void;
  onMerge: () => void;
}

function TagRow({
  tag,
  isEditing,
  editingData,
  isMergeSource,
  isMergeMode,
  onEdit,
  onEditChange,
  onSave,
  onCancelEdit,
  onDelete,
  onStartMerge,
  onMerge,
}: TagRowProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <tr className={cn(
      'hover:bg-[#fafafa] transition-colors',
      isMergeSource && 'bg-[#fef3c7]',
      isMergeMode && !isMergeSource && 'cursor-pointer hover:bg-[#dbeafe]'
    )}
    onClick={() => {
      if (isMergeMode && !isMergeSource) {
        onMerge();
      }
    }}
    >
      <td className="px-6 py-4">
        {isEditing && editingData ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditChange({ ...editingData, color });
                  }}
                  className={cn(
                    'w-5 h-5 rounded-full border-2 transition-transform',
                    editingData.color === color ? 'border-[#111418] scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <input
              type="text"
              value={editingData.name}
              onChange={(e) => onEditChange({ ...editingData, name: e.target.value })}
              className="flex-1 px-2 py-1 text-sm border border-[#e4e4e7] rounded focus:outline-none focus:ring-2 focus:ring-[#2a88ff]/20 focus:border-[#2a88ff]"
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') onSave();
                if (e.key === 'Escape') onCancelEdit();
              }}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: tag.color || '#666666' }}
            />
            <span className="text-sm font-medium text-[#333639]">{tag.name}</span>
          </div>
        )}
      </td>
      
      <td className="px-6 py-4">
        <span className="text-sm text-[#8a8f99]">{tag.note_count || 0}</span>
      </td>
      
      <td className="px-6 py-4">
        <span className="text-sm text-[#8a8f99]">{formatDate(tag.created_at)}</span>
      </td>
      
      <td className="px-6 py-4 text-right">
        {!isMergeMode && (
          <div className="flex items-center justify-end gap-1">
            {isEditing ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancelEdit();
                  }}
                  className="p-1.5 text-[#8a8f99] hover:bg-[#e4e4e7] rounded transition-colors"
                  title="取消"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSave();
                  }}
                  className="p-1.5 text-[#22c55e] hover:bg-[#dcfce7] rounded transition-colors"
                  title="保存"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="p-1.5 text-[#8a8f99] hover:bg-[#e4e4e7] rounded transition-colors"
                  title="编辑"
                >
                  <EditIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartMerge();
                  }}
                  className="p-1.5 text-[#8a8f99] hover:bg-[#e4e4e7] rounded transition-colors"
                  title="合并到其他标签"
                >
                  <MergeIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-1.5 text-[#8a8f99] hover:bg-[#fee2e2] hover:text-[#ef4444] rounded transition-colors"
                  title="删除"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

// Icons
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z" />
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

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function MergeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
