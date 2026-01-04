# 实施计划 - Prism Next 重构

**状态**: 提案中
**功能分支**: `001-ai-notes-refactor`
**规格文件**: `specs/001-ai-notes-refactor/spec.md`
**设计规格**: `specs/001-ai-notes-refactor/design_spec.md`

## 1. 技术背景

### 1.1 技术栈
- **后端**: Python (FastAPI)
- **前端**: TypeScript (Next.js 14+ App Router)
- **移动端封装**: Capacitor
- **数据库**: PostgreSQL (带插件: `pgvector`, `timescaledb`, `pg_trgm`)
- **本地数据库 (客户端)**: SQLite (通过 capacitor-community/sqlite)
- **状态管理**: Zustand
- **样式**: Tailwind CSS + Shadcn/ui
- **AI 服务**:
    - ASR (语音转文字): OpenAI Whisper (faster-whisper)
    - LLM (大模型): Agent 框架 (LangChain/LlamaIndex)
    - 爬虫: Playwright/Jina Reader
    - VLM (视觉模型): GPT-4o-mini / Llava

### 1.2 数据流架构
- **客户端优先**: 所有写入操作优先写入本地 SQLite (乐观 UI)。
- **同步**: 后台 Worker 通过 REST API 将 SQLite 变更同步到 PostgreSQL。
- **处理流程**:
    - 后端接收原始数据 (音频/文本/图片)。
    - 异步 Worker (Celery/ARQ) 处理:
        - 音频 -> 文本
        - 文本 -> 摘要/标签
        - 文本 -> 嵌入 (Embedding) -> 向量库
        - 图片 -> 描述
    - 处理后的数据通过 WebSocket/SSE 或同步机制推回客户端。

## 2. 章程检查

### 2.1 核心价值观一致性
- [x] **本地优先**: 通过 SQLite + Sync 架构实现。
- [x] **隐形 AI**: AI 在后台运行 (自动打标签、摘要)，不阻塞用户。
- [x] **量化自我**: 后端支持 TimescaleDB 用于存储指标数据。
- [x] **平静科技**: 设计规格强调 "流体 (Fluid)" 和 "平静 (Calm)" 的 UI。

### 2.2 架构原则
- [x] **关注点分离**: FastAPI (逻辑/数据) vs Next.js (UI/交互)。
- [x] **多模态**: 摄取流水线专为 音频/链接/图片 设计。
- [x] **可扩展性**: 基于 PG 的栈易于扩展; Schema 中的 Workspace ID 支持多租户。

## 3. 阶段 0: 研究与澄清 (需要澄清)

### 3.1 研究任务
- [ ] **同步引擎**: 研究 SQLite <-> PG 同步的最佳实践。(候选: ElectricSQL, PowerSync, 或自定义 REST 同步)。
    - *需要决策*: 构建自定义轻量级同步还是使用重量级解决方案？
    - *建议*: 阶段 1 先从自定义 REST 同步 (基于时间戳) 开始，以保持简单。
- [ ] **后台地理位置**: 验证 Capacitor Background Geolocation 的电池影响和 iOS 限制。
- [ ] **移动端布局**: 确认 Shadcn/ui + Vaul 是否能提供足够的 "原生感"，还是需要专门的移动端 UI 库 (Ionic/Konsta)。
    - *建议*: 坚持使用 Shadcn/ui 以保持一致性，通过 CSS 进行优化。

## 4. 阶段 1: 骨架与感知 (基础)

### 4.1 后端基础 (Python)
- [ ] **FastAPI 脚手架**: 设置项目结构，依赖管理 (Poetry/UV)。
- [ ] **数据库设置**: Docker Compose 部署 PG + pgvector + TimescaleDB。
- [ ] **Schema 设计**: 定义 `users`, `workspaces`, `notes`, `timeline_events` 表。
- [ ] **认证**: 基础 JWT 认证。

### 4.2 前端基础 (Next.js)
- [ ] **Next.js 脚手架**: 设置 App Router, Tailwind, Shadcn。
- [ ] **移动端壳**: 设置 Capacitor android/ios 项目。
- [ ] **本地 DB**: 初始化 SQLite 数据库和 Zustand store。
- [ ] **同步逻辑**: 实现基础的离线队列和同步机制。

### 4.3 功能: Omnibar & 时间轴
- [ ] **Omnibar UI**: 实现底部常驻输入框 (文本)。
- [ ] **时间轴视图**: 虚拟列表渲染混合卡片 (笔记)。
- [ ] **Markdown 渲染**: 笔记卡片显示逻辑。

### 4.4 功能: 位置 (生命日志)
- [ ] **Capacitor Geolocation**: 实现后台轨迹记录。
- [ ] **后端摄取**: 接收轨迹点的 API。
- [ ] **逆地理编码**: 将坐标转换为语义地址 (如 "家", "健身房")。

## 5. 阶段 2: 记忆与同步 (大脑)

### 5.1 多模态摄取流水线
- [ ] **音频流水线**:
    - 前端: 音频录制组件 (blob 捕获)。
    - 后端: Whisper 集成 (转写服务)。
- [ ] **链接流水线**:
    - 前端: 粘贴处理程序。
    - 后端: 爬虫服务 (提取标题、内容)。
- [ ] **图片流水线**:
    - 后端: VLM 服务存根。

### 5.2 RAG 基础
- [ ] **Embedding 服务**: 文本转向量。
- [ ] **混合搜索**: 实现 PG 中的 `vector <=> keyword` 搜索逻辑。
- [ ] **相关笔记**: 获取给定笔记 ID 的 `similar_notes` API。

## 6. 阶段 3: 主动性与迁移 (灵魂)

### 6.1 主动引擎
- [ ] **规则引擎**: 简单的事件总线 (`位置变更 -> 检查规则 -> 推送通知`)。
- [ ] **每日简报**: Cron 作业，从昨天的时间轴生成摘要。

### 6.2 旧数据迁移
- [ ] **Prism 导入器**: 解析旧 Prism 的 `jsonl` 和 Markdown 并导入新 PG Schema 的脚本。

## 7. 运维准备

- [ ] **Docker**: 后端和前端 (Web) 的 `Dockerfile`。
- [ ] **CI/CD**: GitHub Actions 用于 linting 和类型检查。
- [ ] **文档**: API 文档 (Swagger), 开发者指南。
