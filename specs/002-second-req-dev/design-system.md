# Prism Design System - Get笔记 风格

> 本文档定义 Prism 的 UI 设计规范，基于 Get笔记 (https://www.biji.com/note) 的设计语言，目标 1:1 还原。

---

## 1. 颜色系统 (Color Tokens)

### 1.1 主题色 (Primary)

| Token | HSL | HEX | 用途 |
|-------|-----|-----|------|
| `--primary` | `263 84% 58%` | `#7c3aed` | 主按钮、激活状态、链接 |
| `--primary-hover` | `263 84% 52%` | `#6d28d9` | 按钮悬停 |
| `--primary-active` | `263 84% 46%` | `#5b21b6` | 按钮按下 |
| `--primary-light` | `270 100% 98%` | `#faf5ff` | 侧边栏背景 |
| `--primary-muted` | `270 100% 96%` | `#f3e8ff` | AI 标签背景、高亮区域 |

### 1.2 中性色 (Neutral)

| Token | HSL | HEX | 用途 |
|-------|-----|-----|------|
| `--text-primary` | `220 13% 13%` | `#1f2937` | 标题、主要文字 |
| `--text-secondary` | `220 9% 46%` | `#6b7280` | 正文、次要文字 |
| `--text-muted` | `220 9% 64%` | `#9ca3af` | 占位符、时间戳 |
| `--text-disabled` | `220 9% 78%` | `#d1d5db` | 禁用状态 |
| `--background` | `0 0% 100%` | `#ffffff` | 页面背景 |
| `--surface` | `220 14% 96%` | `#f3f4f6` | 输入框背景、卡片悬停 |
| `--border` | `220 13% 91%` | `#e5e7eb` | 边框、分割线 |
| `--border-light` | `220 13% 95%` | `#f0f1f3` | 浅边框 |

### 1.3 标签色 (Tag Colors)

每种标签有 **前景色** 和 **背景色** 两个值：

| 名称 | 前景色 (Text) | 背景色 (Bg) | CSS Variable |
|------|--------------|-------------|--------------|
| Green | `#059669` | `#d1fae5` | `--tag-green`, `--tag-green-bg` |
| Red | `#dc2626` | `#fee2e2` | `--tag-red`, `--tag-red-bg` |
| Blue | `#2563eb` | `#dbeafe` | `--tag-blue`, `--tag-blue-bg` |
| Orange | `#ea580c` | `#ffedd5` | `--tag-orange`, `--tag-orange-bg` |
| Purple | `#7c3aed` | `#ede9fe` | `--tag-purple`, `--tag-purple-bg` |
| Pink | `#db2777` | `#fce7f3` | `--tag-pink`, `--tag-pink-bg` |
| Yellow | `#ca8a04` | `#fef9c3` | `--tag-yellow`, `--tag-yellow-bg` |
| Cyan | `#0891b2` | `#cffafe` | `--tag-cyan`, `--tag-cyan-bg` |

### 1.4 语义色 (Semantic)

| Token | HEX | 用途 |
|-------|-----|------|
| `--success` | `#10b981` | 成功提示 |
| `--warning` | `#f59e0b` | 警告提示 |
| `--error` | `#ef4444` | 错误提示 |
| `--info` | `#3b82f6` | 信息提示 |

---

## 2. 排版系统 (Typography)

### 2.1 字体栈

```css
--font-sans: "Inter", "PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", Consolas, monospace;
```

### 2.2 字号规范

| 名称 | 大小 | 行高 | 用途 |
|------|------|------|------|
| `text-xs` | 12px | 16px | 标签、时间戳 |
| `text-sm` | 14px | 20px | 正文、按钮 |
| `text-base` | 16px | 24px | 导航项 |
| `text-lg` | 18px | 28px | 卡片标题 |
| `text-xl` | 20px | 28px | 页面标题 |
| `text-2xl` | 24px | 32px | 大标题 |

### 2.3 字重

| 名称 | 值 | 用途 |
|------|-----|------|
| `font-normal` | 400 | 正文 |
| `font-medium` | 500 | 标签、按钮 |
| `font-semibold` | 600 | 标题 |
| `font-bold` | 700 | 强调 |

---

## 3. 间距系统 (Spacing)

基于 4px 网格系统：

| Token | 值 | 用途 |
|-------|-----|------|
| `space-1` | 4px | 图标与文字间距 |
| `space-2` | 8px | 元素内部间距 |
| `space-3` | 12px | 列表项间距 |
| `space-4` | 16px | 卡片内边距 |
| `space-5` | 20px | 区块间距 |
| `space-6` | 24px | 页面边距 |
| `space-8` | 32px | 大区块间距 |

---

## 4. 圆角系统 (Border Radius)

| Token | 值 | 用途 |
|-------|-----|------|
| `radius-sm` | 4px | 标签、小按钮 |
| `radius-md` | 8px | 按钮、输入框 |
| `radius-lg` | 12px | 卡片、模态框 |
| `radius-xl` | 16px | 大卡片 |
| `radius-full` | 9999px | 圆形头像 |

---

## 5. 阴影系统 (Shadows)

| Token | 值 | 用途 |
|-------|-----|------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | 按钮 |
| `shadow-md` | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` | 卡片默认 |
| `shadow-lg` | `0 4px 12px rgba(0,0,0,0.15)` | 卡片悬停 |
| `shadow-xl` | `0 10px 25px rgba(0,0,0,0.1)` | 模态框 |

---

## 6. 组件规范

### 6.1 侧边栏 (Sidebar)

```
宽度: 200px (折叠时 64px)
背景: var(--primary-light) #faf5ff
顶部 Logo 区域:
  - 高度: 56px
  - padding: 16px
  - Logo 尺寸: 24px
  - 文字: "Prism" 或自定义

导航项:
  - 高度: 40px
  - padding: 12px 16px
  - 圆角: 8px
  - 图标大小: 20px
  - 图标与文字间距: 8px
  - 默认状态: 透明背景, var(--text-secondary) 文字
  - 悬停状态: rgba(124, 58, 237, 0.08) 背景
  - 激活状态: var(--primary-muted) 背景, var(--primary) 文字
```

### 6.2 笔记卡片 (Note Card)

```
背景: #ffffff
圆角: 12px (radius-lg)
边框: 1px solid var(--border)
阴影: shadow-md
padding: 16px
间距 (列表): 16px

悬停状态:
  - 阴影: shadow-lg
  - 边框: 1px solid var(--primary-muted)
  - 过渡: 0.2s ease

卡片内部结构:
  ┌─────────────────────────────────┐
  │ [AI Badge]          今天 12:50  │  <- 顶部: 标签 + 时间戳
  ├─────────────────────────────────┤
  │ 笔记标题 (text-lg, font-semibold)│  <- 标题行
  ├─────────────────────────────────┤
  │ 笔记内容预览...                  │  <- 内容区 (最多 3 行)
  │ 显示前 100 字符...               │
  ├─────────────────────────────────┤
  │ [标签1] [标签2] [标签3]  [AI助手]│  <- 底部: 标签 + 操作按钮
  └─────────────────────────────────┘
```

### 6.3 AI Badge

```
背景: var(--primary-muted) #f3e8ff
文字颜色: var(--primary) #7c3aed
圆角: 4px (radius-sm)
padding: 2px 6px
字体大小: 12px (text-xs)
字体粗细: 500 (font-medium)

变体:
  - "AI" - 简短标识
  - "AI 生成" - 完全由 AI 生成
  - "AI 优化" - AI 辅助优化
```

### 6.4 标签 (Tag)

```
圆角: 4px (radius-sm)
padding: 4px 8px
字体大小: 12px (text-xs)
字体粗细: 500 (font-medium)

样式 (以 green 为例):
  background: var(--tag-green-bg) #d1fae5
  color: var(--tag-green) #059669

可删除标签:
  - 右侧显示 × 按钮
  - 悬停时 × 按钮可见
```

### 6.5 Omnibar (快速输入框)

```
位置: 主内容区顶部
最小高度: 56px (可随内容扩展)
最大高度: 300px
圆角: 12px (radius-lg)
背景: #ffffff
边框: 1px solid var(--border)
padding: 12px 16px

占位符文字: "记录现在的想法..."
占位符颜色: var(--text-muted)

聚焦状态:
  - 边框: 2px solid var(--primary)
  - 阴影: 0 0 0 3px rgba(124, 58, 237, 0.1)

内部结构:
  ┌─────────────────────────────────┐
  │ 记录现在的想法...                │  <- 文本输入区
  ├─────────────────────────────────┤
  │ [📷添加图片] [🔗添加链接] [🎬导入音视频] │  <- 快捷操作
  ├─────────────────────────────────┤
  │ [图][B][色][I][1.][•]      [发送]│  <- 工具栏
  └─────────────────────────────────┘

快捷操作按钮:
  - 添加图片 (AI智能识别)
  - 添加链接 (AI智能分析)
  - 导入音视频 (转文字稿，AI智能总结)

工具栏按钮:
  - 插入图片
  - 加粗 (⌘+B)
  - 文字颜色
  - 斜体 (⌘+I)
  - 有序列表
  - 无序列表
  - 发送按钮 (主色调)
```

### 6.6 搜索框 (Search Input)

```
高度: 40px
圆角: 8px (radius-md)
背景: var(--surface) #f3f4f6
边框: none
padding: 8px 12px 8px 36px (留出搜索图标空间)

左侧图标: 🔍 (16px, var(--text-muted))
占位符: "搜索笔记 (⌘+K)"
快捷键提示: 右侧显示 ⌘K 徽章

聚焦状态:
  - 背景: #ffffff
  - 边框: 1px solid var(--border)
```

### 6.7 按钮 (Button)

#### Primary Button
```
背景: var(--primary) #7c3aed
文字: #ffffff
高度: 36px
padding: 8px 16px
圆角: 8px (radius-md)
字体大小: 14px
字体粗细: 500

悬停: var(--primary-hover) #6d28d9
按下: var(--primary-active) #5b21b6
禁用: opacity 0.5, cursor not-allowed
```

#### Secondary Button
```
背景: transparent
边框: 1px solid var(--border)
文字: var(--text-primary)

悬停: 背景 var(--surface)
```

#### Ghost Button
```
背景: transparent
边框: none
文字: var(--text-secondary)

悬停: 背景 rgba(0,0,0,0.05)
```

### 6.8 时间戳显示

```
字体大小: 12px (text-xs)
颜色: var(--text-muted) #9ca3af

格式规则:
  - 今天: "今天 14:30"
  - 昨天: "昨天 09:15"
  - 本周: "周三 18:00"
  - 本年: "1月3日"
  - 往年: "2025-12-01"
```

---

## 7. 图标系统

推荐使用 **Lucide Icons** (与 shadcn/ui 一致)

常用图标映射:
| 功能 | 图标名 |
|------|--------|
| 首页 | `Home` |
| AI 助手 | `Bot` |
| 知识库 | `Library` |
| 标签 | `Tag` |
| 搜索 | `Search` |
| 添加 | `Plus` |
| 设置 | `Settings` |
| 删除 | `Trash2` |
| 编辑 | `Pencil` |
| 图片 | `Image` |
| 链接 | `Link` |
| 视频 | `Video` |

---

## 8. 动画规范

### 过渡时间
| 名称 | 时长 | 用途 |
|------|------|------|
| `duration-fast` | 100ms | 微交互 (按钮按下) |
| `duration-normal` | 200ms | 常规过渡 (悬停) |
| `duration-slow` | 300ms | 复杂动画 (展开) |

### 缓动函数
```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## 9. 响应式断点

| 名称 | 宽度 | 说明 |
|------|------|------|
| `sm` | 640px | 手机横屏 |
| `md` | 768px | 平板竖屏 |
| `lg` | 1024px | 平板横屏/小笔记本 |
| `xl` | 1280px | 桌面 |
| `2xl` | 1536px | 大屏桌面 |

### 侧边栏响应式行为
- `< md`: 隐藏侧边栏，显示汉堡菜单
- `>= md`: 显示折叠侧边栏 (64px)
- `>= lg`: 显示展开侧边栏 (200px)

---

## 10. 暗色模式 (Dark Mode)

暗色模式下的颜色映射：

| 亮色 Token | 暗色值 |
|------------|--------|
| `--background` | `#0f0f0f` |
| `--surface` | `#1a1a1a` |
| `--text-primary` | `#f3f4f6` |
| `--text-secondary` | `#9ca3af` |
| `--border` | `#2d2d2d` |
| `--primary` | `#a78bfa` (更亮的紫色) |
| `--primary-light` | `#1e1a2e` |
| `--primary-muted` | `#2d2640` |

---

## 11. 实现示例

### Tailwind CSS 配置

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7c3aed',
          hover: '#6d28d9',
          active: '#5b21b6',
          light: '#faf5ff',
          muted: '#f3e8ff',
        },
        tag: {
          green: { DEFAULT: '#059669', bg: '#d1fae5' },
          red: { DEFAULT: '#dc2626', bg: '#fee2e2' },
          blue: { DEFAULT: '#2563eb', bg: '#dbeafe' },
          orange: { DEFAULT: '#ea580c', bg: '#ffedd5' },
          purple: { DEFAULT: '#7c3aed', bg: '#ede9fe' },
          pink: { DEFAULT: '#db2777', bg: '#fce7f3' },
          yellow: { DEFAULT: '#ca8a04', bg: '#fef9c3' },
          cyan: { DEFAULT: '#0891b2', bg: '#cffafe' },
        },
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.15)',
      },
    },
  },
}
```

### React 组件示例 (AI Badge)

```tsx
// components/ui/ai-badge.tsx
import { cn } from "@/lib/utils"

interface AIBadgeProps {
  variant?: "default" | "generated" | "enhanced"
  className?: string
}

export function AIBadge({ variant = "default", className }: AIBadgeProps) {
  const labels = {
    default: "AI",
    generated: "AI 生成",
    enhanced: "AI 优化",
  }
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
        "bg-primary-muted text-primary",
        className
      )}
    >
      {labels[variant]}
    </span>
  )
}
```

### React 组件示例 (Tag)

```tsx
// components/ui/tag.tsx
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

type TagColor = "green" | "red" | "blue" | "orange" | "purple" | "pink" | "yellow" | "cyan"

interface TagProps {
  color: TagColor
  children: React.ReactNode
  onRemove?: () => void
  className?: string
}

const colorClasses: Record<TagColor, string> = {
  green: "bg-tag-green-bg text-tag-green",
  red: "bg-tag-red-bg text-tag-red",
  blue: "bg-tag-blue-bg text-tag-blue",
  orange: "bg-tag-orange-bg text-tag-orange",
  purple: "bg-tag-purple-bg text-tag-purple",
  pink: "bg-tag-pink-bg text-tag-pink",
  yellow: "bg-tag-yellow-bg text-tag-yellow",
  cyan: "bg-tag-cyan-bg text-tag-cyan",
}

export function Tag({ color, children, onRemove, className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
        colorClasses[color],
        className
      )}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}
```
