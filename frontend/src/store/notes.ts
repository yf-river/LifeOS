import { create } from 'zustand';
import { apiClient } from '@/lib/api';

export interface Tag {
  id: string;
  name: string;
  color?: string;
  type?: 'system' | 'user';
  note_count?: number;
}

export interface Attachment {
  id: string;
  type: 'image' | 'audio' | 'video' | 'file';
  url: string;
  thumbnail_url?: string;
  file_name: string;
  file_size: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  json_content: string;
  is_pinned: boolean;
  version: number;
  
  // 笔记类型
  note_type?: 'text' | 'image' | 'ai_link' | 'audio' | 'video';
  ai_generated?: boolean;
  
  // AI 链接笔记
  source_url?: string;
  ai_summary?: string;
  
  // 音视频笔记
  media_url?: string;
  media_duration?: number;
  
  // 图片
  images?: string[];
  
  // 标签
  tags: Tag[];
  
  // 附件
  attachments?: Attachment[];
  
  // 时间
  created_at: string;
  updated_at: string;
}

interface NotesState {
  notes: Note[];
  currentNote: Note | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // 分页
  total: number;
  page: number;
  pageSize: number;
  
  // 过滤
  filterTagId: string | null;
  filterPinned: boolean;
  searchKeyword: string;
  
  // 版本冲突
  conflictData: Note | null;
  
  // Actions
  fetchNotes: (page?: number) => Promise<void>;
  fetchNote: (id: string) => Promise<void>;
  createNote: (data: Partial<Note>) => Promise<Note | null>;
  updateNote: (id: string, data: Partial<Note>, version: number) => Promise<boolean>;
  deleteNote: (id: string) => Promise<boolean>;
  searchNotes: (keyword: string) => Promise<void>;
  
  // UI Actions
  setCurrentNote: (note: Note | null) => void;
  setFilterTag: (tagId: string | null) => void;
  setFilterPinned: (pinned: boolean) => void;
  clearConflict: () => void;
  resolveConflict: (useServer: boolean) => void;
  clearError: () => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  currentNote: null,
  isLoading: false,
  isSaving: false,
  error: null,
  total: 0,
  page: 1,
  pageSize: 20,
  filterTagId: null,
  filterPinned: false,
  searchKeyword: '',
  conflictData: null,

  fetchNotes: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const { filterTagId, filterPinned, pageSize } = get();
      const params: Record<string, unknown> = { page, page_size: pageSize };
      if (filterTagId) params.tag_id = filterTagId;
      if (filterPinned) params.is_pinned = 'true';
      
      const notes = await apiClient.get<Note[]>('/notes', params);
      set({
        notes,
        page,
        isLoading: false,
      });
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message || '获取笔记列表失败', isLoading: false });
    }
  },

  fetchNote: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const note = await apiClient.get<Note>(`/notes/${id}`);
      set({ currentNote: note, isLoading: false });
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message || '获取笔记失败', isLoading: false });
    }
  },

  createNote: async (data: Partial<Note>) => {
    set({ isSaving: true, error: null });
    try {
      const result = await apiClient.post<{ id: string; version: number }>('/notes', data);
      const newNote: Note = {
        id: result.id,
        title: data.title || '',
        content: data.content || '',
        json_content: data.json_content || '{"type":"doc","content":[]}',
        is_pinned: false,
        version: result.version,
        tags: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...data,
      };
      set((state) => ({
        notes: [newNote, ...state.notes],
        currentNote: newNote,
        isSaving: false,
      }));
      return newNote;
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message || '创建笔记失败', isSaving: false });
      return null;
    }
  },

  updateNote: async (id: string, data: Partial<Note>, version: number) => {
    set({ isSaving: true, error: null });
    try {
      const result = await apiClient.put<{ version: number }>(`/notes/${id}`, { ...data, version });
      set((state) => ({
        notes: state.notes.map((n) =>
          n.id === id ? { ...n, ...data, version: result.version, updated_at: new Date().toISOString() } : n
        ),
        currentNote: state.currentNote?.id === id
          ? { ...state.currentNote, ...data, version: result.version, updated_at: new Date().toISOString() }
          : state.currentNote,
        isSaving: false,
      }));
      return true;
    } catch (err: unknown) {
      const error = err as Error & { isVersionConflict?: boolean };
      if (error.isVersionConflict) {
        // 版本冲突，复制当前内容到剪贴板
        if (data.content) {
          try {
            await navigator.clipboard.writeText(data.content);
          } catch (e) {
            console.error('复制到剪贴板失败', e);
          }
        }
        set({
          isSaving: false,
          error: '检测到版本冲突，您的内容已复制到剪贴板',
        });
      } else {
        set({ error: error.message || '更新笔记失败', isSaving: false });
      }
      return false;
    }
  },

  deleteNote: async (id: string) => {
    try {
      await apiClient.delete(`/notes/${id}`);
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        currentNote: state.currentNote?.id === id ? null : state.currentNote,
      }));
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message || '删除笔记失败' });
      return false;
    }
  },

  searchNotes: async (keyword: string) => {
    set({ isLoading: true, searchKeyword: keyword });
    try {
      const notes = await apiClient.get<Note[]>('/notes/search', { q: keyword });
      set({
        notes,
        isLoading: false,
      });
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message || '搜索失败', isLoading: false });
    }
  },

  setCurrentNote: (note) => set({ currentNote: note }),
  setFilterTag: (tagId) => set({ filterTagId: tagId }),
  setFilterPinned: (pinned) => set({ filterPinned: pinned }),
  
  clearConflict: () => set({ conflictData: null }),
  
  resolveConflict: (useServer: boolean) => {
    const { conflictData } = get();
    if (useServer && conflictData) {
      // 使用服务器版本
      set((state) => ({
        currentNote: conflictData,
        notes: state.notes.map((n) =>
          n.id === conflictData.id ? conflictData : n
        ),
        conflictData: null,
      }));
    } else {
      // 用户选择保留本地（冲突数据已在剪贴板）
      set({ conflictData: null });
    }
  },
  
  clearError: () => set({ error: null }),
}));
