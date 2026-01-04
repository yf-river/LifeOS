'use client';

import { useState, useEffect } from 'react';
import { useNotesStore, useUIStore } from '@/store';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';

interface NoteVersion {
  id: string;
  note_id: string;
  version: number;
  title: string;
  content: string | null;
  json_content: string | null;
  change_type: 'create' | 'update' | 'restore';
  change_summary: string | null;
  created_at: string;
}

interface VersionHistoryProps {
  noteId: string;
  onClose: () => void;
}

export function VersionHistory({ noteId, onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null);
  const [diffLines, setDiffLines] = useState<string[] | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDiffLoading, setIsDiffLoading] = useState(false);
  const { fetchNotes, setCurrentNote } = useNotesStore();
  const { showToast } = useUIStore();

  // 加载版本历史
  useEffect(() => {
    const loadVersions = async () => {
      try {
        const response = await apiClient.get<{
          list: NoteVersion[];
          total: number;
        }>(`/notes/${noteId}/versions?page_size=50`);
        setVersions(response.list || []);
      } catch (error) {
        showToast('加载版本历史失败', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadVersions();
  }, [noteId, showToast]);

  // 加载版本详情
  const handleSelectVersion = async (versionId: string) => {
    setIsDiffLoading(true);
    setDiffLines(null);
    try {
      const response = await apiClient.get<NoteVersion>(`/notes/${noteId}/versions/${versionId}`);
      setSelectedVersion(response);
      // 加载与当前版本的 diff
      const diffResp = await apiClient.get<{ diff: string[] }>(`/notes/${noteId}/versions/${versionId}/diff`);
      setDiffLines(diffResp.diff || []);
    } catch (error) {
      showToast('加载版本详情或差异失败', 'error');
    } finally {
      setIsDiffLoading(false);
    }
  };

  // 恢复版本
  const handleRestore = async () => {
    if (!selectedVersion) return;

    const confirmed = window.confirm(
      `确定要恢复到版本 ${selectedVersion.version} 吗？当前内容将被保存为新版本。`
    );

    if (!confirmed) return;

    setIsRestoring(true);
    try {
      const response = await apiClient.post<{ message: string; note: any }>(
        `/notes/${noteId}/versions/${selectedVersion.id}/restore`,
        {}
      );
      
      showToast(response.message || '恢复成功', 'success');
      
      // 更新当前笔记
      setCurrentNote(response.note);
      
      // 刷新版本列表
      const versionsResponse = await apiClient.get<{
        list: NoteVersion[];
      }>(`/notes/${noteId}/versions?page_size=50`);
      setVersions(versionsResponse.list || []);
      
      setSelectedVersion(null);
    } catch (error) {
      showToast('恢复失败', 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;

    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 变更类型标签
  const getChangeTypeLabel = (type: string) => {
    switch (type) {
      case 'create':
        return { text: '创建', color: 'bg-green-100 text-green-700' };
      case 'restore':
        return { text: '恢复', color: 'bg-blue-100 text-blue-700' };
      default:
        return { text: '更新', color: 'bg-gray-100 text-gray-700' };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[900px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e4e4e7]">
          <h2 className="text-lg font-medium text-[#111418]">版本历史</h2>
          <button
            onClick={onClose}
            className="p-2 text-[#8a8f99] hover:bg-[#f5f5f5] rounded-lg transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* 版本列表 */}
          <div className="w-[300px] border-r border-[#e4e4e7] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <span className="text-sm text-[#8a8f99]">加载中...</span>
              </div>
            ) : versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-[#8a8f99]">
                <HistoryIcon className="w-8 h-8 mb-2" />
                <span className="text-sm">暂无版本记录</span>
              </div>
            ) : (
              <div className="divide-y divide-[#e4e4e7]">
                {versions.map((version) => {
                  const changeType = getChangeTypeLabel(version.change_type);
                  return (
                    <button
                      key={version.id}
                      onClick={() => handleSelectVersion(version.id)}
                      className={cn(
                        'w-full px-4 py-3 text-left hover:bg-[#f5f5f5] transition-colors',
                        selectedVersion?.id === version.id && 'bg-[#eef4ff]'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[#333639]">
                          版本 {version.version}
                        </span>
                        <span
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded',
                            changeType.color
                          )}
                        >
                          {changeType.text}
                        </span>
                      </div>
                      <p className="text-xs text-[#8a8f99]">
                        {formatDate(version.created_at)}
                      </p>
                      {version.change_summary && (
                        <p className="text-xs text-[#666] mt-1 truncate">
                          {version.change_summary}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 版本预览 */}
          <div className="flex-1 flex flex-col">
            {selectedVersion ? (
              <>
                <div className="px-6 py-4 border-b border-[#e4e4e7] bg-[#fafafa]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-[#333639]">
                        {selectedVersion.title || '无标题'}
                      </h3>
                      <p className="text-xs text-[#8a8f99] mt-1">
                        版本 {selectedVersion.version} · {formatDate(selectedVersion.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={handleRestore}
                      disabled={isRestoring}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#2a88ff] text-white text-sm rounded-lg hover:bg-[#1a78ef] transition-colors disabled:opacity-50"
                    >
                      <RestoreIcon className="w-4 h-4" />
                      {isRestoring ? '恢复中...' : '恢复此版本'}
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div>
                    <p className="text-xs text-[#8a8f99] mb-2">与当前版本的差异</p>
                    {isDiffLoading ? (
                      <p className="text-sm text-[#8a8f99]">加载差异中...</p>
                    ) : diffLines && diffLines.length > 0 ? (
                      <pre className="whitespace-pre-wrap text-xs font-mono bg-[#0b1021] text-[#e5e7eb] p-3 rounded-lg overflow-auto">
                        {diffLines.map((line, idx) => {
                          const first = line.slice(0, 1);
                          const color = first === '+' ? 'text-[#22c55e]' : first === '-' ? 'text-[#ef4444]' : 'text-[#e5e7eb]';
                          return (
                            <div key={idx} className={color}>{line}</div>
                          );
                        })}
                      </pre>
                    ) : (
                      <p className="text-sm text-[#8a8f99]">无差异或内容为空</p>
                    )}
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <p className="text-xs text-[#8a8f99] mb-2">版本内容</p>
                    {selectedVersion.content ? (
                      <pre className="whitespace-pre-wrap text-sm text-[#333639] font-sans">
                        {selectedVersion.content}
                      </pre>
                    ) : (
                      <p className="text-[#8a8f99]">内容为空</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[#8a8f99]">
                <HistoryIcon className="w-12 h-12 mb-3" />
                <p className="text-sm">选择一个版本查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Icons
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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

function RestoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
