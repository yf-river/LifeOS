/**
 * 设计系统配置
 * 基于 Get 笔记的设计规范
 */

// ==================== 颜色系统 ====================

export const colors = {
  // 主色调 - 深灰偏蓝
  primary: {
    DEFAULT: '#111418',      // 深黑
    hover: '#1a1d21',        // 悬停
    active: '#050607',       // 激活
  },

  // 辅助色
  secondary: {
    DEFAULT: '#2a88ff',      // 蓝色 - 用户消息/AI 高亮
    hover: '#1a78ef',
  },

  // 背景色
  background: {
    DEFAULT: '#ffffff',      // 纯白
    muted: '#fafafa',        // 淡灰（侧边栏）
    hover: '#f5f5f5',       // 悬停
  },

  // 前景色
  foreground: {
    DEFAULT: '#09090b',      // 主文字
    muted: '#8a8f99',        // 次要文字
    disabled: '#d1d5db',    // 禁用文字
  },

  // 边框色
  border: {
    DEFAULT: '#e4e4e7',      // 标准边框
    hover: '#d4d4d7',        // 悬停边框
    focus: '#2a88ff',        // 聚焦边框
  },

  // AI 相关颜色
  ai: {
    bg: '#f3e8ff',           // AI 标签背景
    text: '#7c3aed',         // AI 文字颜色
    primary: '#2a88ff',      // AI 消息气泡
  },

  // 系统标签颜色
  systemTags: {
    ai_link: '#3b82f6',
    image: '#10b981',
    audio: '#8b5cf6',
    video: '#f59e0b',
  },

  // 语义色
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
} as const;

// ==================== 阴影系统 ====================

export const shadows = {
  // 文本域阴影（Get 笔记使用）
  textarea: '0px 4px 24px 0px rgba(0, 0, 0, 0.05)',

  // 卡片阴影
  card: {
    DEFAULT: '0 1px 3px rgba(0, 0, 0, 0.1)',
    hover: '0 4px 12px rgba(0, 0, 0, 0.15)',
    focus: '0px 4px 24px 0px rgba(0, 0, 0, 0.05)',
  },

  // 浮层阴影
  dropdown: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',

  // 按钮阴影
  button: {
    DEFAULT: 'none',
    hover: '0 2px 4px rgba(0, 0, 0, 0.1)',
    active: '0 1px 2px rgba(0, 0, 0, 0.1)',
  },
} as const;

// ==================== 圆角系统 ====================

export const borderRadius = {
  // 小圆角 - 小按钮、图标
  sm: '3px',

  // 标准圆角 - 按钮、卡片
  DEFAULT: '8px',

  // 中等圆角 - 大按钮
  md: '12px',

  // 大圆角 - 面板、对话框
  lg: '16px',

  // 圆形 - 头像、圆形按钮
  full: '9999px',
} as const;

// ==================== 过渡系统 ====================

export const transitions = {
  // 快速过渡 - 悬停效果
  fast: {
    duration: 150,
    easing: 'ease-out',
  },

  // 标准过渡 - 交互反馈
  DEFAULT: {
    duration: 200,
    easing: 'ease-in-out',
  },

  // 慢速过渡 - 页面切换
  slow: {
    duration: 300,
    easing: 'ease-in-out',
  },

  // 弹性过渡 - 弹窗
  bounce: {
    duration: 400,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// 生成 CSS transition 字符串
export const transitionString = (
  properties: string[],
  duration = transitions.DEFAULT.duration,
  easing = transitions.DEFAULT.easing
) => {
  return properties.map(prop => `${prop} ${duration}ms ${easing}`).join(', ');
};

// ==================== 间距系统 ====================

export const spacing = {
  xs: '4px',    // 0.25rem
  sm: '8px',    // 0.5rem
  md: '12px',   // 0.75rem
  DEFAULT: '16px',  // 1rem
  lg: '24px',   // 1.5rem
  xl: '32px',   // 2rem
  '2xl': '48px', // 3rem
} as const;

// ==================== 字体系统 ====================

export const fontSize = {
  xs: '12px',
  sm: '14px',
  DEFAULT: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '30px',
} as const;

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

// ==================== 布局尺寸 ====================

export const layout = {
  // 头部高度
  header: {
    height: '76px',
  },

  // 侧边栏
  sidebar: {
    width: '175px',
    itemHeight: '44px',
  },

  // 主内容区
  main: {
    width: '774px',
    padding: '14px',
  },

  // AI 面板
  aiPanel: {
    width: '280px',
  },
} as const;

// ==================== Z-index 层级 ====================

export const zIndex = {
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
} as const;

// ==================== 工具函数 ====================

/**
 * 生成带透明度的颜色
 */
export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * 生成带透明度的颜色字符串（用于颜色背景）
 * 例如：hexToRgbaWithAlpha('#2a88ff', 0.2) => '#2a88ff33'
 */
export const hexToRgbaWithAlpha = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${r}${g}${b}${a}`;
};
