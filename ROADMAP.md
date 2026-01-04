# Get笔记 Clone - 下一步开发路线图

基于 crawled-assets 和 001-ai-notes-refactor 素材分析

---

## 当前完成状态 ✅

| 功能 | 状态 | 说明 |
|------|------|------|
| 三栏布局 | ✅ | 侧边栏(175px) + 主内容区 + AI面板(280px) |
| 侧边栏菜单 | ✅ | 首页/AI助手/知识库/标签 |
| Omnibar | ✅ | Tiptap 编辑器 + 工具栏 |
| 快捷操作 | ✅ | 添加图片/添加链接/导入音视频 |
| AI 面板 | ✅ | 快捷提示词 + 输入框 |
| 笔记列表 | ✅ | 日期分组显示 |
| 基础 CRUD | ✅ | 创建/读取/更新/删除笔记 |
| E2E 测试 | ✅ | Playwright 28 个测试用例 |

### 第一阶段完成 (2026-01-04) ✅

| 功能 | 状态 | 说明 |
|------|------|------|
| 时间显示优化 | ✅ | "刚刚"/"5分钟前"/"昨天 14:30" 格式 |
| 标签筛选 | ✅ | AND/OR 匹配模式，多选支持 |
| 全文搜索 | ✅ | 防抖搜索 + 搜索历史 + Cmd/Ctrl+K 快捷键 |
| 搜索高亮 | ✅ | 关键词高亮组件 |

### 第二阶段完成 (2026-01-04) ✅

| 功能 | 状态 | 说明 |
|------|------|------|
| PG Vector | ✅ | docker-compose 使用 pgvector/pgvector:pg15 镜像 |
| 向量模型 | ✅ | NoteEmbedding 模型，支持 1536 维向量 |
| Embedding 服务 | ✅ | 文本分块 + OpenAI embedding API |
| 语义搜索 API | ✅ | /search/semantic 向量相似度搜索 |
| RAG 聊天 | ✅ | /chat/rag 基于笔记的 AI 对话 |
| 流式输出 | ✅ | /chat/rag/stream SSE 流式响应 |
| AI 面板更新 | ✅ | 前端支持流式输出 + RAG 开关 |

---

## 阶段三：Tauri 桌面应用 (进行中)

### 3.1 Tauri 配置
- [ ] **初始化 Tauri** - 配置 src-tauri 目录
- [ ] **窗口管理** - 主窗口 + 快速笔记窗口
- [ ] **系统托盘** - 托盘图标和菜单
- [ ] **自动更新** - 内置更新机制

### 3.2 全局快捷键
- [ ] **Cmd/Ctrl+Shift+N** - 全局快速笔记
- [ ] **Cmd/Ctrl+Shift+Space** - 全局 AI 对话
- [ ] **快捷键设置** - 允许用户自定义

### 3.3 本地功能
- [ ] **离线支持** - 本地数据缓存
- [ ] **文件拖拽** - 系统级文件拖拽
- [ ] **通知** - 系统通知集成

---

## 阶段四：高级功能 (优先级 P2)

### 4.1 知识库
- [ ] **知识库页面** - 展示所有知识来源
- [ ] **文档导入** - 支持 PDF/DOCX/XLSX/PPT
- [ ] **关联推荐** - 基于内容推荐相关笔记

### 4.2 协作功能
- [ ] **团队空间** - 参考 /spacex/v1/web/team/list API
- [ ] **分享笔记** - 生成分享链接
- [ ] **协作编辑** - 多人实时编辑

### 4.3 数据管理
- [ ] **导出** - Markdown/PDF/HTML 导出
- [ ] **备份** - 自动/手动备份
- [ ] **回收站** - 已删除笔记恢复
- [ ] **版本历史** - 笔记版本对比和回滚

---

## 技术债务和优化

### 性能优化
- [ ] 虚拟滚动 - 大量笔记时的列表渲染
- [ ] 图片懒加载 - 按需加载图片
- [ ] 离线缓存 - Service Worker 离线支持
- [ ] 预加载 - 预取相邻笔记内容

### 代码质量
- [ ] 单元测试 - Jest/Vitest 组件测试
- [ ] API Mock - MSW 模拟后端
- [ ] 类型完善 - 消除 any 类型
- [ ] 错误边界 - 组件错误处理

---

## 新增文件清单 (第二阶段)

### 后端 (Python/FastAPI)
```
backend/
├── app/
│   ├── models/
│   │   └── embedding.py        # NoteEmbedding 向量模型
│   ├── services/
│   │   └── embedding.py        # 向量嵌入服务
│   ├── api/v1/
│   │   ├── search.py           # 语义搜索 API
│   │   └── chat.py             # RAG 聊天 API
│   └── schemas/
│       └── ai.py               # 新增 RAG 相关 Schema
├── requirements.txt            # 新增 pgvector, openai, tiktoken
└── .env.example                # 新增 OpenAI 配置
```

### 前端 (Next.js/React)
```
frontend/src/components/
├── chat/
│   ├── ChatPanel.tsx           # 独立聊天面板组件
│   └── index.ts
└── layout/
    └── AIPanel.tsx             # 更新支持流式输出
```

### 基础设施
```
docker-compose.yml              # PostgreSQL 改用 pgvector 镜像
scripts/init.sql                # 新增 pgvector 扩展和向量表
```

---

## API 清单

### 语义搜索 API
```
POST /api/v1/search/semantic
  - query: 搜索文本
  - top_k: 返回数量 (默认 5)

POST /api/v1/search/embed-note
  - note_id: 笔记 ID
  - force: 是否强制重新嵌入

POST /api/v1/search/embed-all
  - force: 是否强制重新嵌入

GET /api/v1/search/embedding-stats
  - 返回嵌入统计信息
```

### RAG 聊天 API
```
POST /api/v1/chat/rag
  - query: 问题
  - history: 历史消息
  - use_rag: 是否使用 RAG
  - top_k: 检索数量

POST /api/v1/chat/rag/stream
  - 同上，返回 SSE 流式响应

POST /api/v1/chat/simple
  - 简单聊天，不使用 RAG
```

---

## 命令速查

```bash
# 开发
cd /Users/huyunfei/project/Prism/specs/002-second-req-dev/get-notes-clone

# 启动服务 (需要先 docker-compose up -d)
docker-compose up -d

# 前端开发
cd frontend && npm run dev

# 后端开发
cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8080

# 测试
cd frontend && npm run test:e2e

# 查看参考资料
open /Users/huyunfei/project/Prism/specs/002-second-req-dev/crawled-assets/
open /Users/huyunfei/project/Prism/specs/001-ai-notes-refactor/素材/
```
