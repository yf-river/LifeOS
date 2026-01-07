# 首页编辑框（Omnibar）优化文档

## 概述

对首页的 Omnibar 编辑框进行了一系列的 UI/UX 优化，包括编辑区域、工具栏、图片处理等功能的改进。

## 核心文件

- **主组件**: `frontend/src/components/omnibar/Omnibar.tsx`
- **图片视图**: `frontend/src/components/editor/extensions/ImageView.tsx`
- **自定义图片扩展**: `frontend/src/components/editor/extensions/CustomImage.ts`
- **全局样式**: `frontend/src/styles/globals.css`

## 修改时间线

### 1. 编辑框高度优化

**问题**: 编辑框默认太短，最大高度限制为 300px

**解决方案**:
- 编辑器区域最大高度改为 `max-h-[40vh]`（屏幕高度的 40%）
- 编辑器内容区域设置 `min-h-[120px]` 初始最小高度
- 支持根据内容自动扩展

**代码位置**: `Omnibar.tsx` 第 264-270 行
```tsx
<div className="relative px-4 pt-4 pb-2 max-h-[40vh] overflow-y-auto">
```

**编辑器配置**: `Omnibar.tsx` 第 129-133 行
```tsx
editorProps: {
  attributes: {
    class: 'prose prose-sm focus:outline-none min-h-[120px] aie-content',
  },
},
```

### 2. 图片插入后自动添加空段落

**问题**: 插入图片后无法在下方继续输入

**解决方案**: 插入图片时自动在图片后添加两个空段落

**代码位置**: `Omnibar.tsx` `handleImageFile` 函数
```tsx
editor.chain()
  .focus()
  .insertContent([
    { type: 'image', attrs: { src: base64 } },
    { type: 'paragraph' },
    { type: 'paragraph' },
  ])
  .run();
```

### 3. 图片选中后 Ctrl+C 复制功能

**问题**: 图片选中后无法复制

**解决方案**: 在 `ImageView` 组件中监听键盘事件，选中状态下按 Ctrl+C 复制图片到剪贴板

**代码位置**: `ImageView.tsx` 第 42-66 行
```tsx
useEffect(() => {
  if (!isSelected) return;
  const handleCopy = async (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault();
      const response = await fetch(src);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
    }
  };
  window.addEventListener('keydown', handleCopy);
  return () => window.removeEventListener('keydown', handleCopy);
}, [isSelected, src]);
```

### 4. 图片操作按钮（向上/向下插入段落、删除）

**问题**: 手机用户难以在图片前后插入内容

**解决方案**: 图片选中时显示悬浮操作按钮

**代码位置**: `ImageView.tsx` 第 236-285 行

**功能**:
- 向上插入段落: `handleInsertBefore`
- 向下插入段落: `handleInsertAfter`
- 删除图片: `handleDelete`

**样式**: 按钮位于图片下方居中，带自定义 tooltip（黑色背景、白色文字、小三角箭头）

### 5. 工具栏重构

**修改内容**:
- 图标变大（按钮 `w-9 h-9`）
- 使用文字样式图标（B/I/U）
- 新增文本格式下拉框（正文/标题1/2/3）
- 新增下划线、引用按钮
- 自定义 tooltip 悬停立即显示

**代码位置**: `Omnibar.tsx` 第 275-420 行

**工具栏按钮顺序**:
1. 插入图片
2. 文本格式下拉框（T▾）
3. 加粗（B）- Ctrl+B
4. 斜体（I）- Ctrl+I
5. 下划线（U）- Ctrl+U
6. 引用（"）
7. 有序列表
8. 无序列表

**新增扩展**:
```tsx
import Underline from '@tiptap/extension-underline';

// 在 useEditor 中
Underline,
StarterKit.configure({
  heading: { levels: [1, 2, 3] },
  codeBlock: false,
}),
```

### 6. ToolbarButton 组件

**代码位置**: `Omnibar.tsx` 第 489-545 行

**功能**:
- 支持 `tooltipAlign` 属性（`'left' | 'center' | 'right'`）
- 解决边缘 tooltip 被裁剪问题
- 支持下拉箭头显示（`hasDropdown`）

```tsx
function ToolbarButton({
  icon,
  tooltip,
  active,
  onClick,
  hasDropdown,
  tooltipAlign = 'center'
}: {
  icon: string;
  tooltip: string;
  active?: boolean;
  onClick?: () => void;
  hasDropdown?: boolean;
  tooltipAlign?: 'left' | 'center' | 'right';
})
```

### 7. 文本格式下拉框

**代码位置**: `Omnibar.tsx` 第 295-355 行

**功能**:
- 向上弹出（`bottom-full`）避免被容器裁剪
- 点击外部自动关闭
- 支持：正文、标题1、标题2、标题3

**状态管理**:
```tsx
const [showFormatDropdown, setShowFormatDropdown] = useState(false);
const formatDropdownRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (formatDropdownRef.current && !formatDropdownRef.current.contains(event.target as Node)) {
      setShowFormatDropdown(false);
    }
  };
  if (showFormatDropdown) {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }
}, [showFormatDropdown]);
```

### 8. 编辑框样式优化

**修改内容**:
- 移除边框（`border-2`）
- 改用阴影效果
- 工具栏去掉分隔线和背景色

**代码位置**: `Omnibar.tsx` 第 247-253 行
```tsx
<div
  className={cn(
    'bg-white rounded-xl transition-all duration-200 ease-out relative',
    isFocused
      ? 'shadow-xl shadow-gray-200/80'
      : 'shadow-md shadow-gray-100/80 hover:shadow-lg'
  )}
>
```

### 9. 发送按钮改为图标

**修改内容**: 「发送」文字改为纸飞机箭头图标

**代码位置**: `Omnibar.tsx` 第 404-422 行
```tsx
<button className={cn(
  'px-5 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
  'hover:scale-105 active:scale-95',
  hasContent && !isSubmitting && !isUploading
    ? 'bg-gray-900 text-white hover:bg-black'
    : 'bg-gray-100 text-gray-300 cursor-not-allowed hover:scale-100'
)}>
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
</button>
```

### 10. 右上角放大按钮（待完善）

**功能**: 点击后跳转到全屏编辑器

**代码位置**: `Omnibar.tsx` 第 267-280 行
```tsx
<button
  onClick={() => {
    // TODO: 跳转到全屏编辑器
    console.log('打开全屏编辑器');
  }}
  className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
  title="全屏编辑"
>
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
</button>
```

## 依赖包

```json
{
  "@tiptap/react": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/extension-placeholder": "^2.x",
  "@tiptap/extension-link": "^2.x",
  "@tiptap/extension-underline": "^2.x",
  "lucide-react": "^0.x"
}
```

## 待办事项

- [ ] 实现右上角放大按钮的全屏编辑器跳转功能
- [ ] 添加更多快捷键支持
- [ ] 移动端适配优化
