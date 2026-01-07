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
    │       └── NoteDetail (notes/NoteDetail.tsx) ← 下一阶段优化目标
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

## 核心文件说明

### 1. NoteDetail.tsx（笔记详情页 - 主要优化目标）

**路径**: `frontend/src/components/notes/NoteDetail.tsx`

**当前功能**:
- 显示/编辑笔记标题
- 显示更新时间
- 标签管理
- 富文本编辑器（TipTap）
- 编辑/查看模式切换
- 导出功能（Markdown、JSON）
- 版本历史

**当前编辑器扩展**:
```tsx
extensions: [
  StarterKit.configure({ codeBlock: false }),
  Placeholder,
  TaskItem,
  TaskList,
  Link,
  Image,  // 注意：使用的是原生 Image，不是 CustomImage
  Highlight,
  CodeBlockLowlight,
]
```

**关键状态**:
- `isEditing`: 是否处于编辑模式
- `title`: 笔记标题
- `showMenu`: 更多菜单是否显示
- `showVersionHistory`: 版本历史弹窗

**自动保存逻辑**:
```tsx
const debouncedSave = debounce((json, text) => {
  updateNote(currentNote.id, {
    title,
    content: text,
    json_content: JSON.stringify(json),
  }, currentNote.version);
}, 1000);
```

### 2. NoteEditor.tsx（独立编辑器组件 - 备用）

**路径**: `frontend/src/components/editor/NoteEditor.tsx`

这是一个更完整的编辑器组件，但目前 `NoteDetail` 使用的是内嵌的编辑器。`NoteEditor` 包含：
- 更多扩展（Table、Underline、LinkPreview）
- 独立的 EditorToolbar 和 EditorHeader
- 全屏模式支持
- 图片粘贴/拖拽上传

**可考虑**: 将 `NoteDetail` 中的编辑器替换为 `NoteEditor` 组件，或将 `NoteEditor` 的功能合并到 `NoteDetail` 中。

### 3. 相关组件

| 文件 | 路径 | 说明 |
|------|------|------|
| EditorToolbar | `editor/EditorToolbar.tsx` | 编辑器工具栏组件 |
| EditorHeader | `editor/EditorHeader.tsx` | 编辑器头部组件 |
| CustomImage | `editor/extensions/CustomImage.ts` | 自定义图片扩展（支持预览） |
| ImageView | `editor/extensions/ImageView.tsx` | 图片视图组件（点击预览、操作按钮） |
| LinkPreview | `editor/extensions/LinkPreview.tsx` | 链接预览扩展 |
| VersionHistory | `notes/VersionHistory.tsx` | 版本历史组件 |

### 4. 状态管理

**useNotesStore** (`store/notes.ts`):
- `currentNote`: 当前选中的笔记
- `updateNote()`: 更新笔记
- `createNote()`: 创建笔记
- `setCurrentNote()`: 设置当前笔记
- `isSaving`: 是否正在保存

**useUIStore** (`store/ui.ts`):
- `viewMode`: 视图模式 ('list' | 'detail')
- `setViewMode()`: 设置视图模式
- `editorFullscreen`: 编辑器是否全屏
- `showToast()`: 显示提示

## 已完成的 Omnibar 优化（可参考）

在 `docs/002-omnibar-editor-improvements.md` 中有详细记录，主要包括：

1. **编辑框高度优化**: `max-h-[40vh]`, `min-h-[120px]`
2. **图片功能增强**:
   - 插入后自动添加空段落
   - 选中后 Ctrl+C 复制
   - 操作按钮（向上/向下插入、删除）
3. **工具栏重构**:
   - 文本格式下拉框（正文/H1/H2/H3）
   - 加粗、斜体、下划线、引用、列表按钮
   - 自定义 tooltip
4. **样式优化**:
   - 无边框阴影效果
   - 发送按钮改为箭头图标
5. **放大按钮**: 点击跳转到详情页

## 待优化方向（建议）

### 1. 编辑器功能增强

- [ ] 使用 `CustomImage` 替代原生 `Image`（支持点击预览、操作按钮）
- [ ] 添加 `Underline` 扩展
- [ ] 添加表格支持
- [ ] 工具栏样式统一（参考 Omnibar 的 tooltip 样式）

### 2. 编辑体验优化

- [ ] 默认进入编辑模式（或自动聚焦）
- [ ] 优化编辑/查看模式切换体验
- [ ] 添加快捷键支持
- [ ] 图片拖拽/粘贴上传

### 3. UI/UX 改进

- [ ] 工具栏样式优化
- [ ] 标题输入框样式
- [ ] 标签管理交互
- [ ] 移动端适配

### 4. 功能完善

- [ ] 追加笔记功能实现
- [ ] 分享功能实现
- [ ] 智能标签功能

## 开发指南

### 如何测试

1. 启动开发服务器: `cd frontend && npm run dev`
2. 访问 http://localhost:3000
3. 登录后，点击任意笔记卡片进入详情页
4. 或在 Omnibar 输入内容后点击放大按钮

### 修改编辑器扩展

在 `NoteDetail.tsx` 中找到 `useEditor` 配置：
```tsx
const editor = useEditor({
  extensions: [
    // 在这里添加/修改扩展
  ],
  // ...
});
```

### 添加工具栏按钮

参考 `Omnibar.tsx` 中的 `ToolbarButton` 组件实现。

### 样式规范

- 使用 Tailwind CSS
- 主色调: `#2a88ff`（蓝色）、`#111418`（深色文字）、`#8a8f99`（浅色文字）
- 边框: `#e4e4e7`
- 背景: `#f8f9fa`（浅灰）、`#fafafa`

## 相关文档

- `docs/001-image-preview-feature.md` - 图片预览功能文档
- `docs/002-omnibar-editor-improvements.md` - Omnibar 编辑框优化文档
