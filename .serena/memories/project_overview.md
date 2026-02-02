# 项目概述

## 项目名称
LifeOS (Get笔记 Clone)

## 项目目的
开发一个功能完整的 Get笔记 Web 端 1:1 克隆，使用现代技术栈构建的全栈笔记应用，支持 AI 增强功能（RAG 语义搜索、流式对话）。

## 核心功能
- ✅ 笔记 CRUD（创建、读取、更新、删除）
- ✅ 富文本编辑器（Tiptap 2.x）
- ✅ 标签系统
- ✅ 搜索（全文搜索 + 语义搜索）
- ✅ 置顶笔记
- ✅ 图片上传 + OCR 识别
- ✅ 录音 + 语音转文字
- ✅ 链接预览卡片
- ✅ 乐观锁版本冲突处理
- ✅ Omnibar 快捷搜索
- ✅ 键盘快捷键
- ✅ AI RAG 聊天（流式响应）

## 技术栈

### 前端
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **UI 库**: React 18
- **组件库**: shadcn/ui + Tailwind CSS
- **状态管理**: Zustand
- **编辑器**: Tiptap 2.x (基于 ProseMirror)
- **动画**: Framer Motion
- **HTTP 客户端**: Axios
- **E2E 测试**: Playwright

### 后端
- **语言**: Python 3.11
- **框架**: FastAPI
- **ORM**: SQLAlchemy 2.0 (异步)
- **数据库**: PostgreSQL 15 (pgvector 扩展)
- **缓存**: Redis 7
- **认证**: JWT
- **包管理**: Hatch
- **格式化**: Black + Ruff

### AI 服务
- **向量嵌入**: OpenAI Embedding API
- **对话模型**: DeepSeek API
- **OCR**: 腾讯云通用文字识别
- **ASR**: 腾讯云语音识别

### 存储
- **文件存储**: 腾讯云 COS（可选）
- **本地存储**: 文件系统

### 部署
- **容器化**: Docker + Docker Compose
- **编排**: docker-compose.yml
- **数据库**: pgvector/pgvector:pg15 镜像

## 架构设计

### 前后端分离
- 前端: Next.js (端口 3000)
- 后端: FastAPI (端口 8080)
- API 通信: RESTful + SSE（流式响应）

### 数据库设计
- **PostgreSQL** 主数据库
- **Redis** 缓存和会话管理
- **pgvector** 向量存储（AI 语义搜索）

### 状态管理
- 前端全局状态: Zustand
- 后端状态: 数据库 + Redis 缓存
- 实时更新: Server-Sent Events (SSE)

## 开发模式

### 本地开发
1. **数据库服务**: `docker-compose up -d postgres redis`
2. **后端开发**: `cd backend && hatch run dev`
3. **前端开发**: `cd frontend && npm run dev`

### Docker 一键启动
```bash
docker-compose up -d
# 前端: http://localhost:3000
# 后端: http://localhost:8080
# API 文档: http://localhost:8080/docs
```

## 项目结构
```
LifeOS/
├── frontend/                     # Next.js 前端
│   └── src/
│       ├── app/                  # 页面 (App Router)
│       ├── components/           # 组件（按功能分类）
│       ├── hooks/                # 自定义 Hooks
│       ├── lib/                  # 工具函数
│       ├── store/                # Zustand 状态管理
│       └── styles/               # 样式
├── backend/                      # FastAPI 后端
│   └── app/
│       ├── api/v1/               # API 路由
│       ├── core/                 # 核心配置
│       ├── models/               # SQLAlchemy 模型
│       ├── schemas/              # Pydantic Schema
│       ├── services/             # 业务服务
│       └── main.py               # 应用入口
├── scripts/                      # 脚本
│   └── init.sql                  # 数据库初始化
├── docs/                         # 文档
├── docker-compose.yml            # Docker 编排
└── 素材/                         # 参考素材
```

## 环境要求
- **操作系统**: Linux/macOS/Windows（支持 Docker）
- **Docker**: 20.10+
- **Node.js**: 18+
- **Python**: 3.11+
- **数据库**: PostgreSQL 15+（或使用 Docker）

## 目标用户
- 需要高效笔记管理的个人用户
- 希望使用 AI 增强笔记功能的用户
- 开发者/技术爱好者（可学习现代全栈开发）

## 项目状态
- **开发阶段**: 功能开发中
- **稳定性**: 可本地运行，核心功能基本完成
- **生产就绪**: 需要进一步测试和优化

## 后续规划
1. **短期**: 完善现有功能，提高稳定性
2. **中期**: 添加更多 AI 功能（自动摘要、智能标签）
3. **长期**: 多端支持（桌面应用、移动端）、协作功能