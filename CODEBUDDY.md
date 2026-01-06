# CODEBUDDY.md

This file provides guidance to CodeBuddy Code when working with code in this repository.

## 项目概述

LifeOS (Get笔记 Clone) - 一个功能完整的笔记应用，采用前后端分离架构，支持 AI 增强功能（RAG 语义搜索、流式对话）。

## 技术栈

| 层级 | 技术 |
|-----|------|
| **前端** | Next.js 14 (App Router)、React 18、TypeScript、Tailwind CSS、shadcn/ui、Zustand、Tiptap 2.x |
| **后端** | Python 3.11、FastAPI、SQLAlchemy 2.0 (异步)、Pydantic |
| **数据库** | PostgreSQL 15 (pgvector 扩展)、Redis 7 |
| **AI** | OpenAI Embedding API、DeepSeek API、腾讯云 OCR/ASR |

## 常用命令

### 开发环境启动

```bash
# 启动数据库服务
docker-compose up -d postgres redis

# 后端开发 (端口 8080)
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080

# 前端开发 (端口 3000)
cd frontend
npm install
npm run dev
```

### 使用 Docker Compose 一键启动

```bash
docker-compose up -d
# 前端: http://localhost:3000
# 后端: http://localhost:8080
# API 文档: http://localhost:8080/docs
```

### 测试

```bash
# E2E 测试 (Playwright)
cd frontend
npm run test:e2e

# 带 UI 的 E2E 测试
npm run test:e2e:ui

# 查看测试报告
npm run test:e2e:report
```

### 代码检查

```bash
cd frontend && npm run lint
```

## 项目结构

```
LifeOS/
├── frontend/                     # Next.js 前端
│   └── src/
│       ├── app/                  # 页面 (App Router)
│       ├── components/
│       │   ├── auth/             # 登录组件
│       │   ├── chat/             # AI 聊天面板
│       │   ├── dialogs/          # 弹窗组件
│       │   ├── editor/           # Tiptap 编辑器
│       │   ├── layout/           # 布局组件 (三栏布局)
│       │   ├── media/            # 图片/录音组件
│       │   ├── notes/            # 笔记列表/卡片/详情
│       │   ├── omnibar/          # 快速输入框
│       │   ├── search/           # 搜索组件
│       │   ├── tags/             # 标签筛选/管理
│       │   ├── trash/            # 回收站
│       │   └── ui/               # shadcn 基础组件
│       ├── hooks/                # 自定义 Hooks
│       ├── lib/                  # 工具函数 (api.ts, utils.ts)
│       ├── store/                # Zustand 状态管理
│       └── styles/               # 样式/设计系统
│
├── backend/                      # FastAPI 后端
│   └── app/
│       ├── api/v1/               # API 路由
│       │   ├── auth.py           # 认证
│       │   ├── notes.py          # 笔记 CRUD
│       │   ├── tags.py           # 标签
│       │   ├── search.py         # 语义搜索
│       │   ├── chat.py           # RAG 聊天
│       │   ├── upload.py         # 文件上传
│       │   ├── export.py         # 导出
│       │   ├── trash.py          # 回收站
│       │   └── versions.py       # 版本历史
│       ├── core/                 # 核心配置
│       │   ├── config.py         # 环境配置
│       │   ├── database.py       # 数据库连接
│       │   ├── deps.py           # 依赖注入
│       │   ├── response.py       # 统一响应格式
│       │   └── security.py       # JWT 认证
│       ├── models/               # SQLAlchemy 模型
│       │   ├── note.py           # Note, Tag, Attachment
│       │   ├── user.py           # User
│       │   ├── embedding.py      # NoteEmbedding (向量)
│       │   └── version.py        # 版本历史
│       ├── schemas/              # Pydantic Schema
│       ├── services/             # 业务服务
│       │   ├── embedding.py      # 向量嵌入服务
│       │   ├── deepseek.py       # DeepSeek AI
│       │   ├── storage.py        # COS 存储
│       │   └── tencent.py        # 腾讯云 OCR/ASR
│       └── main.py               # 应用入口
│
├── scripts/
│   └── init.sql                  # 数据库初始化 (含 pgvector)
│
├── docker-compose.yml            # Docker 编排
├── AI-REFERENCE.md               # AI 开发参考文档 (详细)
├── ROADMAP.md                    # 开发路线图
│
└── 素材/                         # 参考素材 (不参与构建)
    ├── get笔记/                  # 主要复刻来源
    │   ├── *.png                 # 页面截图
    │   ├── interactions/         # 交互分析
    │   ├── full-api/             # API 捕获
    │   ├── deep-analysis/        # 深度分析
    │   └── *.json                # 样式/结构数据
    │
    └── 其它开源项目/             # 功能参考
        ├── blinko/               # Tauri + AI (流式对话、快捷窗口)
        ├── memos/                # Go 后端参考
        ├── FastGPT/              # 工作流引擎
        ├── khoj/                 # 多端 + RAG
        ├── WeKnora/              # GraphRAG
        ├── Trilium/              # 层级笔记
        ├── logseq/               # 双链笔记
        ├── siyuan/               # 块编辑器
        ├── reor/                 # 本地 AI 笔记
        ├── 代码实现参考.md        # 向量搜索/RAG 实现
        ├── 深度分析-5个参考项目.md
        └── 技术选型对比表.md
```

## 架构设计

### 前端状态管理 (Zustand)

- `store/notes.ts` - 笔记列表、当前笔记、搜索状态
- `store/ui.ts` - UI 状态 (侧边栏折叠、AI 面板显隐)

### 后端 API 响应格式

所有 API 响应遵循统一格式：

```json
{
  "h": {
    "c": 0,          // 状态码，0=成功
    "e": "",         // 错误信息
    "s": "success",
    "t": 1234567890
  },
  "c": {}            // 业务数据
}
```

### 数据库

- PostgreSQL 使用 `pgvector/pgvector:pg15` 镜像
- 端口映射: 5433:5432 (避免与本机 PostgreSQL 冲突)
- Redis 端口映射: 6380:6379

## 核心 API 端点

| 功能 | 端点 | 说明 |
|-----|------|------|
| 笔记 CRUD | `GET/POST/PATCH/DELETE /api/v1/notes` | 标准 RESTful |
| 全文搜索 | `GET /api/v1/notes?keyword=xxx` | 关键词搜索 |
| 语义搜索 | `POST /api/v1/search/semantic` | 向量相似度搜索 |
| RAG 聊天 | `POST /api/v1/chat/rag/stream` | SSE 流式响应 |
| 标签 | `GET/POST /api/v1/tags` | 标签管理 |
| 上传 | `POST /api/v1/upload/image` | 图片上传 + OCR |

## 环境变量

### 后端 (.env)

```
DATABASE_URL=postgresql+asyncpg://lifeos:lifeos123@localhost:5433/lifeos
REDIS_URL=redis://localhost:6380/0
JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=your-openai-key          # 向量嵌入
DEEPSEEK_API_KEY=your-deepseek-key      # AI 对话
TENCENT_SECRET_ID=xxx                   # OCR/ASR (可选)
TENCENT_SECRET_KEY=xxx
```

### 前端 (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

## 开发注意事项

1. **布局**: 三栏布局 (Sidebar 175px + MainContent + AIPanel 280px)
2. **编辑器**: 使用 Tiptap 2.x，扩展在 `components/editor/extensions/`
3. **时间显示**: 使用 `lib/formatTime.ts` 实现 "刚刚"/"5分钟前" 格式
4. **AI 功能**: RAG 聊天需要先调用 `/search/embed-all` 生成向量索引
5. **测试**: E2E 测试覆盖核心流程，运行前需启动后端服务

## 素材使用指南

### 主要复刻来源: Get笔记

`素材/get笔记/` 包含从 Get笔记 Web 端爬取的完整数据：
- **截图**: `page-home.png`, `page-ai-assistant.png` 等 - UI 参考
- **交互分析**: `interactions/` - 各组件交互逻辑
- **API 捕获**: `full-api/` - 接口格式和数据结构
- **样式数据**: `styles.json`, `app-styles.json` - 颜色/尺寸/字体

### 功能参考: 其它开源项目

`素材/其它开源项目/` 包含多个开源笔记应用的源码，可参考其实现：

| 项目 | 参考价值 |
|-----|---------|
| **blinko** | Tauri 桌面应用、tRPC 流式对话、快捷笔记窗口、AI 自动标签 |
| **memos** | Go 后端架构、gRPC-Gateway |
| **FastGPT** | 工作流引擎、知识库管理 |
| **khoj** | 多端同步、RAG 实现 |
| **WeKnora** | GraphRAG、知识图谱 |
| **Trilium** | 层级笔记结构 |
| **logseq** | 双链笔记、大纲编辑 |
| **siyuan** | 块级编辑器 |
| **reor** | 本地 AI 笔记应用 |

### 参考文档快速索引

- `素材/其它开源项目/代码实现参考.md` - 向量搜索、RAG 实现代码
- `素材/其它开源项目/深度分析-5个参考项目.md` - 架构分析
- `素材/其它开源项目/技术选型对比表.md` - 技术栈对比
- `AI-REFERENCE.md` - 整合后的 AI 开发参考文档 (推荐首先阅读)
