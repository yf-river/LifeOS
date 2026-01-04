# 功能规范: 1:1 复刻 Get笔记 Web 前端

**功能分支**: `002-second-req-dev`
**创建时间**: 2026-01-03
**状态**: 进行中
**目标**: 完全复刻 Get笔记 Web 端 UI 和交互，复用已有后端 API
**爬取数据**: 基于 Playwright 自动化爬取 Get笔记 真实交互数据
**API 文档**: 详见 [api-reference.md](./api-reference.md) (已验证)

---

## 范围定义

**核心目标**: 1:1 复刻 Get笔记 Web 前端，聚焦 Phase A（UI 复刻）

### Phase A - Get笔记 UI 复刻 (当前优先级)

1. **三栏布局** - 侧边栏(175px) + 主内容区(774px) + AI面板(280px)
2. **Tiptap 富文本编辑器** - 基于 `tiptap ProseMirror aie-content`
3. **笔记 CRUD** - 列表、详情、创建、更新、删除（API 已验证）
4. **标签系统** - 系统标签 + 用户标签
5. **AI 助手面板** - 快捷提问、文件问答

### Phase B/C - 后续迭代 (暂缓)

- GraphRAG 知识图谱
- Mobile App 优化
- Active Intelligence

---

## 🔬 交互逻辑分析 (基于爬取数据)

> 以下交互逻辑基于 2026-01-03 对 Get笔记 的自动化爬取分析

### 1. 主界面结构

```
┌────────────────────────────────────────────────────────────────────┐
│ [Logo: Get笔记]                              [搜索] [通知] [历史]  │
├─────────────┬──────────────────────────────────┬───────────────────┤
│             │  全部笔记 ▼        🔄 刷新        │                   │
│  ● 首页     │                                  │  AI 助手面板      │
│    AI助手   │  ┌────────────────────────────┐  │                   │
│    知识库   │  │ 记录现在的想法...          │  │  "你好，我是你的  │
│    标签     │  │ [图][B][色][I][1.][•] [发送]│  │   AI助手"         │
│             │  └────────────────────────────┘  │                   │
│  ─────────  │                                  │  [帮我生成周报]   │
│    小程序   │  你还可以：                       │  [整理一周待办]   │
│    下载App  │  [添加图片]  [添加链接]  [音视频] │  [24小时热点]     │
│    Get达人  │   AI智能识别  AI智能分析  转文字稿 │  [多维度深度调研] │
│             │                                  │                   │
│             │  ── 昨天 ──                      │  ───────────────  │
│  (175px)    │  ┌────────────────────────────┐  │  [Get日报]        │
│             │  │ [AI] Coze智能体开发实战... │  │                   │
│             │  │ 智能体定义...              │  │  基于选定范围提问 │
│             │  │ [AI链接笔记][Cos智能体]... │  │  [+ 自动模式]     │
│             │  │ 创建于 2026-01-02 17:36:55 │  │                   │
│             │  └────────────────────────────┘  │                   │
│             │           (774px)                │     (280px)       │
└─────────────┴──────────────────────────────────┴───────────────────┘
```

### 2. 添加图片交互流程 (AI 智能识别)

```
用户点击 [添加图片]
     │
     ▼
┌─────────────────────────────┐
│    选择图片来源             │
│  ┌─────────┐ ┌─────────┐   │
│  │ 本地上传 │ │ 拍照    │   │
│  └─────────┘ └─────────┘   │
└─────────────────────────────┘
     │
     ▼ 选择/拍摄图片
     │
┌─────────────────────────────┐
│  图片上传到 OSS             │
│  URL: get-notes.umiwi.com   │
│  格式: JPEG, PNG            │
│  处理: resize, m_lfit       │
└─────────────────────────────┘
     │
     ▼ 调用 AI 识别 API
     │
┌─────────────────────────────┐
│  AI 智能识别处理:           │
│  1. OCR 文字识别            │
│  2. 图片内容理解            │
│  3. 自动生成标签            │
│  4. 生成内容摘要            │
└─────────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│  创建笔记:                  │
│  - 类型: "图片笔记"         │
│  - 原图附件                 │
│  - OCR 文字内容             │
│  - AI 生成的标签            │
│  - AI 内容摘要              │
└─────────────────────────────┘
```

**后端 API 需求**:
```
POST /api/v1/notes/image
Content-Type: multipart/form-data

Request:
  - image: File (JPEG/PNG, max 10MB)
  
Response:
  {
    "note_id": "uuid",
    "image_url": "https://...",
    "ocr_text": "识别的文字内容",
    "ai_summary": "AI 生成的摘要",
    "ai_tags": ["标签1", "标签2", "标签3"],
    "created_at": "2026-01-03T12:00:00Z"
  }
```

---

### 3. 添加链接交互流程 (AI 智能分析)

```
用户点击 [添加链接]
     │
     ▼
┌─────────────────────────────┐
│  输入链接 URL               │
│  ┌───────────────────────┐  │
│  │ https://example.com   │  │
│  └───────────────────────┘  │
│         [确认]  [取消]      │
└─────────────────────────────┘
     │
     ▼ 提交 URL
     │
┌─────────────────────────────┐
│  后端处理:                  │
│  1. 抓取网页内容            │
│  2. 提取标题、正文、图片    │
│  3. 调用 AI 分析内容        │
│  4. 生成摘要和标签          │
└─────────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│  创建 "AI链接笔记":         │
│  - 原始 URL                 │
│  - 网页标题                 │
│  - AI 内容摘要              │
│  - 关键要点提取             │
│  - 自动生成标签             │
│  - 预览卡片（图+标题）      │
└─────────────────────────────┘
```

**后端 API 需求**:
```
POST /api/v1/notes/link
Content-Type: application/json

Request:
  {
    "url": "https://example.com/article"
  }
  
Response:
  {
    "note_id": "uuid",
    "url": "https://...",
    "title": "网页标题",
    "favicon": "https://example.com/favicon.ico",
    "preview_image": "https://...",
    "content_text": "提取的正文内容...",
    "ai_summary": "AI 生成的摘要",
    "ai_key_points": [
      "要点1",
      "要点2",
      "要点3"
    ],
    "ai_tags": ["标签1", "标签2"],
    "note_type": "ai_link",
    "created_at": "2026-01-03T12:00:00Z"
  }
```

---

### 4. 导入音视频交互流程 (转文字稿，AI 智能总结)

```
用户点击 [导入音视频]
     │
     ▼
┌─────────────────────────────┐
│  选择音视频文件             │
│  支持格式:                  │
│  - 音频: MP3, WAV, M4A      │
│  - 视频: MP4, MOV, AVI      │
│  最大: 500MB / 60分钟       │
└─────────────────────────────┘
     │
     ▼ 上传文件
     │
┌─────────────────────────────┐
│  显示上传进度               │
│  ████████░░░░░░░ 60%        │
└─────────────────────────────┘
     │
     ▼ 后端处理 (异步)
     │
┌─────────────────────────────┐
│  1. 音频提取 (如果是视频)   │
│  2. 语音识别 (ASR)          │
│     - 支持多语言            │
│     - 时间戳对齐            │
│  3. AI 智能总结             │
│     - 生成摘要              │
│     - 提取关键时间点        │
│     - 生成标签              │
└─────────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│  创建 "录音笔记":           │
│  - 原始音视频附件           │
│  - 完整文字稿               │
│  - 时间戳标记               │
│  - AI 内容总结              │
│  - 关键时间点列表           │
│  - 自动生成标签             │
└─────────────────────────────┘
```

**后端 API 需求**:
```
# 1. 上传音视频文件
POST /api/v1/notes/media/upload
Content-Type: multipart/form-data

Request:
  - media: File (MP3/WAV/MP4/MOV, max 500MB)
  
Response:
  {
    "upload_id": "uuid",
    "status": "processing",
    "estimated_time": 120  // 预计处理时间（秒）
  }

# 2. 查询处理状态
GET /api/v1/notes/media/{upload_id}/status

Response:
  {
    "status": "processing" | "completed" | "failed",
    "progress": 75,  // 百分比
    "note_id": "uuid"  // 完成后返回
  }

# 3. 获取处理结果
GET /api/v1/notes/{note_id}

Response:
  {
    "note_id": "uuid",
    "note_type": "audio" | "video",
    "media_url": "https://...",
    "duration": 3600,  // 秒
    "transcript": [
      {
        "start": 0,
        "end": 5.2,
        "text": "大家好，今天我们来聊一聊..."
      },
      ...
    ],
    "ai_summary": "本次录音主要讨论了...",
    "ai_key_moments": [
      { "time": 120, "title": "关键观点1" },
      { "time": 450, "title": "关键观点2" }
    ],
    "ai_tags": ["录音笔记", "会议", "产品讨论"],
    "created_at": "2026-01-03T12:00:00Z"
  }
```

---

### 5. 标签系统交互逻辑

**标签生成方式**:
1. **AI 自动生成** - 基于笔记内容智能生成（最常用）
2. **手动添加** - 用户点击 "+ 添加标签" 输入
3. **系统标签** - 预设的分类标签（如 "AI链接笔记"、"图片笔记"、"录音笔记"）

**标签数据结构** (从爬取分析):
```
标签类型:
- system: 系统预设标签（带特殊图标）
  - "AI链接笔记" (icon: ai_link)
  - "图片笔记"
  - "录音笔记"
- user: 用户/AI 生成的普通标签

标签样式:
- 背景: rgb(255, 255, 255) - 白色
- 文字: rgb(103, 112, 132) - 灰色
- 边框: 浅灰色
- 组件: n-tag (Naive UI)
```

**爬取到的实际标签示例** (86个标签):
- 录音笔记, 图片笔记, AI链接笔记 (系统标签)
- AI, 人工智能, AI时代, AI教育应用, AI插件开发 (AI 相关)
- 大模型应用, Cos智能体, 企业级应用平台, 工作流编排, 智能体构建 (技术主题)
- 康波周期, 家庭教育 (生活主题)

**后端 API 需求**:
```
# 1. 获取标签列表
GET /api/v1/tags?page=1&limit=50

Response:
  {
    "total": 86,
    "tags": [
      {
        "id": "uuid",
        "name": "AI链接笔记",
        "type": "system",
        "icon": "ai_link",
        "count": 5,  // 关联笔记数
        "color": null
      },
      {
        "id": "uuid",
        "name": "人工智能",
        "type": "user",
        "icon": null,
        "count": 3,
        "color": "blue"
      }
    ]
  }

# 2. AI 自动生成标签
POST /api/v1/ai/generate-tags
Content-Type: application/json

Request:
  {
    "content": "笔记内容文本...",
    "max_tags": 5
  }
  
Response:
  {
    "tags": ["标签1", "标签2", "标签3"],
    "confidence": [0.95, 0.88, 0.72]
  }

# 3. 批量管理标签
POST /api/v1/tags/batch
{
  "action": "merge" | "delete" | "rename",
  "source_tag_ids": ["uuid1", "uuid2"],
  "target_tag_name": "新标签名"  // for merge/rename
}
```

---

### 6. 笔记详情页交互

**从截图分析的笔记详情结构**:

```
┌────────────────────────────────────────────────────────────────┐
│ ← 返回上一页    [追加笔记] [✎ 编辑] [分享笔记] [···]           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Coze智能体开发实战教程：从入门到精通的10个案例解析             │
│  编辑于：2026-01-02 17:38:05                                   │
│                                                                │
│  标签: [AI链接笔记] [Cos智能体] [大模型应用] [AI插件开发]      │
│        [+ 添加标签] [✨ 智能标签]                              │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 🔗 【DeepSeek系列教程】Coze(扣子）工作流-10套实战案例... │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  📖 核心概念与平台介绍                                         │
│                                                                │
│  ## 智能体定义                                                 │
│  **本质**：以大语言模型(如DeepSeek、豆包)为核心，结合工具插件、│
│  知识库和工作流，实现自动化任务处理的AI应用。                  │
│                                                                │
│  **与基础大模型区别**：大模型是"通用知识库"，智能体是"定制化   │
│  专家"，可集成插件、记忆存储和业务流程。                       │
│                                                                │
│  ## 开发平台                                                   │
│  **推荐工具**：字节跳动旗下Cos平台（国内主流智能体开发平台），  │
│  支持可视化搭建、插件集成和多渠道发布。                        │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 🤖 智能体基础搭建流程                                     │ │
│  │ ┌────────┬─────────────┬──────────────────────┐         │ │
│  │ │ 步骤   │ 操作要点    │ 示例（深夜情感客服） │         │ │
│  │ ├────────┼─────────────┼──────────────────────┤         │ │
│  │ │ 1.创建 │ 命名、描述  │ 名称：深夜情感客服   │         │ │
│  │ │ 2.选模型│ 配置AI    │ 默认选用豆包         │         │ │
│  │ │ 3.提示词│ 定义角色  │ 情感呵护机器人       │         │ │
│  │ │ 4.优化 │ 迭代测试   │ 通过"优化"按钮完善   │         │ │
│  │ │ 5.部署 │ 发布渠道   │ 生成链接供他人访问   │         │ │
│  │ └────────┴─────────────┴──────────────────────┘         │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  右侧 AI 面板:                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 新对话                                                    │ │
│  │                                                           │ │
│  │ Prism本质是"个人决策流程的AI化重构"，同时希望通过长期主义 │ │
│  │ （如"1000天后的世界"）布局知识体系，避免被短期技术迭代淘汰 │ │
│  │                                                           │ │
│  │ 五、行为标签：结构化、长期主义、实践导向                  │ │
│  │ • 结构化实践者：无论是Prism的"六层模型""核心工作流"...   │ │
│  │ • 长期主义学习者：收藏内容涵盖"通识书单""康波周期""1000 │ │
│  │   天后的世界"...                                         │ │
│  │                                                           │ │
│  │ 总结：你是AI时代典型的"系统构建型知识工作者"              │ │
│  │                                                           │ │
│  │ ┌─────────────────────────────────────────────────────┐ │ │
│  │ │ 基于选择的文件提问                                   │ │ │
│  │ │ [+] [⚡ 自动模式] [📄][🌐][😊]              [发送] │ │ │
│  │ └─────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ [Coze智能体开发实...] AI链接笔记                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│         [🔄][📋][👍][👎]                      [+ 保存笔记]     │
└────────────────────────────────────────────────────────────────┘
```

**关键交互功能**:
1. **追加笔记** - 在当前笔记下追加内容
2. **编辑** - 进入编辑模式
3. **分享笔记** - 生成分享链接
4. **添加标签** - 手动添加新标签
5. **智能标签** - AI 生成推荐标签
6. **AI 面板** - 基于当前笔记进行 AI 对话
7. **保存笔记** - 保存 AI 对话内容为新笔记

---

### 7. AI 助手页面交互

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                     💬 你好，我是你的AI助手                    │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 基于选定范围提问                                         │ │
│  │                                                           │ │
│  │ [+] [⚡ 自动模式] [📄][🌐][😊]                  [发送]  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  快捷提问:                                                     │
│  [Get日报] [帮我生成周报] [整理一周待办] [24小时热点]          │
│  [多维度深度调研] [寻找解决方案] [搜索金句/观点]              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**AI 助手功能**:
1. **自动模式** - AI 自动选择最佳响应方式
2. **文件选择** - 基于选定的笔记/文件进行问答
3. **快捷提问** - 预设的常用提问模板
4. **Get日报** - 自动生成每日摘要

---

## UI 设计规范 - Get笔记 风格 (1:1 还原)

### 配色方案 (基于爬取数据修正)

**重要**: 爬取数据显示 Get笔记 实际主色是 **深灰偏蓝**，而非紫色

```css
/* 实际爬取的 CSS 变量 */
--primary: 220 17% 14%;           /* #1e2329 深灰偏蓝 */
--primary-foreground: 0 0% 98%;
--background: 0 0% 100%;          /* 纯白 */
--foreground: 240 10% 3.9%;       /* 深色文字 */

/* 边框和表面 */
--border: 240 5.9% 90%;           /* #e4e4e7 */
--card: 0 0% 100%;

/* AI 聊天相关 */
--chat-background: #F2F2F3;
--aie-chat-item-user-bg-color: #2a88ff;  /* 用户消息-蓝色 */
--aie-chat-item-assistan-bg-color: #fff;

/* 侧边栏 */
--sidebar-background: 0 0% 98%;
--sidebar-foreground: 240 5.3% 26.1%;
```

### 布局尺寸 (爬取数据)

| 区域 | 宽度 | 高度 |
|------|------|------|
| 侧边栏 | 175px | 100vh |
| 主内容区 | 774px | 自适应 |
| AI 面板 | 280px | 100vh |
| Header | 100% | 76px |
| 导航项 | 175px | 44px |

### 组件样式 (爬取数据)

#### 按钮
```css
/* 主按钮 */
border-radius: 8px;
padding: 0 16px;
height: 32px;
font-size: 14px;
font-weight: 500;
background: rgb(17, 20, 24);  /* 深色 */
color: white;

/* 次按钮 */
background: white;
border: 1px solid #e5e6ea;
color: rgb(51, 54, 57);
```

#### 标签
```css
/* n-tag 组件 */
background: rgb(255, 255, 255);
color: rgb(103, 112, 132);
border-radius: 4px;
padding: 0 8px;
font-size: 12px;

/* 系统标签带图标 */
.n-tag--icon {
  padding-left: 4px;
}
```

#### 编辑器
```css
/* Tiptap ProseMirror */
.tiptap.ProseMirror.aie-content {
  width: 710px;
  font-size: 16px;
  color: rgb(17, 20, 24);
  padding: 4px 10px;
}
```

---

## 用户场景与测试 *(必填)*

### Phase C - AI 智能识别功能 (新增)

#### 用户故事 C4 - 图片 AI 智能识别 (优先级: P0)

用户希望上传图片后，系统自动识别图片内容，生成文字描述和标签。

**优先级原因**: 这是 Get笔记 的核心差异化功能，必须实现。

**交互流程**:
1. 用户点击 "添加图片" 按钮
2. 选择本地图片或拍照
3. 图片上传到 OSS
4. 后端调用 AI 进行 OCR + 内容理解
5. 自动生成笔记（含 OCR 文字、AI 摘要、自动标签）
6. 笔记类型标记为 "图片笔记"

**验收场景**: 
1. **给定** 用户上传一张包含文字的图片，**当** 处理完成，**那么** 笔记包含 OCR 识别的文字内容。
2. **给定** 用户上传一张风景照片，**当** 处理完成，**那么** 笔记包含 AI 生成的图片描述和相关标签。

---

#### 用户故事 C5 - 链接 AI 智能分析 (优先级: P0)

用户希望粘贴一个链接后，系统自动抓取内容，生成摘要和关键要点。

**优先级原因**: 知识收集的重要入口。

**交互流程**:
1. 用户点击 "添加链接" 按钮
2. 输入/粘贴 URL
3. 后端抓取网页内容
4. AI 分析生成摘要、关键要点、标签
5. 创建 "AI链接笔记"，显示预览卡片

**验收场景**: 
1. **给定** 用户输入一篇技术文章 URL，**当** 处理完成，**那么** 笔记包含文章标题、摘要、关键要点。
2. **给定** 用户输入一个视频链接，**当** 处理完成，**那么** 笔记包含视频标题和内容摘要。

---

#### 用户故事 C6 - 音视频转文字 (优先级: P1)

用户希望上传音视频文件后，系统自动转为文字稿并生成总结。

**优先级原因**: 录音场景需求量大。

**交互流程**:
1. 用户点击 "导入音视频" 按钮
2. 选择本地音视频文件 (MP3/WAV/MP4/MOV)
3. 上传并显示进度条
4. 后端异步处理：提取音频 → ASR 语音识别 → AI 总结
5. 创建 "录音笔记"，含完整文字稿、时间戳、AI 总结

**验收场景**: 
1. **给定** 用户上传一段 10 分钟的会议录音，**当** 处理完成，**那么** 笔记包含完整文字稿和时间戳标记。
2. **给定** 处理时间超过 30 秒，**当** 用户查看状态，**那么** 显示处理进度百分比。

---

### Phase B - Phase 2 完善

#### 用户故事 B1 - GraphRAG 知识图谱 (优先级: P0)

(保持原有内容)

#### 用户故事 B2 - 自动双向链接 (优先级: P0)

(保持原有内容)

#### 用户故事 B3 - Block-Level 引用 (优先级: P1)

(保持原有内容)

---

## 需求 *(必填)*

### 功能需求

#### Phase C - AI 智能识别 (新增)

- **FR-C10**: 系统必须支持图片上传和 AI OCR 识别。
- **FR-C11**: 系统必须支持图片内容 AI 理解，生成描述和标签。
- **FR-C12**: 系统必须支持 URL 内容抓取和 AI 分析。
- **FR-C13**: 系统必须支持链接预览卡片生成（标题、图片、摘要）。
- **FR-C14**: 系统必须支持音视频文件上传（MP3/WAV/MP4/MOV，最大 500MB）。
- **FR-C15**: 系统必须支持语音识别 (ASR)，输出带时间戳的文字稿。
- **FR-C16**: 系统必须支持 AI 总结长文本/长音频，生成关键要点。
- **FR-C17**: 系统必须支持异步处理，提供进度查询接口。
- **FR-C18**: 系统必须自动为所有笔记生成 AI 推荐标签。

#### Phase C - Mobile & UI (原有)

- **FR-C01**: UI 必须完全遵循 Get笔记 设计规范（颜色、间距、圆角）。
- **FR-C02**: 必须实现 Omnibar 快速输入组件，支持富文本编辑。
- **FR-C03**: 必须实现彩色标签系统，支持系统标签和用户标签。
- **FR-C04**: 必须显示笔记类型标识（AI链接笔记、图片笔记、录音笔记）。
- **FR-C05**: Android 应用必须支持离线模式，本地 SQLite 存储。
- **FR-C06**: 必须实现冲突检测与解决机制。

#### Phase B - Knowledge Graph (原有)

- **FR-B01**: 系统必须实现 GraphRAG 算法，自动发现笔记间的语义关联。
- **FR-B02**: 系统必须提供知识图谱可视化界面，支持缩放和节点拖拽。
- **FR-B03**: 系统必须支持 `[[WikiLink]]` 语法创建笔记间链接。
- **FR-B04**: 系统必须维护双向链接索引，在被引用笔记中显示"反向链接"。
- **FR-B05**: 系统必须支持 Block-Level 唯一标识符（Block ID），允许精确引用。

#### Phase A - Active Intelligence (原有)

- **FR-A01**: 系统必须提供事件总线，支持基于位置和时间的规则触发。
- **FR-A02**: 系统必须实现 SRS 算法（FSRS）管理复习队列。
- **FR-A03**: 系统必须实现 MCP 客户端接口。
- **FR-A04**: 系统必须提供数据迁移工具，支持从 JSONL/Markdown 导入。

---

### 关键实体 (基于已验证 API)

```
Note {
  id: UUID                      // note_id
  user_id: UUID
  title: String?
  content: Text                 // 纯文本内容
  json_content: Text            // Tiptap ProseMirror JSON (字符串化)
  version: Integer              // 乐观锁版本号，更新时必须携带
  note_type: Enum (text, image, ai_link, audio, video)
  ai_generated: Boolean
  ai_summary: Text?
  source_url: String?           // for ai_link type
  media_url: String?            // for audio/video type
  media_duration: Integer?      // seconds
  created_at: Timestamp
  updated_at: Timestamp
}

NoteBlock {
  id: UUID
  block_id: String (唯一标识，用于 Block-Level 引用)
  note_id: UUID
  content: Text
  block_type: Enum (paragraph, heading, list, table, code, image, link_preview)
  ai_generated: Boolean
  created_at: Timestamp
}

Tag {
  id: UUID
  name: String
  type: Enum (system, user)     // system = 系统预设, user = 用户/AI 生成
  icon: String?                 // for system tags (ai_link, image, audio)
  color: String?                // for user tags
  user_id: UUID
  created_at: Timestamp
}

NoteTag {
  note_id: UUID
  tag_id: UUID
  source: Enum (ai, user)       // 标签来源：AI 生成还是用户添加
  confidence: Float?            // AI 生成时的置信度
}

MediaTranscript {
  id: UUID
  note_id: UUID
  segments: JSONB [             // 分段文字稿
    { start: Float, end: Float, text: String }
  ]
  full_text: Text               // 完整文字稿
  language: String              // 检测到的语言
  created_at: Timestamp
}

LinkPreview {
  id: UUID
  note_id: UUID
  url: String
  title: String
  description: String?
  image_url: String?
  favicon_url: String?
  fetched_content: Text?        // 抓取的正文
  created_at: Timestamp
}

AIProcessingTask {
  id: UUID
  note_id: UUID?
  task_type: Enum (ocr, link_analysis, asr, summarize, tag_generation)
  status: Enum (pending, processing, completed, failed)
  progress: Integer             // 0-100
  result: JSONB?
  error_message: String?
  created_at: Timestamp
  completed_at: Timestamp?
}

WikiLink { ... }  // 原有
Rule { ... }      // 原有
Flashcard { ... } // 原有
```

---

### 后端 API 清单

> **核心 CRUD API 已验证**，详见 [api-reference.md](./api-reference.md)

#### 笔记 CRUD (已验证 ✅)

| 方法 | 路径 | 描述 | 状态 |
|------|------|------|------|
| GET | `/voicenotes/web/notes` | 获取笔记列表 | ✅ 已验证 |
| GET | `/voicenotes/web/notes/{id}` | 获取笔记详情 | ✅ 已验证 |
| POST | `/voicenotes/web/notes` | 创建笔记 | ✅ 已验证 |
| PUT | `/voicenotes/web/notes/{id}` | 更新笔记 | ✅ 已验证 |
| DELETE | `/voicenotes/web/notes/{id}` | 删除笔记 | ✅ 已验证 |

#### AI 功能 (规划中)

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/notes/image` | 上传图片，AI 识别 |
| POST | `/api/v1/notes/link` | 提交链接，AI 分析 |
| POST | `/api/v1/notes/media/upload` | 上传音视频文件 |
| GET | `/api/v1/notes/media/{id}/status` | 查询处理状态 |
| POST | `/api/v1/ai/generate-tags` | AI 生成标签 |
| POST | `/api/v1/ai/summarize` | AI 生成摘要 |
| GET | `/api/v1/tags` | 获取标签列表 |
| POST | `/api/v1/tags/batch` | 批量标签操作 |

---

## 成功标准 *(必填)*

### Phase C - AI 智能识别 (新增)

- **SC-C10**: 图片 OCR 准确率 > 95%。
- **SC-C11**: 链接内容抓取成功率 > 90%。
- **SC-C12**: 音视频转文字准确率 > 90%（标准普通话）。
- **SC-C13**: AI 标签生成相关性 > 80%（用户接受率）。
- **SC-C14**: 图片处理时间 < 10 秒。
- **SC-C15**: 链接分析时间 < 15 秒。
- **SC-C16**: 音视频处理速度 > 1x 实时（1 分钟音频处理时间 < 1 分钟）。

### Phase C - Mobile & UI (原有)

- **SC-C01**: UI 设计与 Get笔记 一致性 > 95%。
- **SC-C02**: 离线笔记同步成功率 > 99.9%。
- **SC-C03**: 冲突解决正确率 100%。
- **SC-C04**: Omnibar 响应时间 < 100ms。

### Phase B (原有)

- **SC-B01**: 知识图谱能在 3 秒内渲染 1000 个节点。
- **SC-B02**: 双向链接索引更新延迟 < 500ms。
- **SC-B03**: Block-Level 引用准确率 100%。

### Phase A (原有)

- **SC-A01**: 规则引擎能在事件发生后 5 秒内触发动作。
- **SC-A02**: 每日简报生成时间 < 10 秒。
- **SC-A03**: 旧数据迁移成功率 100%。

---

## 技术决策

### AI 服务选型

| 功能 | 推荐方案 | 备选方案 |
|------|----------|----------|
| OCR 文字识别 | 腾讯云 OCR / 阿里云 OCR | PaddleOCR (自部署) |
| 图片内容理解 | GPT-4V / Claude Vision | Qwen-VL |
| 链接内容抓取 | Playwright + Jina Reader | Firecrawl |
| 语音识别 ASR | 讯飞 / 腾讯 ASR | Whisper (自部署) |
| AI 总结/标签 | DeepSeek / GPT-4 | Qwen-72B |

### 文件存储

- **选型**: 阿里云 OSS / 腾讯云 COS
- **理由**: 爬取数据显示 Get笔记 使用 `get-notes.umiwi.com` (OSS)

### 异步任务处理

- **选型**: Celery + Redis
- **理由**: 音视频处理耗时较长，需要异步队列

### 富文本编辑

- **选型**: Tiptap (基于 ProseMirror)
- **理由**: Get笔记 使用 Tiptap (`tiptap ProseMirror aie-content`)

---

## 附录: 爬取数据文件

| 文件 | 描述 |
|------|------|
| `crawled-assets/app-main.png` | 主界面截图 |
| `crawled-assets/app-styles.json` | 提取的 CSS 样式 (35KB) |
| `crawled-assets/page-ai-assistant.png` | AI 助手页面 |
| `crawled-assets/page-tags.png` | 标签管理页面 |
| `crawled-assets/interactions/06-note-detail.png` | 笔记详情页 |
| `crawled-assets/interactions/05-note-cards-analysis.json` | 笔记卡片结构 |
| `crawled-assets/interactions/07-tags-analysis.json` | 标签系统分析 (86个标签) |
| `crawled-assets/interactions/10-captured-api-requests.json` | API 请求捕获 |
| `gap-analysis.md` | 1:1 复刻差距分析报告 |

---

## 附录: 编辑器详细配置 (Tiptap)

### 识别到的编辑器信息

```javascript
// 编辑器类型确认
{
  type: "tiptap/prosemirror",
  className: "tiptap ProseMirror aie-content",
  editorAttributes: [
    { name: "class", value: "tiptap ProseMirror aie-content" },
    { name: "contenteditable", value: "true" },
    { name: "translate", value: "no" },
    { name: "tabindex", value: "0" }
  ]
}
```

### 推荐的 Tiptap 扩展配置

```typescript
// 基于 Get笔记 功能逆向推断的扩展列表
const extensions = [
  // 基础扩展
  StarterKit,
  Placeholder.configure({
    placeholder: '记录现在的想法...',
  }),
  
  // 文本格式
  Bold,
  Italic,
  Underline,
  Strike,
  Code,
  Highlight.configure({ multicolor: true }),
  
  // 块级元素
  Heading.configure({ levels: [1, 2, 3] }),
  BulletList,
  OrderedList,
  TaskList,
  TaskItem.configure({ nested: true }),
  Blockquote,
  CodeBlock.configure({
    languageClassPrefix: 'language-',
  }),
  HorizontalRule,
  
  // 媒体
  Image.configure({
    inline: true,
    allowBase64: true,
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
  }),
  
  // 表格
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
  
  // 协作 (可选)
  // Collaboration,
  // CollaborationCursor,
]
```

### 编辑器 CSS 变量

```css
/* 从爬取数据提取的编辑器相关 CSS 变量 */
:root {
  --aie-text-color: #333;
  --aie-text-placeholder-color: #adb5bd;
  --aie-bg-color: #fff;
  --aie-border-color: #eee;
  
  /* 输入框 */
  --aie-input-bg-color: #fff;
  --aie-input-border-color: #e9e9e9;
  --aie-input-focus-border-color: #ccc;
  --aie-input-focus-bg-color: #fff;
  
  /* 按钮 */
  --aie-button-bg-color: #fafafa;
  --aie-button-border-color: #eee;
  --aie-button-hover-bg-color: #eee;
  --aie-button-hover-border-color: #ccc;
  
  /* 菜单 */
  --aie-menus-bg-color: #ffffff;
  --aie-menus-text-color: #333;
  --aie-menus-svg-color: #353535;
  --aie-menus-divider-color: #eaeaea;
  --aie-menus-item-hover-color: #eee;
  --aie-menus-tip-bg-color: #333;
  --aie-menus-tip-text-color: #eee;
  
  /* 弹出框 */
  --aie-popover-bg-color: #fff;
  --aie-popover-border-color: #e9e9e9;
  --aie-popover-title-color: #666;
  --aie-popover-selected-color: #eee;
  --aie-popover-text-border-color: #e4e4e4;
  
  /* 内容样式 */
  --aie-content-blockquote-bg-color: #f6f6f7;
  --aie-content-blockquote-text-color: #888888;
  --aie-content-blockquote-border-color: #e3e3e3;
  --aie-content-codeblock-bg-color: #fafafa;
  --aie-content-pre-bg-color: #f6f6f7;
  --aie-content-link-a-color: blue;
  --aie-content-link-a-hover-color: red;
  --aie-content-link-a-visited-color: purple;
  --aie-content-link-a-active-color: green;
  
  /* 表格 */
  --aie-content-table-border-color: #ced4da;
  --aie-content-table-th-bg-color: #efefef;
  --aie-content-table-selected-bg-color: rgba(200, 200, 255, .3);
  --aie-content-table-handler-color: #adf;
  --aie-menus-table-cell-border-color: #ccc;
  --aie-menus-table-cell-border-active-color: #000;
  
  /* 滚动条 */
  --aie-content-scrollbar-thumb: #c1c1c1;
  --aie-content-scrollbar-thumb-hover: #a9a9a9;
  --aie-content-scrollbar-thumb-active: #787878;
  --aie-content-scrollbar-track-piece: #f1f1f1;
  
  /* AI 聊天 */
  --aie-chat-body-bg-color: #f1f1f1;
  --aie-chat-item-user-bg-color: #2a88ff;
  --aie-chat-item-user-text-color: #fff;
  --aie-chat-item-assistan-bg-color: #fff;
  --aie-chat-item-assistan-text-color: #333;
  --aie-chat-item-pre-bg-color: #f1f1f1;
  
  /* AI 菜单 */
  --aie-menus-ai-bg-color: #353535;
  --aie-menus-ai-color: #ffffff;
}
```

---

## 附录: 已验证的 API 端点

> 完整 API 文档请查看 [api-reference.md](./api-reference.md)

### 笔记 CRUD API (已验证 ✅)

| 方法 | 路径 | 描述 | 状态 |
|------|------|------|------|
| GET | `/voicenotes/web/notes` | 获取笔记列表 | ✅ 验证通过 |
| GET | `/voicenotes/web/notes/{id}` | 获取笔记详情 | ✅ 验证通过 |
| POST | `/voicenotes/web/notes` | 创建笔记 | ✅ 验证通过 |
| PUT | `/voicenotes/web/notes/{id}` | 更新笔记 | ✅ 验证通过 |
| DELETE | `/voicenotes/web/notes/{id}` | 删除笔记 | ✅ 验证通过 |

### 技术细节

- **API 域名**: `get-notes.luojilab.com`
- **认证**: Bearer Token (JWT)
- **乐观锁**: 更新操作需要 `note_id` + `version` 字段
- **内容格式**: `json_content` 是字符串化的 Tiptap ProseMirror JSON
- **响应格式**: `{ h: {c, e, s, t, apm}, c: {...} }`，`h.c=0` 表示成功

### 认证与用户
- **GET** `/spacex/v1/web/user/info` - 获取用户基本信息
- **GET** `/spacex/v1/web/team/list?is_owner=0` - 获取团队列表

### AI 助手系统
- **GET** `/yoda/web/v1/chats/question_resource/config` - AI 配置和文件类型限制
- **POST** `/yoda/web/v1/chats/startup_shortcuts` - 获取快捷方式（如 Get日报）
- **POST** `/yoda/web/v1/chats/startup_questions` - 获取快捷提问模板
- **POST** `/yoda/web/v1/chats` - 创建新对话
- **POST** `/yoda/web/v1/chats/stream` - 流式 AI 响应
- **GET** `/yoda/web/v1/chats/entry?upstream=US_NOTE&id={note_id}` - 获取 AI 对话入口

### 技术细节
- **认证**: Bearer Token (JWT) 格式: `Authorization: Bearer {token}`
- **CSRF 保护**: 需要 `x-csrf-token` 请求头
- **响应格式**: 
  ```json
  {
    "h": { "c": 0, "e": "", "s": 时间戳, "t": 处理时间ms, "apm": "请求ID" },
    "c": { /* 实际数据 */ }
  }
  ```
- **API 域名**: `get-notes.luojilab.com`
- **文件存储**: `get-notes.umiwi.com` (OSS 存储)

### 关键发现
1. **JWT 有效负载**: `{ "uid": 1840524, "env": "production", "exp": 1770025552, "iat": 1767433552, "iss": "ddll_official" }`
2. **支持的文件类型**: PDF, DOCX, XLSX, PPT, 图片等 14 种格式
3. **AI 功能丰富**: 自动模式、文件问答、快捷提问、多维度调研等
4. **文件大小限制**: 图片 10MB, 聊天文件 100MB, 音视频 500MB
5. **处理机制**: 支持异步处理和进度查询

---

## 附录: 待补充信息清单

> 以下信息对 1:1 复刻至关重要，但尚未获取

### 优先级 P0 (阻塞开发)

- [x] **笔记 CRUD API 格式** - 已验证，详见 [api-reference.md](./api-reference.md)
  - `GET /voicenotes/web/notes` - 列表
  - `GET /voicenotes/web/notes/{id}` - 详情
  - `POST /voicenotes/web/notes` - 创建
  - `PUT /voicenotes/web/notes/{id}` - 更新（需要 `note_id` + `version` 乐观锁）
  - `DELETE /voicenotes/web/notes/{id}` - 删除
- [x] **认证机制详情** - Bearer JWT + CSRF Token
- [ ] **文件上传完整流程** - OSS 直传签名生成、分片上传、回调验证

### 优先级 P1 (影响还原度)

- [ ] **编辑器工具栏按钮顺序** - 图、B、色、I、列表等
- [ ] **快捷键映射** - Ctrl+B、Ctrl+I 等
- [ ] **自动保存机制** - 间隔时间、触发条件
- [ ] **删除确认弹窗** - 文案、按钮

### 优先级 P2 (锦上添花)

- [ ] **动画时间曲线** - 页面切换、模态框
- [ ] **骨架屏样式** - 加载占位
- [ ] **空状态设计** - 无笔记时显示
- [ ] **Toast 通知** - 位置、样式、持续时间

---

## Clarifications (2026-01-03)

### Q1: 后端策略
**问题**: Phase A 是纯前端复刻还是包含后端实现？
**决定**: **C - 全栈实现**，包含所有 AI 功能（OCR、链接分析、ASR、AI 摘要、标签生成）

### Q2: content vs json_content 字段关系
**问题**: 两个内容字段如何配合？
**决定**: **Option B**
- `json_content`：主存储，Tiptap ProseMirror JSON（字符串化）
- `content`：由后端自动生成，从 json_content 提取纯文本，用于搜索/预览
- 前端只需维护 `json_content`，后端负责同步 `content`

### Q3: 乐观锁冲突处理
**问题**: 当 version 冲突时如何处理？
**决定**: **弹窗提示 + 保留用户输入到剪贴板**
- 检测到 version 冲突时，弹出提示："笔记已被修改，请刷新后重试"
- 自动将用户未保存的内容复制到剪贴板
- 用户刷新后可手动粘贴恢复

### Q4: 前端技术栈
**问题**: 使用哪个 React UI 组件库？
**决定**: 基于 blinko 参考项目（推荐度 90%）和技术选型对比表
- **UI 库**: shadcn/ui + Tailwind CSS
- **状态管理**: Zustand
- **框架**: React 18 (Next.js)

---

## 开发策略

鉴于当前约 **90%+** 的信息掌握度（核心 CRUD API 已验证，UI/CSS 已爬取），建议采用以下策略：

### 阶段一: 框架搭建 (可立即开始)

1. 创建基础项目结构（Next.js + 对接已有后端 API）
2. 实现 UI 布局框架（基于爬取的 CSS 变量和尺寸）
3. 配置 Tiptap 编辑器（基于 `tiptap ProseMirror aie-content` 类）
4. 实现标签系统（基于爬取的 86 个标签数据）

### 阶段二: 核心功能（已验证 API）

1. 实现笔记 CRUD（已验证路径：`/voicenotes/web/notes`）
2. 实现乐观锁更新机制（`note_id` + `version`）
3. 实现 `json_content` Tiptap JSON 存储
4. 集成 AI 服务（使用 DeepSeek/腾讯 API 等）

### 阶段三: 精细调优 (边开发边完善)

1. 根据实际使用补充交互细节
2. 优化动画和微交互
3. 完善错误处理和边界情况

**预期最终还原度**: 90-95%
