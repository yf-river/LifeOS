/**
 * Framer Motion 动画配置
 * 基于 Get 笔记的交互体验
 */

import { Transition, Variants } from 'framer-motion';

// ==================== 过渡配置 ====================

export const transitions = {
  // 快速过渡 - 悬停效果
  fast: {
    duration: 0.15,
    ease: [0.4, 0, 0.2, 1],
  },

  // 标准过渡 - 交互反馈
  DEFAULT: {
    duration: 0.2,
    ease: [0.4, 0, 0.2, 1],
  },

  // 慢速过渡 - 页面切换
  slow: {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
  },

  // 弹性过渡 - 弹窗
  bounce: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 25,
  },
} as const;

// ==================== 通用动画变体 ====================

/**
 * 淡入动画
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.DEFAULT },
};

/**
 * 淡入+上移动画（列表项进入）
 */
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.DEFAULT,
  },
};

/**
 * 淡入+下移动画
 */
export const fadeInDown: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.DEFAULT,
  },
};

/**
 * 缩放进入动画（卡片、弹窗）
 */
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.bounce,
  },
};

/**
 * 滑入动画（侧边栏、抽屉）
 */
export const slideInFromLeft: Variants = {
  hidden: {
    x: -20,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: transitions.DEFAULT,
  },
};

export const slideInFromRight: Variants = {
  hidden: {
    x: 20,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: transitions.DEFAULT,
  },
};

export const slideInFromTop: Variants = {
  hidden: {
    y: -20,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: transitions.DEFAULT,
  },
};

export const slideInFromBottom: Variants = {
  hidden: {
    y: 20,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: transitions.DEFAULT,
  },
};

// ==================== 列表动画 ====================

/**
 * 列表项交错动画
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // 每个子元素延迟 50ms
      delayChildren: 0.1,
    },
  },
};

/**
 * 列表项变体
 */
export const listItem: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.DEFAULT,
  },
};

// ==================== 卡片动画 ====================

/**
 * 卡片悬停效果
 */
export const cardHover = {
  scale: 1.02,
  transition: transitions.fast,
};

/**
 * 卡片点击效果
 */
export const cardTap = {
  scale: 0.98,
  transition: transitions.fast,
};

// ==================== 按钮动画 ====================

/**
 * 按钮悬停效果
 */
export const buttonHover = {
  scale: 1.05,
  transition: transitions.fast,
};

/**
 * 按钮点击效果
 */
export const buttonTap = {
  scale: 0.95,
  transition: transitions.fast,
};

// ==================== 弹窗/模态框动画 ====================

/**
 * 模态框背景淡入
 */
export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
};

/**
 * 模态框内容缩放进入
 */
export const modalContent: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitions.bounce,
  },
};

// ==================== 工具提示动画 ====================

/**
 * 工具提示进入
 */
export const tooltipEnter: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.bounce,
  },
};

/**
 * 工具提示退出
 */
export const tooltipExit: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.fast,
  },
};

// ==================== 下拉菜单动画 ====================

/**
 * 下拉菜单展开
 */
export const dropdownOpen: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
    transformOrigin: 'top',
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.DEFAULT,
  },
};

// ==================== Toast 通知动画 ====================

/**
 * Toast 进入
 */
export const toastEnter: Variants = {
  hidden: {
    opacity: 0,
    x: '100%',
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.DEFAULT,
  },
};

/**
 * Toast 退出
 */
export const toastExit: Variants = {
  hidden: {
    opacity: 1,
    x: 0,
  },
  visible: {
    opacity: 0,
    x: '100%',
    transition: transitions.fast,
  },
};

// ==================== 加载动画 ====================

/**
 * 旋转动画
 */
export const spin = {
  rotate: 360,
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: 'linear',
  },
};

/**
 * 脉冲动画
 */
export const pulse = {
  opacity: [1, 0.5, 1],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

/**
 * 弹跳动画
 */
export const bounce = {
  y: [0, -10, 0],
  transition: {
    duration: 0.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

// ==================== 页面过渡动画 ====================

/**
 * 页面淡入
 */
export const pageTransition: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.slow,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: transitions.slow,
  },
};

// ==================== 标签切换动画 ====================

/**
 * 标签淡入淡出
 */
export const tabTransition: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.DEFAULT,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: transitions.fast,
  },
};

// ==================== 输入框动画 ====================

/**
 * 输入框聚焦动画
 */
export const inputFocus = {
  scale: 1.01,
  transition: transitions.fast,
};

/**
 * 标签浮动动画（Floating Label）
 */
export const labelFloat = {
  hidden: { y: 0 },
  visible: { y: -24, transition: transitions.fast },
};

// ==================== 图片加载动画 ====================

/**
 * 图片淡入
 */
export const imageLoad: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitions.DEFAULT,
  },
};

/**
 * 图片骨架屏动画
 */
export const skeleton = {
  background: [
    'rgba(0, 0, 0, 0.05)',
    'rgba(0, 0, 0, 0.1)',
    'rgba(0, 0, 0, 0.05)',
  ],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

// ==================== 默认动画组合 ====================

/**
 * 通用淡入动画（适用于大多数场景）
 */
export const defaultAnimations = {
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  variants: fadeInUp,
};

/**
 * 列表动画组合
 */
export const listAnimations = {
  initial: 'hidden',
  animate: 'visible',
  variants: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  },
};

/**
 * 模态框动画组合
 */
export const modalAnimations = {
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  variants: {
    backdrop: modalBackdrop,
    content: modalContent,
  },
};
