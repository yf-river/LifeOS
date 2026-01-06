# 图片预览功能实现文档

## 功能概述

在首页编辑器中实现了完整的图片点击预览功能，包括：
- 鼠标悬浮/点击显示选中边框
- 双击打开全屏预览
- 预览模式下的缩放、旋转、拖动
- 多种关闭预览的方式

## 核心实现文件

### 1. ImageView 组件
**路径**: `frontend/src/components/editor/extensions/ImageView.tsx`

这是核心组件，使用 React Portal 实现图片预览。

#### 关键功能点：

**选中状态管理**：
```typescript
const [isSelected, setIsSelected] = useState(false);
const [isHovered, setIsHovered] = useState(false);
const showBorder = isHovered || isSelected;
```

**双击打开逻辑**：
```typescript
const handleClick = (event: React.MouseEvent) => {
  if (isSelected) {
    setShowPreview(true);  // 第二次点击打开预览
  } else {
    setIsSelected(true);   // 第一次点击选中
  }
};
```

**边框样式**（RGB 116, 112, 241）：
```typescript
<div
  className={cn('relative select-none transition-all',
    isSelected ? 'cursor-zoom-in' : 'cursor-default',
    showBorder && 'ring-2'
  )}
  style={showBorder ? { '--tw-ring-color': 'rgb(116, 112, 241)' } : undefined}
>
```

**四角圆点**：
```typescript
{showBorder && (
  <>
    <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full" 
         style={{ backgroundColor: 'rgb(116, 112, 241)' }} />
    // ... 其他三个角
  </>
)}
```

**预览弹窗**（使用 React Portal）：
```typescript
{showPreview && typeof document !== 'undefined' && createPortal(
  <div className="fixed inset-0 z-[9999] bg-black/90" onClick={handleClose}>
    {/* 工具栏、关闭按钮、图片 */}
  </div>,
  document.body
)}
```

#### 缩放功能：

**状态管理**：
```typescript
const [scale, setScale] = useState(1);  // 缩放比例 0.5-5
const [rotation, setRotation] = useState(0);  // 旋转角度
const [position, setPosition] = useState({ x: 0, y: 0 });  // 位置
```

**滚轮缩放**：
```typescript
useEffect(() => {
  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale(prev => Math.max(0.5, Math.min(5, prev + delta)));
    }
  };
  window.addEventListener('wheel', handleWheel, { passive: false });
}, [showPreview]);
```

#### 拖动功能：

**鼠标事件处理**：
```typescript
const [isDragging, setIsDragging] = useState(false);

const handleImageMouseDown = (e: React.MouseEvent) => {
  e.stopPropagation();
  setIsDragging(true);
  setDragStart({ x: e.clientX, y: e.clientY });
};

useEffect(() => {
  if (!isDragging) return;
  
  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setPosition(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  return () => document.removeEventListener('mousemove', handleMouseMove);
}, [isDragging, dragStart]);
```

#### 关闭预览的多种方式：

1. **ESC 键**：
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') handleClose();
  };
  window.addEventListener('keydown', handleKeyDown);
}, [showPreview]);
```

2. **点击背景**：外层 div 的 `onClick={handleClose}`

3. **关闭按钮**：右上角 X 按钮

#### 点击外部失去焦点：

```typescript
useEffect(() => {
  if (!isSelected) return;
  
  const handleClickOutside = (event: MouseEvent) => {
    if (containerRef.current?.contains(event.target)) return;
    setIsSelected(false);
  };
  
  const timer = setTimeout(() => {
    document.addEventListener('click', handleClickOutside);
  }, 0);
  
  return () => {
    clearTimeout(timer);
    document.removeEventListener('click', handleClickOutside);
  };
}, [isSelected]);
```

### 2. CustomImage 扩展
**路径**: `frontend/src/components/editor/extensions/CustomImage.ts`

TipTap 自定义 Image 节点：

```typescript
export const CustomImage = Node.create({
  name: 'image',
  group: 'block',
  inline: false,
  draggable: true,
  atom: true,  // 标记为原子节点，允许更好的交互
  
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
    };
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
});
```

### 3. NoteEditor 配置
**路径**: `frontend/src/components/editor/NoteEditor.tsx`

#### 关键配置：

**禁用 StarterKit 的 codeBlock**（我们使用自定义的）：
```typescript
StarterKit.configure({
  codeBlock: false,
}),
```

**注册 CustomImage 扩展**：
```typescript
extensions: [
  // ...
  CustomImage,
  // ...
]
```

**图片拖放上传**：
```typescript
editorProps: {
  handleDOMEvents: {
    drop: (view: any, event: DragEvent) => {
      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) return false;
      const file = files[0];
      if (file.type.startsWith('image/')) {
        event.preventDefault();
        handleImageFile(file);
        return true;
      }
      return false;
    },
  },
}
```

### 4. 样式文件
**路径**: `frontend/src/styles/globals.css`

TipTap placeholder 样式（164-170行）：
```css
.tiptap.ProseMirror.aie-content p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: var(--aie-text-placeholder-color);
  float: left;
  height: 0;
  pointer-events: none;
}
```

## 实现过程中遇到的问题及解决方案

### 问题1: 图片点击无反应

**原因**: 
1. StarterKit 默认的 Image 扩展和 CustomImage 冲突
2. `selectionUpdate` 事件监听器干扰了状态
3. 全局 Zustand store 状态更新失效

**解决方案**:
- ~~禁用 StarterKit 的 image 扩展~~ (StarterKit 本身不包含 Image)
- 移除干扰的事件监听器
- 改用组件内部 useState + React Portal，不依赖全局状态

### 问题2: 缩放后无法查看完整图片

**原因**: 图片缩放但容器没有限制，导致图片超出可视区域

**解决方案**:
```typescript
<img 
  className="max-w-[90vw] max-h-[90vh] object-contain"
  style={{
    transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`
  }}
/>
```

### 问题3: 工具栏在浅色图片上看不清

**解决方案**: 改用深色背景 + 边框 + 阴影
```typescript
className="bg-gray-900/90 backdrop-blur-md shadow-2xl border border-white/10"
```

### 问题4: 点击黑色背景无法关闭预览

**原因**: 图片容器占满全屏并阻止了事件冒泡

**解决方案**: 将 `stopPropagation` 移到内层变换容器
```typescript
<div className="w-full h-full">  {/* 允许点击穿透 */}
  <div onClick={(e) => e.stopPropagation()}>  {/* 只在这里阻止 */}
    <img />
  </div>
</div>
```

## 代码清理记录

删除的无用文件和代码：
- ❌ `frontend/src/components/editor/ImagePreviewDialog.tsx` - 旧的预览组件
- ❌ `frontend/src/store/ui.ts` 中的 `previewImageUrl`、`selectedImageSrc` 状态
- ❌ `NoteEditor.tsx` 中的全局回调函数相关代码

## 交互流程图

```
用户操作流程：

1. 鼠标悬浮图片
   └─> 显示紫色边框 (hover)

2. 点击图片（第一次）
   └─> 边框固定 + 鼠标变放大镜
   
3. 点击其他区域
   └─> 取消选中，边框消失

4. 点击图片（第二次，已选中状态）
   └─> 打开全屏预览
   
5. 预览模式操作：
   ├─> Ctrl/Cmd + 滚轮：缩放
   ├─> 点击工具栏按钮：放大/缩小/旋转/重置
   ├─> 拖动图片：平移查看
   └─> 关闭：ESC / 点击背景 / 点击X按钮
```

## 依赖包

```json
{
  "@tiptap/react": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "lucide-react": "^0.x",  // 图标
  "react": "^18.x",
  "react-dom": "^18.x"
}
```

## 测试要点

- [ ] 鼠标悬浮显示边框
- [ ] 第一次点击选中（紫色边框固定）
- [ ] 点击其他区域取消选中
- [ ] 第二次点击打开预览
- [ ] 预览模式：缩放（50%-500%）
- [ ] 预览模式：旋转（90度增量）
- [ ] 预览模式：拖动平移
- [ ] 预览模式：Ctrl+滚轮缩放
- [ ] 关闭：ESC键
- [ ] 关闭：点击背景
- [ ] 关闭：点击X按钮
- [ ] 工具栏在各种图片上清晰可见

## 未来改进方向

1. 添加键盘快捷键（如方向键移动）
2. 双指触控缩放支持（移动端）
3. 图片加载状态和错误处理
4. 记住上次的缩放比例
5. 添加图片信息显示（尺寸、格式等）

## 相关文档

- TipTap 官方文档: https://tiptap.dev/
- React Portal: https://react.dev/reference/react-dom/createPortal
