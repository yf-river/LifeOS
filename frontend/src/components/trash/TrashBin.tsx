'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/store';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';

interface TrashNote {
  id: string;
  title: string | null;
  content: string | null;
  deleted_at: string;
  created_at: string;
  tags?: Array<{ id: string; name: string; color: string }>;
}

export function TrashBin() {
  const [notes, setNotes] = useState<TrashNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { showToast } = useUIStore();

  // 加载回收站
  const loadTrash = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ list: TrashNote[] }>('/trash?page_size=100');
      setNotes(response.list || []);
    } catch (error) {
      showToast('加载回收站失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, []);

  // 恢复笔记
  const handleRestore = async (noteId: string) => {
    try {
      await apiClient.post(`/trash/${noteId}/restore`, {});
      showToast('笔记已恢复', 'success');
      setNotes(notes.filter(n => n.id !== noteId));
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(noteId);
        return newSet;
      });
    } catch (error) {
      showToast('恢复失败', 'error');
    }
  };

  // 永久删除
  const handleDelete = async (noteId: string) => {
    const confirmed = window.confirm('确定要永久删除这篇笔记吗？此操作不可恢复。');
    if (!confirmed) return;

    try {
      await apiClient.delete(`/trash/${noteId}`);
      showToast('笔记已永久删除', 'success');
      setNotes(notes.filter(n => n.id !== noteId));
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(noteId);
        return newSet;
      });
    } catch (error) {
      showToast('删除失败', 'error');
    }
  };

  // 批量恢复
  const handleBatchRestore = async () => {
    if (selectedIds.size === 0) return;

    const promises = Array.from(selectedIds).map(id => 
      apiClient.post(`/trash/${id}/restore`, {})
    );

    try {
      await Promise.all(promises);
      showToast(`已恢复 ${selectedIds.size} 篇笔记`, 'success');
      setNotes(notes.filter(n => !selectedIds.has(n.id)));
      setSelectedIds(new Set());
    } catch (error) {
      showToast('部分笔记恢复失败', 'error');
      loadTrash();
    }
  };

  // 清空回收站
  const handleEmptyTrash = async () => {
    const confirmed = window.confirm(
      `确定要清空回收站吗？这将永久删除 ${notes.length} 篇笔记，此操作不可恢复。`
    );
    if (!confirmed) return;

    try {
      await apiClient.delete('/trash');
      showToast('回收站已清空', 'success');
      setNotes([]);
      setSelectedIds(new Set());
    } catch (error) {
      showToast('清空失败', 'error');
    }
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedIds.size === notes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notes.map(n => n.id)));
    }
  };

  // 切换选择
  const toggleSelect = (noteId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 计算剩余天数（假设 30 天后自动删除）
  const getDaysRemaining = (deletedAt: string) => {
    const deleted = new Date(deletedAt);
    const expiry = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const days = Math.ceil((expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, days);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 页面头部 */}
      <header className="h-[76px] flex items-center justify-between px-6 border-b border-[#e4e4e7]">
        <div className="flex items-center gap-4">
          <h1 className="text-[24px] font-medium text-[#111418]">回收站</h1>
          <span className="text-sm text-[#8a8f99]">
            共 {notes.length} 篇笔记
          </span>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <>
              <button
                onClick={handleBatchRestore}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#22c55e] bg-[#dcfce7] rounded-lg hover:bg-[#bbf7d0] transition-colors"
              >
                <RestoreIcon className="w-4 h-4" />
                恢复选中 ({selectedIds.size})
              </button>
            </>
          )}
          {notes.length > 0 && (
            <button
              onClick={handleEmptyTrash}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#ef4444] bg-[#fee2e2] rounded-lg hover:bg-[#fecaca] transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              清空回收站
            </button>
          )}
        </div>
      </header>

      {/* 提示信息 */}
      <div className="px-6 py-3 bg-[#fef3c7] border-b border-[#fcd34d] text-sm text-[#92400e]">
        回收站中的笔记将在 30 天后自动永久删除
      </div>

      {/* 笔记列表 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <span className="text-sm text-[#8a8f99]">加载中...</span>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#8a8f99]">
            <TrashEmptyIcon className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium mb-2">回收站是空的</p>
            <p className="text-sm">删除的笔记会出现在这里</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-[#fafafa] border-b border-[#e4e4e7]">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === notes.length && notes.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-[#e4e4e7]"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8a8f99] uppercase tracking-wider">
                  标题
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8a8f99] uppercase tracking-wider">
                  删除时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8a8f99] uppercase tracking-wider">
                  剩余天数
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#8a8f99] uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e4e7]">
              {notes.map((note) => {
                const isSelected = selectedIds.has(note.id);
                const daysRemaining = getDaysRemaining(note.deleted_at);

                return (
                  <tr
                    key={note.id}
                    className={cn(
                      'hover:bg-[#fafafa] transition-colors',
                      isSelected && 'bg-[#eef4ff]'
                    )}
                  >
                    <td className="w-12 px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(note.id)}
                        className="w-4 h-4 rounded border-[#e4e4e7]"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-[#333639] truncate max-w-[300px]">
                          {note.title || '无标题笔记'}
                        </p>
                        {note.content && (
                          <p className="text-xs text-[#8a8f99] truncate max-w-[300px] mt-1">
                            {note.content.slice(0, 100)}
                          </p>
                        )}
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            {note.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag.id}
                                className="text-xs px-1.5 py-0.5 rounded bg-[#f5f5f5] text-[#666]"
                              >
                                {tag.name}
                              </span>
                            ))}
                            {note.tags.length > 3 && (
                              <span className="text-xs text-[#8a8f99]">
                                +{note.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-[#8a8f99]">
                        {formatDate(note.deleted_at)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          'text-sm',
                          daysRemaining <= 7 ? 'text-[#ef4444]' : 'text-[#8a8f99]'
                        )}
                      >
                        {daysRemaining} 天
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRestore(note.id)}
                          className="p-1.5 text-[#22c55e] hover:bg-[#dcfce7] rounded transition-colors"
                          title="恢复"
                        >
                          <RestoreIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="p-1.5 text-[#ef4444] hover:bg-[#fee2e2] rounded transition-colors"
                          title="永久删除"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Icons
function RestoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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

function TrashEmptyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}
