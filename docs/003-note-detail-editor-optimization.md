# 笔记详情页编辑器优化计划

## 项目背景

这是 LifeOS 笔记应用的笔记详情页编辑器优化计划。在完成首页 Omnibar（快速输入框）的优化后，下一阶段的目标是优化笔记详情页的编辑体验。

## 当前应用架构

### 页面结构

```
App (page.tsx)
└── MainLayout (layout/MainLayout.tsx)
    ├── Sidebar (侧边栏)
    ├── MainContent (layout/MainContent.tsx)
    │   ├── 首页列表视图 (viewMode !== 'detail')
    │   │   ├── MainHeader (搜索、筛选)
    │   │   ├── Omnibar (快速输入框) ← 已优化完成
    │   │   └── NoteList (笔记列表)
    │   └── 笔记详情视图 (viewMode === 'detail')
    │       └── NoteDetail (notes/NoteDetail.tsx) ← 已优化完成
    └── AIPanel (AI 助手面板)
```

### 视图切换逻辑

在 `MainContent.tsx` 中：
```tsx
const showDetail = currentNote !== null && viewMode === 'detail';

return showDetail ? <NoteDetail /> : <首页列表视图 />;
```

### 从 Omnibar 跳转到详情页

在 `Omnibar.tsx` 中，点击放大按钮会：
1. 创建新笔记
2. 调用 `setViewMode('detail')` 切换视图
3. `MainContent` 检测到 `viewMode === 'detail'` 后显示 `NoteDetail`

---

## 已完成的优化（2026-01-08）

### 1. 整体布局重构

按照设计稿重构了整个详情页布局：

```
┌────────────────────────────────────────────────────────────────┐
│ ← 返回上一页                              [取消]  [保存(⌘+S)] │
├────────────────────────────────────────────────────────────────┤
│ ↺ ↻ │ 📷 │ B I U │ <> ☑ 🔗 │ 正文▼ │ ☰ ≡ ⇐ ⇒ │ 66 {} ⊞     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  请输入标题                                                    │
│                                                                │
│  标签: [+ 添加标签]                                           │
│                                                                │
│  记录现在的想法...                                            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 2. 顶部导航栏

- 左侧：带边框的"返回上一页"按钮
- 右侧：取消按钮 + 保存按钮（显示快捷键提示 ⌘+S）

### 3. 完整的编辑器工具栏

实现了全部工具按钮：
- **撤销/重做**：基于 TipTap 内置的 History 扩展
- **图片插入**：支持选择本地图片上传
- **文本格式**：加粗 (B)、斜体 (I)、下划线 (U)
- **代码/任务/链接**：行内代码、待办事项、链接插入
- **正文格式下拉框**：正文/H1/H2/H3 切换
- **列表**：无序列表、有序列表、减少缩进、增加缩进
- **块级元素**：引用、代码块、表格

### 4. 编辑器扩展增强

当前使用的扩展：
```tsx
extensions: [
  StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false }),
  Placeholder.configure({ placeholder: '记录现在的想法...' }),
  Underline,
  TaskItem.configure({ nested: true }),
  TaskList,
  Link,
  CustomImage,  // 替换了原生 Image，支持点击预览
  Highlight.configure({ multicolor: true }),
  CodeBlockLowlight.configure({ lowlight }),
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
]
```

### 5. 功能优化

- **默认编辑模式**：进入详情页即可直接编辑，无需点击"编辑"按钮
- **自动聚焦**：无标题时聚焦标题输入框，有标题时聚焦编辑器末尾
- **快捷键保存**：支持 ⌘+S / Ctrl+S 保存
- **自动保存**：1秒防抖保存，编辑时自动保存
- **保存状态提示**：右下角显示"保存中..."

---

## 调试问题记录

### 问题 1：顶部导航栏横线横跨整个屏幕

**现象**：导航栏和工具栏的边框线（border-b）横跨整个屏幕宽度，而不是只在内容区域内。

**原因**：边框线放在了外层容器上，而不是内层的 `max-w-[900px]` 容器上。

**解决方案**：将 `border-b border-[#e4e4e7]` 从外层容器移到内层容器：
```tsx
// 修改前
<header className="border-b border-[#e4e4e7]">
  <div className="max-w-[900px] mx-auto px-6 py-4 flex items-center justify-between">

// 修改后
<header>
  <div className="max-w-[900px] mx-auto px-6 py-4 flex items-center justify-between border-b border-[#e4e4e7]">
```

### 问题 2：工具栏图标太小

**现象**：工具栏的图标和按钮视觉上偏小，不够醒目。

**解决方案**：
- 按钮尺寸：`w-8 h-8` → `w-9 h-9`
- 图标尺寸：`w-4 h-4` → `w-5 h-5`
- 文字图标：`text-sm` → `text-base`
- 分隔线高度：`h-5` → `h-6`，间距 `mx-1` → `mx-1.5`

### 问题 3：新笔记标题自动填充"新笔记"

**现象**：从 Omnibar 点击放大按钮创建新笔记时，标题会自动填充为"新笔记"。

**原因**：`Omnibar.tsx` 中创建笔记时使用了默认值：
```tsx
title: text.slice(0, 50) || '新笔记',
```

**解决方案**：改为空字符串，让用户自己输入标题：
```tsx
title: text.slice(0, 50) || '',
```

### 问题 4：工具栏在缩放时无法换行

**现象**：窗口缩小时，工具栏按钮被挤压变形，无法自动换行。

**解决方案**：添加 `flex-wrap` 类：
```tsx
<div className="max-w-[900px] mx-auto px-6 py-2 flex flex-wrap items-center gap-1 border-b border-[#e4e4e7]">
```

### 问题 5：全屏状态下工具栏已经是两行

**现象**：修复换行问题后，全屏状态下工具栏按钮也变成两行了。

**原因**：内容区域最大宽度 `max-w-[800px]` 太窄，放不下所有工具栏按钮。

**解决方案**：将最大宽度从 `800px` 改为 `900px`：
```tsx
// 导航栏、工具栏、内容区都使用相同的最大宽度
max-w-[900px]
```

### 问题 6：语法错误导致构建失败

**现象**：编辑过程中产生语法错误：
```
Error: Unexpected token `div`. Expected jsx identifier
```

**原因**：编辑时产生了多余的 `}`：
```tsx
onClick={() => editor?.chain().focus().undo().run()}}  // 多了一个 }
```

**解决方案**：删除多余的 `}`。

**教训**：每次编辑后应该运行 `npm run build` 验证。

### 问题 7：EditorToolbar.tsx 类型错误

**现象**：构建时报错：
```
Property 'setImage' does not exist on type 'ChainedCommands'
```

**原因**：`EditorToolbar.tsx` 中使用了 `setImage` 命令，但 Editor 类型没有包含 Image 扩展的命令定义。

**解决方案**：改用 `insertContent` 方法：
```tsx
// 修改前
editor.chain().focus().setImage({ src: imageUrl }).run();

// 修改后
editor.chain().focus().insertContent({
  type: 'image',
  attrs: { src: imageUrl }
}).run();
```

---

## 撤销/重做功能说明

### 核心逻辑

TipTap 的 `StarterKit` 默认包含了 `History` 扩展，基于 ProseMirror 的历史管理系统：

- **自动记录**每次文档变更到历史栈
- **合并连续操作**：连续的字符输入会被合并为一个历史步骤
- **维护两个栈**：`undoStack`（可撤销）和 `redoStack`（可重做）

### 快捷键

TipTap 默认绑定：
- **撤销**: `Cmd+Z` (Mac) / `Ctrl+Z` (Windows)
- **重做**: `Cmd+Shift+Z` 或 `Cmd+Y` (Mac) / `Ctrl+Shift+Z` 或 `Ctrl+Y` (Windows)

### 配置选项

```tsx
StarterKit.configure({
  history: {
    depth: 100,        // 历史记录深度，默认100
    newGroupDelay: 500 // 多久后的操作算作新的历史组（毫秒）
  }
})
```

### depth 参数说明

| depth 值 | 大致内存占用 | 适用场景 |
|---------|-------------|---------|
| 100 (默认) | 几 MB | 普通笔记 |
| 500 | 几十 MB | 长文档编辑 |
| 1000+ | 可能 100MB+ | 需要谨慎，可能导致性能问题 |

**建议**：使用默认值 100-200 即可，配合后端的版本历史功能满足"无限撤销"需求。

---

## 核心文件说明

### 1. NoteDetail.tsx（笔记详情页 - 已优化）

**路径**: `frontend/src/components/notes/NoteDetail.tsx`

**当前功能**:
- 沉浸式编辑体验
- 完整的工具栏
- 标题输入框（placeholder: "请输入标题"）
- 标签管理
- 富文本编辑器（TipTap）
- 自动保存 + 快捷键保存
- 版本历史

**关键状态**:
- `title`: 笔记标题
- `hasUnsavedChanges`: 是否有未保存的更改
- `showFormatDropdown`: 格式下拉框是否显示
- `showVersionHistory`: 版本历史弹窗

### 2. 相关组件

| 文件 | 路径 | 说明 |
|------|------|------|
| EditorToolbar | `editor/EditorToolbar.tsx` | 编辑器工具栏组件（独立版本） |
| CustomImage | `editor/extensions/CustomImage.ts` | 自定义图片扩展（支持预览） |
| ImageView | `editor/extensions/ImageView.tsx` | 图片视图组件（点击预览、操作按钮） |
| VersionHistory | `notes/VersionHistory.tsx` | 版本历史组件 |

### 3. 状态管理

**useNotesStore** (`store/notes.ts`):
- `currentNote`: 当前选中的笔记
- `updateNote()`: 更新笔记
- `createNote()`: 创建笔记
- `setCurrentNote()`: 设置当前笔记
- `isSaving`: 是否正在保存

**useUIStore** (`store/ui.ts`):
- `viewMode`: 视图模式 ('list' | 'detail')
- `setViewMode()`: 设置视图模式
- `showToast()`: 显示提示

---

## 待优化方向（后续）

### 1. 功能完善

- [ ] 追加笔记功能实现
- [ ] 分享功能实现
- [ ] 智能标签功能
- [ ] 标签管理交互优化

### 2. 体验优化

- [ ] 图片拖拽/粘贴上传
- [ ] 移动端适配
- [ ] 更多快捷键支持

### 3. 性能优化

- [ ] 大文档编辑性能
- [ ] 图片懒加载

---

## 开发指南

### 如何测试

1. 启动开发服务器: `cd frontend && npm run dev`
2. 访问 http://localhost:3000
3. 登录后，点击任意笔记卡片进入详情页
4. 或在 Omnibar 输入内容后点击放大按钮

### 验证构建

每次修改后运行：
```bash
cd frontend && npm run build
```

### 样式规范

- 使用 Tailwind CSS
- 最大宽度: `max-w-[900px]`
- 主色调: `#2a88ff`（蓝色）、`#333639`（深色文字）、`#8a8f99`（浅色文字）
- 边框: `#e4e4e7`
- 背景: `#f5f5f5`（浅灰）

---

## 相关文档

- `docs/001-image-preview-feature.md` - 图片预览功能文档
- `docs/002-omnibar-editor-improvements.md` - Omnibar 编辑框优化文档
