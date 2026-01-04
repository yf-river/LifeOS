import { create } from 'zustand';
import { apiClient } from '@/lib/api';

export interface Tag {
  id: string;
  name: string;
  color?: string;
  type?: 'system' | 'user';
  note_count?: number;
  created_at?: string;
}

interface MergeResult {
  merged_count: number;
  target_tag: Tag;
}

interface TagsState {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTags: () => Promise<void>;
  createTag: (name: string, color?: string) => Promise<Tag | null>;
  updateTag: (id: string, data: Partial<Tag>) => Promise<boolean>;
  deleteTag: (id: string) => Promise<boolean>;
  mergeTags: (sourceId: string, targetId: string) => Promise<MergeResult | null>;
  addTagToNote: (noteId: string, tagIds: string[]) => Promise<boolean>;
  removeTagFromNote: (noteId: string, tagId: string) => Promise<boolean>;
  clearError: () => void;
}

export const useTagsStore = create<TagsState>((set) => ({
  tags: [],
  isLoading: false,
  error: null,

  fetchTags: async () => {
    set({ isLoading: true, error: null });
    try {
      const tags = await apiClient.get<Tag[]>('/tags');
      set({ tags, isLoading: false });
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message || '获取标签失败', isLoading: false });
    }
  },

  createTag: async (name: string, color?: string) => {
    try {
      const newTag = await apiClient.post<Tag>('/tags', { name, color });
      set((state) => ({ tags: [...state.tags, newTag] }));
      return newTag;
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message || '创建标签失败' });
      return null;
    }
  },

  updateTag: async (id: string, data: Partial<Tag>) => {
    try {
      await apiClient.put(`/tags/${id}`, data);
      set((state) => ({
        tags: state.tags.map((t) => (t.id === id ? { ...t, ...data } : t)),
      }));
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message || '更新标签失败' });
      return false;
    }
  },

  deleteTag: async (id: string) => {
    try {
      await apiClient.delete(`/tags/${id}`);
      set((state) => ({
        tags: state.tags.filter((t) => t.id !== id),
      }));
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message || '删除标签失败' });
      return false;
    }
  },

  mergeTags: async (sourceId: string, targetId: string) => {
    try {
      const result = await apiClient.post<MergeResult>(`/tags/${sourceId}/merge/${targetId}`, {});
      // 移除源标签，更新目标标签
      set((state) => ({
        tags: state.tags
          .filter((t) => t.id !== sourceId)
          .map((t) => (t.id === targetId ? result.target_tag : t)),
      }));
      return result;
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message || '合并标签失败' });
      return null;
    }
  },

  addTagToNote: async (noteId: string, tagIds: string[]) => {
    try {
      await apiClient.post(`/notes/${noteId}/tags`, { tag_ids: tagIds });
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message || '添加标签失败' });
      return false;
    }
  },

  removeTagFromNote: async (noteId: string, tagId: string) => {
    try {
      await apiClient.delete(`/notes/${noteId}/tags/${tagId}`);
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message || '移除标签失败' });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
