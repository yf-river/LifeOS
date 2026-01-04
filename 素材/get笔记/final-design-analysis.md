# Get笔记 设计系统分析报告 (自动爬取)

> 基于 Playwright 自动化爬取的真实数据

---

## 爬取结果概览

| 页面 | 状态 | 文件 |
|------|------|------|
| 首页/主界面 | ✅ | `app-main.png` |
| AI 助手 | ✅ | `page-ai-assistant.png` |
| 知识库 | ✅ | `page-knowledge-base.png` |
| 标签管理 | ✅ | `page-tags.png` |
| 样式数据 | ✅ | `app-styles.json` |
| 标签颜色 | ✅ | `tag-styles.json` (89个) |
| 页面源码 | ✅ | `page-source.html` |

---

## 1. 颜色系统 (从爬取数据提取)

### 1.1 主要颜色

| 颜色 | RGB | HEX | 用途 |
|------|-----|-----|------|
| 白色 | `rgb(255, 255, 255)` | `#ffffff` | 背景、卡片 |
| 深黑 | `rgb(9, 9, 11)` | `#09090b` | 主文字 |
| 深灰 | `rgb(17, 20, 24)` | `#111418` | 标题、激活态 |
| 中灰 | `rgb(51, 54, 57)` | `#333639` | 正文文字 |
| 浅灰 | `rgb(138, 143, 153)` | `#8a8f99` | 次要文字、图标 |
| 边框灰 | `rgb(228, 228, 231)` | `#e4e4e7` | 边框 |
| 背景灰 | `rgb(242, 242, 243)` | `#f2f2f3` | AI 助手背景 |

### 1.2 CSS 变量 (关键)

```css
/* 主题色 */
--primary: 220 17% 14%;           /* 深灰偏蓝 */
--primary-foreground: 0 0% 98%;   /* 白色 */

/* 背景 */
--background: 0 0% 100%;          /* 纯白 */
--foreground: 240 10% 3.9%;       /* 深色文字 */

/* 卡片 */
--card: 0 0% 100%;
--card-foreground: 240 10% 3.9%;

/* 边框 */
--border: 240 5.9% 90%;           /* #e4e4e7 */

/* 静音色 */
--muted: 240 4.8% 95.9%;
--muted-foreground: 240 3.8% 46.1%;

/* 侧边栏 */
--sidebar-background: 0 0% 98%;
--sidebar-foreground: 240 5.3% 26.1%;
--sidebar-accent: 240 4.8% 95.9%;
--sidebar-border: 220 13% 91%;

/* 圆角 */
--radius: 0.5rem;                 /* 8px */

/* 阴影 */
--shadow-textarea: 0px 4px 24px 0px rgba(0, 0, 0, 0.05);

/* 聊天/AI */
--chat-background: #F2F2F3;
--aie-chat-item-user-bg-color: #2a88ff;  /* 蓝色 - 用户消息 */
--aie-chat-item-user-text-color: #fff;
--aie-chat-item-assistan-bg-color: #fff;
--aie-chat-item-assistan-text-color: #333;
```

### 1.3 注意：主色调差异

**重要发现**: Get笔记 的实际主色是 **深灰** (`#111418`)，而不是紫色！

之前基于你截图分析认为是紫色，但爬取的 CSS 变量显示：
- `--primary: 220 17% 14%` = `hsl(220, 17%, 14%)` ≈ `#1e2329` (深灰偏蓝)

这意味着需要调整 Prism 的配色方案。

---

## 2. 排版系统

### 2.1 字体栈

```css
font-family: -apple-system, "Helvetica Neue", Arial, "PingFang SC", 
             "Hiragino Sans GB", STHeiti, "Microsoft YaHei", 
             "Microsoft JhengHei", "Source Han Sans SC", 
             "Noto Sans CJK SC", "Source Han Sans CN", 
             "Noto Sans SC", "Source Han Sans TC", 
             "Noto Sans CJK TC", SimSun, sans-serif;
```

### 2.2 字号

| 元素 | 字号 | 字重 |
|------|------|------|
| 正文 | 14px | 400 |
| 标题 | 24px | 500 |
| 导航标签 | 16px | 500 |
| 按钮 | 14px | 500 |
| 编辑器 | 16px | 400 |

---

## 3. 圆角系统

从爬取数据提取的圆角值：

| 值 | 用途 |
|----|------|
| 3px | 小按钮 |
| 8px | 标准按钮、卡片 |
| 24px | 圆形图标/头像 |

---

## 4. 组件样式

### 4.1 导航菜单项

```css
.menu-item {
  width: 175px;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  padding: 0;
  border-radius: 0;
}

/* 默认状态 */
.menu-item {
  color: rgb(138, 143, 153);  /* 灰色 */
}

/* 激活状态 */
.menu-item.selected {
  color: rgb(17, 20, 24);     /* 深黑 */
}
```

### 4.2 按钮

```css
/* 主按钮 */
.n-button--color {
  background-color: rgba(41, 45, 52, 0.1);  /* 半透明深色 */
  color: rgb(255, 255, 255);
  border-radius: 8px;
  padding: 0 16px;
  height: 32px;
  font-size: 14px;
  font-weight: 500;
}

/* 次级按钮 */
.n-button--default-type {
  background-color: rgb(255, 255, 255);
  color: rgb(51, 54, 57);
  border-radius: 8px;
  padding: 0 12px;
  height: 24px;
}

/* 小按钮 */
.n-button--small-type {
  border-radius: 3px;
  padding: 0 10px;
  height: 28px;
}
```

### 4.3 输入框

```css
/* 搜索输入框 */
.n-input__input-el {
  width: 484px;
  height: 34px;
  font-size: 14px;
  padding: 0;
  background: transparent;
}

/* Tiptap 编辑器 */
.tiptap.ProseMirror.aie-content {
  width: 710px;
  height: 80px;
  font-size: 16px;
  padding: 4px 10px;
  color: rgb(17, 20, 24);
}

/* AI 聊天输入 */
textarea {
  font-size: 16px;
  color: rgb(31, 41, 55);
  background: transparent;
}
```

### 4.4 AI 助手界面

```css
/* AI 页面背景 */
.ai-layout {
  background-color: rgb(242, 242, 243);  /* #F2F2F3 */
}

/* 用户消息气泡 */
--aie-chat-item-user-bg-color: #2a88ff;  /* 蓝色 */
--aie-chat-item-user-text-color: #fff;

/* AI 消息气泡 */
--aie-chat-item-assistan-bg-color: #fff;
--aie-chat-item-assistan-text-color: #333;

/* 代码块 */
--aie-chat-item-pre-bg-color: #f1f1f1;
```

---

## 5. 布局尺寸

### 5.1 头部

```css
--header-height: 76px;
```

### 5.2 侧边栏

```css
width: 175px;
padding: 0;
```

### 5.3 主内容区

```css
width: 774px;  /* 或 746px，带 padding */
padding: 0 14px;
```

---

## 6. 关键发现与建议

### 6.1 配色调整建议

**Get笔记 实际使用的是深灰主色，不是紫色**

建议 Prism 配色方案调整为：

```css
:root {
  /* 主色 - 深灰偏蓝 */
  --primary: 220 17% 14%;           /* #1e2329 */
  --primary-foreground: 0 0% 98%;
  
  /* 或者保持紫色作为 Prism 的品牌特色 */
  /* 这取决于你是否想 1:1 复制还是有自己风格 */
}
```

### 6.2 组件实现优先级

1. **侧边栏导航** - 已有样式数据
2. **Tiptap 编辑器** - Get笔记 使用 Tiptap (ProseMirror)
3. **AI 聊天界面** - 有完整的 CSS 变量
4. **标签系统** - 爬取了 89 个标签样式

### 6.3 技术栈参考

从爬取的 HTML/CSS 类名分析，Get笔记 使用：
- **UI 框架**: Naive UI (`n-button`, `n-input`, `n-layout`)
- **编辑器**: Tiptap / ProseMirror (`aie-content`)
- **图标**: Iconfont

---

## 7. 文件清单

```
crawled-assets/
├── app-main.png              # 主界面截图
├── app-fullpage.png          # 完整页面截图  
├── app-styles.json           # 提取的样式 (35KB)
├── app-texts.json            # UI 文案
├── page-ai-assistant.png     # AI 助手页面
├── page-knowledge-base.png   # 知识库页面
├── page-tags.png             # 标签页面
├── page-home.png             # 首页
├── page-source.html          # 完整 HTML 源码 (321KB)
├── tag-styles.json           # 89 个标签样式
└── final-design-analysis.md  # 本报告
```

---

## 8. 下一步行动

1. **决定配色方向**：
   - A) 完全复制 Get笔记 的深灰配色
   - B) 保持 Prism 紫色品牌色，参考 Get笔记 的布局和组件

2. **更新 CSS 变量**：根据决定更新 `globals.css`

3. **实现组件**：按优先级实现 UI 组件

4. **参考源码**：`page-source.html` 包含完整的 HTML 结构，可以参考实现
