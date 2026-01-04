# 功能规范: Prism Next - AI Native Life OS

**功能分支**: `001-ai-notes-refactor`
**创建时间**: 2026-01-02
**状态**: 正式版 (v5 - Future Ready)
**核心目标**: 降低认知负荷，提升生命质量。从“被动记录”转向“主动感知与辅助”。

## 1. 愿景与核心理念

Prism Next 将从一个基于脚本和命令行的“个人决策系统”进化为一个**AI 原生的、多模态的个人生活操作系统 (Life OS)**。

它不再仅仅是一个“工具”，而是一个**数字化的个人镜像（Digital Twin）**：
*   **全方位量化**: 自动记录位置、运动、健康数据，配合语音/图片/链接的主动输入。
*   **主动式智能**: 不仅是被动存储，还通过 Context Awareness (情境感知) 主动提供服务。
*   **无处不在**: 通过 Web 和 App 双端，随时随地接入。

## 2. 竞品参考与功能融合

基于对 12 个优秀开源/商业项目的分析，Prism Next 将融合以下核心优势：

| 功能模块 | 参考项目 | 核心借鉴点 | Prism Next 落地形态 |
| :--- | :--- | :--- | :--- |
| **输入层** (Ingestion) | **Memos / Blinko / Get笔记** | 碎片化记录、语音转写、多模态抓取 | **Flow 界面**: 类似社交媒体的时间流，支持语音/图片/链接一键发送。后台自动 Whisper 转写 + 内容提取。 |
| **组织层** (Organization) | **Reor / WeKnora / SiYuan** | 自动关联、知识图谱、**块级引用** | **智能图谱**: AI 自动推荐“过去相关的笔记”。使用 GraphRAG 增强“回忆”。**细粒度引用**：支持引用到段落。 |
| **分析层** (Analysis) | **Open-Notebook** | 三栏布局 | **Deep Review**: 左侧原始数据流，中间分析报告，右侧 AI 对话。 |
| **可视化** (Dashboard) | **Surf** | Surflets (AI 生成微应用) | **Dynamic UI**: 不写死仪表盘，而是允许用户自然语言要求“画一个情绪波动图”，AI 实时生成 React 组件。 |
| **决策层** (Decision) | **Lumina-Note / FastGPT** | Agent 自规划、工作流编排 | **Model Council**: 将 Prism 现有的“思维模型”实体化为独立 Agent，通过 Coordinator 调度进行“辩论”。 |
| **知识库** (Knowledge) | **Trilium / SiYuan** | 结构化树、**Frontmatter** | **Hybrid Store**: 既保留时间流的灵活性，也支持构建结构化的“人生手册”。支持 **Markdown 导出**。 |
| **学习层** (Growth) | **SiYuan / Logseq** | 间隔重复 (Flashcards) | **SRS Module**: 自动从笔记中提取知识点生成闪卡，辅助记忆。 |

## 3. 技术实现参考

核心模块将参考以下成熟开源方案或标准：

| 功能模块 | 核心难点 | 参考/依赖 (开源/标准) | 技术细节 |
| :--- | :--- | :--- | :--- |
| **Life Log (位置)** | 后台保活, 省电 | **OwnTracks**, **Capacitor Background** | 借鉴 OwnTracks 的静止休眠机制；使用 Capacitor 插件实现原生保活。 |
| **情境感知** | 规则触发 | **Home Assistant** (Automation) | 实现轻量级规则引擎 (Event Bus): `Trigger -> Condition -> Action`。 |
| **语音转写** | 准确率 | **OpenAI Whisper** | 后端部署 faster-whisper，前端录音上传音频流。 |
| **RAG/关联** | 向量检索 | **LangChain**, **pgvector** | 使用 PG 的 `pgvector` 存储 Embedding，配合 `pg_trgm` 实现**混合检索 (Hybrid Search)**。 |
| **App 壳** | 离线优先 | **Capacitor**, **SQLite** | **Offline-First**: App 端使用 SQLite 做本地缓存，有网时同步 PG。 |
| **动态 UI** | 即时生成 | **Vercel AI SDK (Generative UI)** | 后端返回 JSON 配置，前端预设基础组件库渲染。 |
| **自动化** | 连接外部世界 | **MCP (Model Context Protocol)** | 遵循 Anthropic MCP 标准，实现 Agent 的“手”（日历、邮件操作）。 |
| **安全插件** | 沙盒运行 | **WebAssembly (Wasm) / Extism** | 允许用户编写脚本插件，但在 Wasm 沙盒中运行，保障安全。 |

## 4. 架构转型

从纯本地 Markdown/JSONL 文件系统转型为 **Client-Server 架构**，但保持数据主权（Self-Hosted 优先）。

### 4.1 技术栈决策
*   **后端 (Backend)**: **Python (FastAPI)** - 数据分析与 AI 处理的霸主。
*   **前端 (Frontend)**: **TypeScript (Next.js)** - 跨平台 UI 标准。
    *   **App 端**: **Capacitor** 封装，配合 **SQLite** 实现离线优先。
*   **数据库 (Database)**: **PostgreSQL** - 统一处理：
    *   **JSONB**: 笔记内容 (NoSQL)。
    *   **pgvector**: 向量数据 (RAG)。
    *   **TimescaleDB**: 位置/健康数据 (TimeSeries)。
    *   **pg_trgm**: 关键词模糊搜索。

### 4.2 多租户与协作架构 (Multi-User)
*   **Workspace 设计**: 数据库 Schema 层面引入 `workspace_id` 和 `group_id`。
*   **场景**: 实现“家庭 OS”或“团队知识库”。笔记不再死绑定 `user_id`，而是在 `workspace` 下进行权限控制。

## 5. 核心功能规范

### 5.1 感知层 (Senses - L1)

#### 5.1.1 持续位置追踪 (Life Log)
*   **动态采样**: 静止低频，活动高频，围栏触发。
*   **数据处理**: 逆地理编码语义化。

#### 5.1.2 多模态速记 (Quick Capture)
*   **Omnibar (全能输入框)**:
    *   `/` 呼出指令。
    *   `?` 触发 RAG 搜索。
    *   粘贴链接 -> 自动解析。
    *   直接输入 -> Chat。
*   **语音/视觉**: 一键录音/拍照，AI 自动转写与识别。

### 5.2 记忆层 (Memory - L2/L4)

#### 5.2.1 混合存储与导出
*   **Block-Level ID**: 为每个段落生成唯一 Hash，支持细粒度引用。
*   **Markdown Export**: 所有笔记可导出为带 YAML Frontmatter 的标准 Markdown，保障数据自由。

#### 5.2.2 智能关联
*   **Hybrid Search**: 结合 Keyword (准确匹配) 和 Vector (语义匹配) 提升检索精度 (RRF)。
*   **Auto-linking**: 写入时后台自动计算相似度，推荐关联笔记。

### 5.3 智能层 (Brain - L3/L6)

#### 5.3.1 Proactive Chat
*   **早报**: 基于日历和状态的主动建议。
*   **SRS (间隔重复)**: 在早/晚报中穿插推送“知识闪卡”，辅助记忆。

#### 5.3.2 决策辅助
*   识别决策意图，调用思维模型 System Prompts，输出结构化分析。

### 5.4 执行层 (Hands - New)

#### 5.4.1 MCP Client
*   集成 MCP 协议，允许 Prism 连接外部工具（如 Google Calendar, Linear, Gmail）。
*   场景：AI 建议“明天早起”，用户同意后，AI 通过 MCP 自动设置闹钟或日历。

### 5.5 表现层 (Face - L5)

#### 5.5.1 Dynamic Dashboard
*   AI 生成临时 React 组件展示数据。

## 6. 详细用户场景 (User Stories)

### 场景 1: 离线记录与无感同步
**用户**: 在飞机上（无网），打开 App 记录灵感。
**系统**:
1.  内容写入本地 SQLite。
2.  飞机落地连网后，后台自动同步至服务端 PG。
3.  服务端触发 AI 分析，生成摘要和标签，推回 App。

### 场景 2: 深度学习
**用户**: 阅读一篇长文，将一段话存入笔记。
**系统**:
1.  为该段落生成 Block ID。
2.  识别到这是新知识点，自动生成一张 Flashcard (闪卡)。
3.  **用户**: 第二天早报收到这张闪卡，进行复习。

## 7. 开发路线图 (Roadmap)

### Phase 1: 骨架与感知 (The Skeleton)
*   搭建 Python FastAPI + PG 后端。
*   搭建 Next.js + Capacitor + SQLite 前端。
*   实现位置追踪与 Omnibar 基础交互。
*   **架构预留**: 数据库设计包含 `workspace_id` 字段。

### Phase 2: 记忆与同步 (Memory)
*   实现多模态处理流水线。
*   实现 Hybrid Search (pgvector + pg_trgm)。
*   实现 Block-Level 存储与 Markdown 导出。

### Phase 3: 主动智能 (Proactivity)
*   实现情境感知规则引擎。
*   实现 SRS (闪卡) 系统。
*   实现 MCP 基础客户端接口。
*   迁移 Prism 旧数据。

### Phase 4: 决策与扩展 (Wisdom & Expansion)
*   复刻思维模型决策逻辑。
*   优化 Dynamic Dashboard。
*   引入 Wasm 插件沙盒，开放用户脚本能力。

## 8. 验收标准

1.  **离线可用**: 断网状态下，App 端增删改查无误，连网后自动同步。
2.  **检索精度**: 混合搜索对专有名词（如“Prism”）的命中率 > 95%。
3.  **数据自由**: 一键导出所有笔记为 Markdown，且 Frontmatter 格式正确。
4.  **互联能力**: 成功通过 MCP 协议调用一个外部 Mock 工具。
