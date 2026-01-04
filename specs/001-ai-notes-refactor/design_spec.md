# Prism Next - Frontend Design Specification

**文档版本**: v1.1 (Visuals Added)
**关联文档**: `spec.md`
**目标**: 定义 Prism Next 的用户界面 (UI)、交互流程 (UX) 和前端技术实现标准。

---

## 1. 设计原则 (Design Principles)

Prism Next 不是一个传统的笔记 App，而是一个 **Life OS**。界面设计必须体现：

1.  **Fluid (流体)**: 操作应如水般流畅。输入、搜索、回顾在同一个界面流中完成，无生硬的页面跳转。
2.  **Invisible AI (隐形智能)**: AI 不是一个弹窗，而是界面的“结缔组织”。它自动补全标签、自动摘要、自动关联，存在于无形之中。
3.  **Calm (平静)**: 作为一个 Life OS，它承载大量信息，但设计应保持克制与留白，避免信息过载。
4.  **Local-First (本地感)**: 即使有云同步，操作反馈（点击、输入）必须是 0ms 延迟的本地响应。

---

## 2. 前端技术栈 (Tech Stack)

基于 `spec.md` 的决策，前端采用 **Next.js + Capacitor**。以下是具体的组件库选型：

*   **Core Framework**: `Next.js 14+` (App Router)
*   **Styling**: `Tailwind CSS` (原子化 CSS 标准)
*   **UI Components**: `shadcn/ui` (基于 Radix UI，高可定制，复制即用)
*   **Icons**: `Lucide React` (统一、现代的图标集)
*   **Animations**: `Framer Motion` (复杂交互动画，如卡片展开、列表重排)
*   **State Management**: `Zustand` (轻量级全局状态，优于 Redux/Context)
*   **Local DB**: `SQLite` (via capacitor-community/sqlite) + `Kysely` (Type-safe SQL builder)
*   **Mobile Specifics**:
    *   `Vaul`: 仿 iOS 原生体验的 Drawer（抽屉）组件。
    *   `Sonner`: 优雅的 Toast 通知。

---

## 3. 布局架构 (Layout Architecture)

系统根据设备类型自动适配两种模式：**Companion Mode (移动端)** 和 **Workstation Mode (桌面端)**。

### 3.1 Mobile: Companion Mode (伴侣模式)
*单手操作优先，侧重于“记录”和“碎片浏览”。*

*   **Bottom Navigation (隐形)**: 只有在滚动到底部或通过手势呼出时显示。
*   **Sticky Omnibar (底部常驻)**: 这是核心入口。
    *   [ 🎤 ] (按住录音)
    *   [ 输入框 ] (输入/搜索/指令)
    *   [ + ] (拍照/上传)
*   **Main View (Feed)**: 无限滚动的时间轴。
    *   混合展示：笔记卡片、位置轨迹图、健康数据摘要、AI 早报。
*   **Top Bar**:
    *   左侧: 当前位置/天气（Context）。
    *   右侧: 个人头像（Profile/Settings）。

### 3.2 Desktop: Workstation Mode (工作台模式)
*   *信息密度优先，侧重于“整理”、“深度阅读”和“决策”。*

*   **Three-Column Layout (三栏布局)**:
    1.  **Left Sidebar (Navigation)**: 
        *   Inbox, Timeline, Knowledge Graph, Review, Settings.
        *   Tags / Saved Searches.
    2.  **Center Stage (Deep Focus)**: 
        *   Omnibar 置顶。
        *   主要内容区域（Feed 流 或 Editor 编辑器）。
    3.  **Right Sidebar (Context & AI)**: 
        *   **Context**: 当前选中笔记的“自动关联 (Auto-linking)”推荐。
        *   **Chat**: 与 AI 的对话历史。
        *   **Inspector**: 元数据查看（位置地图、详细属性）。

---

## 4. 核心组件规范 (Core Components)

### 4.1 Omnibar (全能输入栏)
*最复杂的组件，集成了 Command Palette 和 Chat Input。*

*   **状态 1: Idle (闲置)**
    *   显示 Placeholder: *"What's on your mind?"*
    *   右侧显示麦克风图标。
*   **状态 2: Typing (输入中)**
    *   **Prefix Logic**:
        *   `/` -> 弹出 **Command Menu** (如 `/review`, `/gym`, `/sleep`)。
        *   `?` -> 切换为 **Search Mode** (搜索/RAG)。
        *   `@` -> 弹出 **Reference Menu** (引用已有笔记/思维模型)。
        *   无前缀 -> 默认 **Capture Mode** (直接记录) 或 **Chat Mode** (视上下文而定)。
*   **状态 3: Recording (录音中)**
    *   输入框变为声波纹动画 (Visualizer)。
    *   上滑锁定录音，松手发送。

### 4.2 Note Card (笔记卡片)
*信息流的基本单元。*

*   **Header**: 
    *   左侧: 时间戳 (e.g., "10:42 AM") + 地点 (e.g., "Starbucks, Hangzhou")。
    *   右侧: 来源图标 (e.g., 微信/B站/语音)。
*   **Body**:
    *   **Markdown 渲染区**: 支持缩略图、代码块、数学公式。
    *   **AI Summary** (可选): 针对长内容（如文章/视频），默认折叠，点击展开。
*   **Footer**:
    *   **Tags**: `#idea` `#work` (AI 自动生成 + 手动)。
    *   **Actions**: Edit, Share, Delete, *Auto-link Count* (点击展开关联)。

### 4.3 Dynamic Dashboard (动态仪表盘)
*基于 Vercel Generative UI 理念。*

*   这不是一个写死的页面，而是一个**容器 (Container)**。
*   当用户问 *"我上周运动情况如何？"*：
    *   AI 输出 JSON: `{ type: "bar-chart", data: [...], title: "Steps" }`。
    *   前端动态渲染 `<RechartsBar data={...} />` 组件。
*   预设组件库：
    *   KPI Card (大数字)。
    *   Trend Chart (折线/柱状图)。
    *   Map View (轨迹热力图)。
    *   Heatmap (GitHub 风格的打卡图)。

---

## 5. 关键交互流程 (Interaction Flows)

### 5.1 快速记录 (Quick Capture)
1.  用户打开 App。
2.  **场景 A (文字)**: 点击 Omnibar -> 输入 "刚才在会上想到了..." -> 回车。
    *   *反馈*: 卡片立即插入 Feed 顶部（本地 Optimistic UI）。后台异步同步+AI分析。
3.  **场景 B (语音)**: 按住麦克风 -> 说话 -> 松手。
    *   *反馈*: 显示 "Processing..." 占位符。后台 Whisper 转写完成后，替换为文本卡片。
4.  **场景 C (链接)**: 复制链接 -> 打开 App -> 提示 "Detect Link" -> 点击粘贴。
    *   *反馈*: 显示 URL 预览卡片。后台爬虫抓取后，更新为“摘要卡片”。

### 5.2 深度回顾 (Deep Review) - Desktop
1.  点击左侧 "Review"。
2.  进入 **Split View (分屏模式)**。
3.  左侧: **Raw Stream** (原始时间流)，可按日期筛选（如 "Last Week"）。
4.  右侧: **Editor** (复盘文档)。
5.  **AI 辅助**:
    *   点击 "Magic Generate"。
    *   AI 读取左侧数据，在右侧生成 "Weekly Report" 草稿（包含本周成就、情绪曲线、未完成事项）。
    *   用户在右侧编辑器中进行修改、批注。

### 5.3 决策辅助 (Decision Making)
1.  在 Omnibar 输入 "我是否应该买这个房子？"
2.  系统识别意图 -> 进入 **Chat Mode**。
3.  Chat 界面滑出（Mobile 为全屏，Desktop 为右侧栏）。
4.  **Process**:
    *   Step 1: 检索财务数据 (Assets)。
    *   Step 2: 检索相关思维模型 (System Prompts: 机会成本)。
    *   Step 3: AI 输出回答，并引用上述数据。
5.  **Result**: 一张结构化的 **"Decision Card"** 插入对话流，而非纯文本。

---

## 6. 可视化与原型 (Visualizations & Prototypes)

### 6.1 系统架构图 (System Architecture)

```mermaid
graph TD
    subgraph Client [Client Side]
        Mobile[Mobile App (Capacitor)]
        Web[Web Dashboard]
        LocalDB[(SQLite)]
    end

    subgraph Backend [Server Side (Python/FastAPI)]
        API[API Gateway]
        Worker[Async Worker]
        
        subgraph AI_Service
            Whisper[Whisper (ASR)]
            Crawler[Jina/Playwright]
            LLM[LLM / Agent]
        end
    end

    subgraph Database [PostgreSQL]
        PG_Data[(JSONB Data)]
        PG_Vec[(pgvector)]
        PG_Time[(TimescaleDB)]
    end

    Mobile -->|Sync| API
    Web -->|HTTPS| API
    Mobile <-->|Read/Write| LocalDB
    
    API --> PG_Data
    API --> Worker
    
    Worker --> Whisper
    Worker --> Crawler
    Worker --> LLM
    
    LLM --> PG_Vec
    Crawler --> PG_Data
```

### 6.2 Mobile UI Wireframe (ASCII)

```text
+-----------------------+
|  9:41             🔋  |
|  [San Francisco, 18°] |  <- Context Header
+-----------------------+
|  [ Today ]            |
|                       |
|  [ Card: Morning ]    |
|  | ☀️ Daily Briefing  |
|  | 📅 2 Meetings      |
|  +------------------+ |
|                       |
|  [ Card: Note ]       |
|  | 💡 Idea about AI   |
|  | "We should use..." |
|  | #work #ai          |
|  +------------------+ |
|                       |
|  [ Card: Location ]   |
|  | 📍 Arrived at Gym  |
|  | 10:30 AM           |
|  +------------------+ |
|                       |
|           |           |
|           V           |
|                       |
+-----------------------+
| [🎤] [ Type here... ] |  <- Sticky Omnibar
+-----------------------+
```

### 6.3 Desktop UI Wireframe (ASCII)

```text
+------------------+-----------------------------------------+----------------------+
| Prism Next       |  [ Omnibar: Search or Type...         ] |  [ Context / AI ]    |
+------------------+-----------------------------------------+----------------------+
| [Nav]            | [ Feed / Editor ]                       | [ Related Notes ]    |
|                  |                                         |                      |
| 📥 Inbox         |  Dec 25, 2025                           |  1. Project X Plan   |
| 📅 Timeline      |  -------------------------              |     (Similarity 85%) |
| 🕸️ Graph         |  [Note Card]                            |                      |
| 📝 Review        |  ## Meeting Notes                       |  2. Meeting 2024     |
|                  |  - Discussed roadmap                    |     (Similarity 70%) |
| [Tags]           |  - Agreed on Q1 goals                   |                      |
| #work            |                                         | [ Chat ]             |
| #life            |  [Location Card]                        |                      |
|                  |  📍 Starbucks, CBD                      |  User: Summarize     |
| [Settings]       |                                         |  AI: This note is... |
|                  |                                         |                      |
|                  |                                         |  [ > Type to AI... ] |
+------------------+-----------------------------------------+----------------------+
```

### 6.4 v0.dev Prompt (For High-Fidelity Prototype)

*Copy the following text to [v0.dev](https://v0.dev) to generate a live prototype.*

> Create a mobile-first "Life OS" interface using Shadcn UI, Tailwind CSS, and Lucide React icons.
>
> **Core Layout**:
> 1. A clean, minimal feed of "Cards" (Notes, Location logs, Daily Briefings) occupying the main view.
> 2. A sticky "Omnibar" at the bottom: A rounded input field with a Microphone icon on the left and a "Plus" button on the right.
> 3. A subtle top bar showing "Current Location" (e.g., "San Francisco") and "Weather" (e.g., "Partly Cloudy, 18°C").
>
> **Card Design**:
> - Cards should have soft shadows and rounded corners (xl).
> - **Note Card**: Shows a timestamp, a source icon (e.g., MessageCircle or Mic), text content, and small pill-shaped tags at the bottom.
> - **Location Card**: Shows a small map placeholder or pin icon, location name, and time.
> - **Insight Card**: A highlighted card with a gradient border, showing an "AI Insight" or "Daily Summary".
>
> **Omnibar Interactions**:
> - The input field should have a placeholder "Capture thought...".
> - The Microphone button should be prominent.
>
> **Style**:
> - Use a neutral color palette (Slate/Zinc).
> - Font: Inter or system-ui.
> - The overall feel should be "Calm" and "Fluid", like a high-end journal app.

---

*Created by CodeBuddy for Prism Next Refactor*
