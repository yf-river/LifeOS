---
description: "Prism Next Refactor 实现任务列表"
---

# 任务: Prism Next AI Native Life OS Refactor

**输入**:
- Spec: `specs/001-ai-notes-refactor/spec.md`
- Design: `specs/001-ai-notes-refactor/design_spec.md`
- Plan: `specs/001-ai-notes-refactor/plan.md`
- Data Model: `specs/001-ai-notes-refactor/data-model.md`
- Contracts: `specs/001-ai-notes-refactor/contracts/api.yaml`

**前置条件**: Python 3.11+, Node.js 20+, Docker

## 阶段 1: 设置 (项目基础设施)

**目的**: 初始化前后端项目结构和开发环境。

- [x] T001 根据实施计划创建目录结构 (backend/, frontend/, docker/)
- [x] T002 [P] 初始化 FastAPI 后端 (Poetry, pyproject.toml)
- [x] T003 [P] 初始化 Next.js 前端 (App Router, Tailwind, Shadcn)
- [x] T004 [P] 设置 Capacitor 移动端项目 (Android/iOS platforms)
- [x] T005 配置 Docker Compose (PostgreSQL, pgvector, TimescaleDB)
- [x] T006 [P] 配置 Pre-commit hooks (Black/Ruff for Python, ESLint/Prettier for JS)

## 阶段 2: 基础 (核心架构)

**目的**: 搭建数据库、认证和同步机制，为功能开发做好准备。

**⚠️ 关键**: 阻塞所有后续用户故事。

- [x] T007 设置 SQLAlchemy/Alembic 数据库迁移 (Users, Workspaces 表)
- [x] T008 [P] 实施 JWT 认证 (Backend: Auth Middleware, Login Endpoint)
- [x] T009 [P] 前端认证集成 (NextAuth 或 Custom Hook)
- [x] T010 客户端 SQLite 初始化 (capacitor-community/sqlite 封装)
- [x] T011 实现基础同步逻辑 (Client: Offline Queue, Server: Sync Endpoint)
- [x] T012 [P] 创建基础 API 客户端 (Axios/Fetch wrapper with Auth)

## 阶段 3: 用户故事 1 - 快速记录 (Quick Capture) (优先级: P1)

**目标**: 实现 Omnibar 和多模态输入 (文本/语音/链接)，数据经 AI 处理后存入笔记。

**独立测试**: 用户可以通过 Omnibar 发送文本和录音，后端能接收并处理，最终在前端显示。

### 测试
- [x] T013 [P] [US1] 在 tests/integration/test_notes.py 中为 /notes 创建 API 测试
- [x] T014 [P] [US1] 在 tests/unit/test_whisper.py 中为 Whisper 集成编写单元测试

### 实施
- [x] T015 [P] [US1] 后端: 实施 `/notes` CRUD API (`src/routers/notes.py`)
- [x] T016 [P] [US1] 后端: 集成 Whisper (Faster-Whisper) 实现音频转文本服务
- [x] T017 [P] [US1] 后端: 集成 Crawler (Playwright/Jina) 实现链接解析服务
- [x] T018 [US1] 前端: 实现 Sticky Omnibar 组件 (`components/omnibar.tsx`)
- [x] T019 [US1] 前端: 实现音频录制与 Blob 上传逻辑
- [x] T020 [US1] 前端: 实现 Timeline (Feed) 视图与笔记卡片 (`components/feed.tsx`)
- [x] T021 [US1] 集成: 连接 Omnibar -> Local DB -> Sync -> Backend Pipeline

## 阶段 4: 用户故事 2 - 记忆与 RAG (Hybrid Store) (优先级: P1)

**目标**: 笔记向量化，实现混合检索 (Hybrid Search) 和自动关联 (Auto-linking)。

**独立测试**: 输入查询，能返回相关的笔记；查看笔记时，能推荐相似笔记。

### 测试
- [x] T022 [P] [US2] 在 tests/unit/test_embedding.py 中为 Embedding 服务编写单元测试
- [x] T023 [P] [US2] 在 tests/integration/test_search.py 中为混合检索 API 编写集成测试

### 实施
- [x] T024 [P] [US2] 后端: 集成 Embedding 模型 (OpenAI/HuggingFace)
- [x] T025 [P] [US2] 后端: 在 PG 中配置 pgvector 和 pg_trgm 索引
- [x] T026 [US2] 后端: 实现混合检索逻辑 (Keyword + Vector RRF)
- [x] T027 [US2] 后端: 实现 `Auto-linking` 逻辑 (写入后触发相似度计算)
- [x] T028 [US2] 前端: 实现 RAG 搜索界面 (`Omnibar` '?' 模式)
- [x] T029 [US2] 前端: 实现笔记详情页的 "相关笔记" 侧边栏

## 阶段 5: 用户故事 3 - 生命日志 (Life Log) (优先级: P2)

**目标**: 后台持续记录位置，生成轨迹，并进行逆地理编码。

**独立测试**: App 后台运行一天，能在地图上看到轨迹，并显示语义地点 (如"在家")。

### 测试
- [x] T030 [P] [US3] 在 tests/integration/test_location.py 中为 /location API 编写测试

### 实施
- [x] T031 [P] [US3] 后端: 创建 `location_logs` 表 (TimescaleDB)
- [x] T032 [P] [US3] 后端: 实现位置摄取 API (`/location`)
- [x] T033 [US3] 后端: 集成 Geopy 实现逆地理编码服务
- [x] T034 [US3] 移动端: 集成 Capacitor Background Geolocation 插件
- [x] T035 [US3] 移动端: 实现动态采样策略配置 (静止/移动切换)
- [x] T036 [US3] 前端: 在 Timeline 中渲染 Location Card (轨迹/地点)

## 阶段 6: 用户故事 4 - 主动助手 (Proactive Assistant) (优先级: P3)

**目标**: 基于规则引擎实现早晚报和情境触发。

**独立测试**: 模拟进入特定位置或特定时间，收到系统的 Push Notification 或 Feed 卡片。

### 实施
- [x] T037 [P] [US4] 后端: 实现简易规则引擎 (Event Bus)
- [x] T038 [P] [US4] 后端: 实现每日简报生成 Job (Cron + LLM Summarization)
- [x] T039 [US4] 前端: 实现 Daily Briefing 卡片样式
- [x] T040 [US4] 移动端: 集成 Local Notifications 推送

## 阶段 N: 完善与优化

- [x] T041 文档: 更新 API 文档 (Swagger)
- [x] T042 性能: 优化首页 Feed 加载速度 (Virtual Scroll)
- [x] T043 安全: 加固 API 权限校验
- [x] T044 迁移: 编写脚本迁移旧 Prism jsonl 数据
