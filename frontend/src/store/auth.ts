import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api';

interface User {
  id: string;
  email: string;
  nickname: string;
  avatar?: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          // apiClient 返回的已经是 c 的内容（业务数据）
          const data = await apiClient.post<LoginResponse>('/auth/login', { email, password });
          const { token, user } = data;
          set({ token, user, isLoading: false });
          localStorage.setItem('token', token);
        } catch (err: unknown) {
          const error = err as Error;
          set({ error: error.message || '登录失败', isLoading: false });
        }
      },

      register: async (email: string, password: string, nickname?: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await apiClient.post<LoginResponse>('/auth/register', { email, password, nickname });
          const { token, user } = data;
          set({ token, user, isLoading: false });
          localStorage.setItem('token', token);
        } catch (err: unknown) {
          const error = err as Error;
          set({ error: error.message || '注册失败', isLoading: false });
        }
      },

      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem('token');
      },

      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
          const user = await apiClient.put<User>('/user/profile', data);
          set({ user: { ...get().user!, ...user }, isLoading: false });
        } catch (err: unknown) {
          const error = err as Error;
          set({ error: error.message || '更新失败', isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
