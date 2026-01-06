import { create } from 'zustand';

interface UIState {
  // 侧边栏
  sidebarOpen: boolean;
  
  // AI 面板
  aiPanelOpen: boolean;
  
  // 视图模式
  viewMode: 'list' | 'detail';
  
  // 当前激活的菜单
  activeMenu: 'home' | 'ai' | 'knowledge' | 'tags' | 'trash';
  
  // 编辑器
  editorMode: 'edit' | 'preview';
  editorFullscreen: boolean;
  
  // 对话框
  confirmDialog: {
    open: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  };
  
  // Toast/通知
  toast: {
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  };
  previewImageUrl: string | null; // For image zoom
  selectedImageSrc: string | null;
  
  // Actions
  toggleSidebar: () => void;
  toggleAIPanel: () => void;
  setViewMode: (mode: 'list' | 'detail') => void;
  setActiveMenu: (menu: 'home' | 'ai' | 'knowledge' | 'tags' | 'trash') => void;
  setEditorMode: (mode: 'edit' | 'preview') => void;
  toggleEditorFullscreen: () => void;
  showConfirmDialog: (options: {
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }) => void;
  hideConfirmDialog: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  hideToast: () => void;
  setPreviewImageUrl: (url: string | null) => void;
  setSelectedImageSrc: (src: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // 初始状态
  sidebarOpen: true,
  aiPanelOpen: true,
  viewMode: 'list',
  activeMenu: 'home',
  editorMode: 'edit',
  editorFullscreen: false,
  confirmDialog: {
    open: false,
    title: '',
    message: '',
  },
  toast: {
    open: false,
    message: '',
    type: 'info',
  },
  previewImageUrl: null,
  selectedImageSrc: null,

  // Actions
  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  toggleAIPanel: () =>
    set((state) => ({ aiPanelOpen: !state.aiPanelOpen })),

  setViewMode: (mode) =>
    set({ viewMode: mode }),

  setActiveMenu: (menu) =>
    set({ activeMenu: menu }),

  setEditorMode: (mode) =>
    set({ editorMode: mode }),

  toggleEditorFullscreen: () =>
    set((state) => ({ editorFullscreen: !state.editorFullscreen })),

  showConfirmDialog: (options) =>
    set({
      confirmDialog: {
        open: true,
        ...options,
      },
    }),

  hideConfirmDialog: () =>
    set((state) => ({
      confirmDialog: {
        ...state.confirmDialog,
        open: false,
      },
    })),

  showToast: (message, type = 'info') =>
    set({
      toast: {
        open: true,
        message,
        type,
      },
    }),

  hideToast: () =>
    set((state) => ({
      toast: {
        ...state.toast,
        open: false,
      },
    })),
  setPreviewImageUrl: (url) => set({ previewImageUrl: url }),
  setSelectedImageSrc: (src) => set({ selectedImageSrc: src }),
}));
