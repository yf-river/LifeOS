# 任务清单

功能分支: `002-second-req-dev`
生成时间: 2026-01-03
总任务数: 68

---

## 用户故事摘要

| ID | 用户故事 | 优先级 | 任务数 | 阶段 |
|----|----------|--------|--------|------|
| US1 | 笔记 CRUD | P0 | 12 | Phase 3 |
| US2 | Tiptap 编辑器 | P0 | 8 | Phase 4 |
| US3 | 标签系统 | P0 | 8 | Phase 5 |
| US4 | 图片 AI 识别 | P0 | 6 | Phase 6 |
| US5 | 链接 AI 分析 | P0 | 5 | Phase 7 |
| US6 | 音视频转文字 | P1 | 6 | Phase 8 |
| US7 | 文件存储 | P0 | 5 | Phase 6 |
| US8 | UI 精调 | P0 | 8 | Phase 9 |

---

## Phase 1: 项目初始化 (Setup)

### 目标
搭建前后端项目骨架，配置开发环境

### 任务

#### T001 [Setup] 创建 Next.js 14 项目
**文件**: `frontend/`
**描述**: 
```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir
cd frontend
pnpm add zustand axios dayjs
```
**验收**: `pnpm dev` 启动成功，访问 localhost:3000

---

#### T002 [Setup] 配置 shadcn/ui [P]
**文件**: `frontend/`
**描述**: 
```bash
cd frontend
pnpm dlx shadcn-ui@latest init
# 选择: New York style, Zinc color, CSS variables: yes
pnpm dlx shadcn-ui@latest add button card input dialog toast dropdown-menu avatar badge scroll-area separator skeleton tabs textarea tooltip
```
**验收**: 能够在页面中使用 `<Button>` 组件

---

#### T003 [Setup] 创建 go-zero 后端项目 [P]
**文件**: `backend/`
**描述**: 
```bash
mkdir -p backend && cd backend
go mod init get-notes-clone
go get -u github.com/zeromicro/go-zero@latest
go get -u gorm.io/gorm gorm.io/driver/postgres
goctl api new api
```
创建目录结构:
```
backend/
├── cmd/api/main.go
├── internal/
│   ├── config/config.go
│   ├── handler/
│   ├── logic/
│   ├── model/
│   ├── svc/servicecontext.go
│   └── types/types.go
├── etc/api.yaml
└── go.mod
```
**验收**: `go run cmd/api/main.go` 启动成功

---

#### T004 [Setup] 配置 PostgreSQL + Docker Compose [P]
**文件**: `docker-compose.yml`
**描述**: 
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: get_notes_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```
**验收**: `docker-compose up -d` 启动成功，`psql` 能连接

---

#### T005 [Setup] 配置后端数据库连接
**文件**: `backend/etc/api.yaml`, `backend/internal/config/config.go`
**描述**: 
```yaml
# etc/api.yaml
Name: get-notes-api
Host: 0.0.0.0
Port: 8080

Database:
  DSN: "host=localhost user=postgres password=postgres dbname=get_notes_dev port=5432 sslmode=disable"

JWT:
  Secret: "your-jwt-secret-key-change-in-production"
  Expire: 86400
```
**验收**: 后端启动时能连接数据库

---

#### T006 [Setup] 配置前端环境变量和 API 客户端
**文件**: `frontend/.env.local`, `frontend/src/lib/api.ts`
**描述**: 
```typescript
// src/lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器：添加 JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 响应拦截器：处理统一响应格式
api.interceptors.response.use((response) => {
  if (response.data?.h?.c === 0) return response.data.c;
  throw new Error(response.data?.h?.e || 'Unknown error');
});
```
**验收**: 前端能调用后端 API

---

### Phase 1 检查点
- [ ] 前端项目启动正常
- [ ] 后端项目启动正常
- [ ] 数据库连接正常
- [ ] 前后端能通信

---

## Phase 2: 基础设施 (Foundation)

### 目标
实现认证、数据库迁移等阻塞性任务

### 任务

#### T007 [Foundation] 创建数据库迁移脚本
**文件**: `backend/migrations/001_init.sql`
**描述**: 
```sql
-- 创建用户表
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    external_uid BIGINT UNIQUE NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建笔记表
CREATE TABLE notes (
    id BIGSERIAL PRIMARY KEY,
    note_id VARCHAR(32) UNIQUE NOT NULL,
    user_id BIGINT REFERENCES users(id),
    title VARCHAR(500),
    content TEXT NOT NULL,
    json_content TEXT NOT NULL,
    note_type VARCHAR(20) NOT NULL DEFAULT 'plain_text',
    entry_type VARCHAR(20) DEFAULT 'manual',
    source VARCHAR(20) DEFAULT 'web',
    version INTEGER DEFAULT 1 NOT NULL,
    status SMALLINT DEFAULT 0,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    ai_summary TEXT,
    source_url TEXT,
    share_id VARCHAR(20),
    share_scope SMALLINT DEFAULT 0,
    parent_id VARCHAR(32),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_user_status_created ON notes(user_id, status, created_at DESC);

-- 创建标签表
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    name VARCHAR(50) NOT NULL,
    type VARCHAR(10) DEFAULT 'user',
    icon VARCHAR(50),
    color VARCHAR(20),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- 创建笔记标签关联表
CREATE TABLE note_tags (
    note_id BIGINT REFERENCES notes(id) ON DELETE CASCADE,
    tag_id BIGINT REFERENCES tags(id) ON DELETE CASCADE,
    source VARCHAR(10) DEFAULT 'user',
    confidence DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (note_id, tag_id)
);

-- 插入系统标签
INSERT INTO tags (user_id, name, type, icon) VALUES
    (0, 'AI链接笔记', 'system', 'link'),
    (0, '图片笔记', 'system', 'image'),
    (0, '录音笔记', 'system', 'audio');
```
**验收**: 执行迁移脚本后，表结构正确

---

#### T008 [Foundation] 实现 GORM 模型
**文件**: `backend/internal/model/note.go`, `backend/internal/model/user.go`, `backend/internal/model/tag.go`
**描述**: 
实现 Note, User, Tag, NoteTag 四个 GORM 模型，包含:
- 字段定义和 gorm tag
- 表名方法 TableName()
- 关联关系定义
**验收**: 能通过 GORM 进行 CRUD 操作

---

#### T009 [Foundation] 实现 JWT 认证中间件
**文件**: `backend/internal/middleware/auth.go`
**描述**: 
```go
func AuthMiddleware(secret string) rest.Middleware {
    return func(next http.HandlerFunc) http.HandlerFunc {
        return func(w http.ResponseWriter, r *http.Request) {
            token := r.Header.Get("Authorization")
            // 解析 Bearer token
            // 验证 JWT
            // 将 user_id 放入 context
            next(w, r)
        }
    }
}
```
**验收**: 无 token 请求返回 401，有效 token 请求通过

---

#### T010 [Foundation] 实现统一响应格式
**文件**: `backend/internal/types/response.go`
**描述**: 
```go
type Response struct {
    H Header      `json:"h"`
    C interface{} `json:"c"`
}

type Header struct {
    C   int    `json:"c"`   // 状态码
    E   string `json:"e"`   // 错误信息
    S   int64  `json:"s"`   // 时间戳
    T   int64  `json:"t"`   // 处理时间
    Apm string `json:"apm"` // 请求ID
}

func Success(c interface{}) *Response { ... }
func Error(code int, msg string) *Response { ... }
```
**验收**: 所有 API 响应符合 `{ h: {...}, c: {...} }` 格式

---

#### T011 [Foundation] 实现三栏布局框架
**文件**: `frontend/src/components/layouts/MainLayout.tsx`
**描述**: 
```tsx
export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* 侧边栏 175px */}
      <aside className="w-[175px] border-r flex-shrink-0">
        <Sidebar />
      </aside>
      
      {/* 主内容区 flex-1 */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      
      {/* AI 面板 280px */}
      <aside className="w-[280px] border-l flex-shrink-0">
        <AIPanel />
      </aside>
    </div>
  );
}
```
**验收**: 页面显示三栏布局，宽度符合设计

---

#### T012 [Foundation] 实现侧边栏组件
**文件**: `frontend/src/components/layouts/Sidebar.tsx`
**描述**: 
包含:
- Logo (Get笔记)
- 导航项: 首页、AI助手、知识库、标签
- 底部: 小程序、下载App、Get达人
**验收**: 侧边栏 UI 与 Get笔记 一致

---

### Phase 2 检查点
- [ ] 数据库表结构完整
- [ ] JWT 认证工作正常
- [ ] 三栏布局显示正确

---

## Phase 3: 笔记 CRUD [US1]

### 目标
实现核心笔记功能，与 Get笔记 API 格式兼容

### 独立测试标准
- 能够创建、查看、编辑、删除笔记
- 乐观锁冲突时显示提示并保留用户输入

### 任务

#### T013 [US1] 实现笔记列表 API
**文件**: `backend/internal/handler/note/listnotes.go`, `backend/internal/logic/note/listnoteslogic.go`
**描述**: 
```
GET /api/v1/notes?limit=20&sort=create_desc&status=0&q=keyword
```
返回: `{ notes: [...], has_more: bool, total: int }`
**验收**: 能分页查询笔记列表

---

#### T014 [US1] 实现笔记详情 API [P]
**文件**: `backend/internal/handler/note/getnote.go`, `backend/internal/logic/note/getnotelogic.go`
**描述**: 
```
GET /api/v1/notes/:id
```
返回完整笔记对象，包含 tags、attachments
**验收**: 能通过 note_id 获取详情

---

#### T015 [US1] 实现笔记创建 API [P]
**文件**: `backend/internal/handler/note/createnote.go`, `backend/internal/logic/note/createnotelogic.go`
**描述**: 
```
POST /api/v1/notes
Body: { title, content, json_content, note_type, tags }
```
- 生成 note_id (雪花算法或 UUID)
- content 从 json_content 提取纯文本
- 返回完整笔记对象
**验收**: 能创建笔记，返回带 note_id

---

#### T016 [US1] 实现笔记更新 API (含乐观锁)
**文件**: `backend/internal/handler/note/updatenote.go`, `backend/internal/logic/note/updatenotelogic.go`
**描述**: 
```
PUT /api/v1/notes/:id
Body: { note_id, version, title, content, json_content, tags }
```
- 检查 version 是否匹配
- 不匹配返回 409 冲突
- 匹配则更新，version++
**验收**: 版本冲突时返回 409

---

#### T017 [US1] 实现笔记删除 API [P]
**文件**: `backend/internal/handler/note/deletenote.go`, `backend/internal/logic/note/deletenotelogic.go`
**描述**: 
```
DELETE /api/v1/notes/:id
```
软删除：设置 status=1 (回收站)
**验收**: 删除后笔记不在列表中显示

---

#### T018 [US1] 实现笔记列表页面
**文件**: `frontend/src/app/(main)/page.tsx`, `frontend/src/components/features/NoteList.tsx`, `frontend/src/components/features/NoteCard.tsx`
**描述**: 
- 使用 Zustand 管理笔记列表状态
- NoteCard 显示标题、内容预览、标签、时间
- 支持按日期分组显示 (昨天、前天...)
**验收**: 页面显示笔记列表，样式与 Get笔记 一致

---

#### T019 [US1] 实现笔记详情页面
**文件**: `frontend/src/app/(main)/notes/[id]/page.tsx`, `frontend/src/components/features/NoteDetail.tsx`
**描述**: 
- 显示完整笔记内容
- 顶部操作栏: 返回、追加笔记、编辑、分享、更多
- 标签显示和添加
**验收**: 能查看笔记详情

---

#### T020 [US1] 实现笔记创建表单 (Omnibar)
**文件**: `frontend/src/components/features/Omnibar.tsx`
**描述**: 
- 固定在主内容区顶部
- Placeholder: "记录现在的想法..."
- 快捷按钮: 添加图片、添加链接、音视频
- 输入内容后按 Enter 或点击发送创建笔记
**验收**: 能在 Omnibar 中创建笔记

---

#### T021 [US1] 实现乐观锁冲突处理 (前端)
**文件**: `frontend/src/hooks/useOptimisticUpdate.ts`, `frontend/src/components/features/ConflictDialog.tsx`
**描述**: 
- 更新失败且返回 409 时，显示冲突弹窗
- 弹窗内容: "笔记已被修改，请刷新后重试"
- 自动将用户未保存内容复制到剪贴板
- 提供刷新按钮
**验收**: 冲突时弹窗显示，内容已复制到剪贴板

---

#### T022 [US1] 实现笔记删除确认弹窗
**文件**: `frontend/src/components/features/DeleteConfirmDialog.tsx`
**描述**: 
使用 shadcn AlertDialog 组件
**验收**: 删除前显示确认弹窗

---

#### T023 [US1] 实现笔记 Zustand Store
**文件**: `frontend/src/stores/noteStore.ts`
**描述**: 
```typescript
interface NoteStore {
  notes: Note[];
  currentNote: Note | null;
  isLoading: boolean;
  fetchNotes: (params?: FetchParams) => Promise<void>;
  fetchNote: (id: string) => Promise<void>;
  createNote: (data: CreateNoteData) => Promise<Note>;
  updateNote: (id: string, data: UpdateNoteData) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
}
```
**验收**: 状态管理正常工作

---

#### T024 [US1] 实现 content 自动提取 (后端)
**文件**: `backend/internal/logic/note/util.go`
**描述**: 
从 json_content (Tiptap JSON) 提取纯文本到 content 字段
```go
func ExtractTextFromJSON(jsonContent string) string {
    // 解析 Tiptap JSON
    // 递归遍历节点，提取 text 内容
    // 返回纯文本
}
```
**验收**: 创建/更新笔记时 content 自动填充

---

### Phase 3 检查点
- [ ] 笔记 CRUD 全流程可用
- [ ] 乐观锁冲突处理正常
- [ ] UI 与 Get笔记 一致

---

## Phase 4: Tiptap 编辑器 [US2]

### 目标
还原 Get笔记 编辑器体验

### 独立测试标准
- 编辑器支持富文本格式
- json_content 正确保存和加载

### 任务

#### T025 [US2] 安装 Tiptap 依赖
**文件**: `frontend/package.json`
**描述**: 
```bash
pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit
pnpm add @tiptap/extension-placeholder @tiptap/extension-highlight
pnpm add @tiptap/extension-link @tiptap/extension-image
pnpm add @tiptap/extension-task-list @tiptap/extension-task-item
pnpm add @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-header @tiptap/extension-table-cell
pnpm add @tiptap/extension-text-style @tiptap/extension-color @tiptap/extension-underline
```
**验收**: 依赖安装成功

---

#### T026 [US2] 实现 Tiptap 编辑器组件
**文件**: `frontend/src/components/features/Editor/TiptapEditor.tsx`
**描述**: 
```tsx
const extensions = [
  StarterKit,
  Placeholder.configure({ placeholder: '记录现在的想法...' }),
  Highlight.configure({ multicolor: true }),
  Link.configure({ openOnClick: false }),
  Image,
  TaskList,
  TaskItem.configure({ nested: true }),
  Table.configure({ resizable: true }),
  TableRow, TableHeader, TableCell,
  TextStyle, Color, Underline,
];

export function TiptapEditor({ content, onChange }) {
  const editor = useEditor({ extensions, content, onUpdate: ({ editor }) => {
    onChange(JSON.stringify(editor.getJSON()));
  }});
  return <EditorContent editor={editor} className="tiptap ProseMirror aie-content" />;
}
```
**验收**: 编辑器能正常显示和编辑

---

#### T027 [US2] 实现编辑器工具栏
**文件**: `frontend/src/components/features/Editor/Toolbar.tsx`
**描述**: 
工具栏按钮 (参考 Get笔记 顺序):
- 图片、加粗、颜色、斜体、有序列表、无序列表、更多
**验收**: 工具栏功能正常

---

#### T028 [US2] 实现 json_content ↔ 编辑器状态同步
**文件**: `frontend/src/hooks/useEditorSync.ts`
**描述**: 
- 加载笔记时，将 json_content 解析为编辑器状态
- 编辑时，将编辑器状态序列化为 json_content
- 处理空内容边界情况
**验收**: 保存后重新打开内容一致

---

#### T029 [US2] 实现自动保存
**文件**: `frontend/src/hooks/useAutoSave.ts`
**描述**: 
- 内容变化后 2 秒无操作触发保存
- 保存中显示 "保存中..."
- 保存成功显示 "已保存"
- 使用 debounce 避免频繁请求
**验收**: 编辑后自动保存

---

#### T030 [US2] 实现编辑器 CSS 样式
**文件**: `frontend/src/styles/editor.css`
**描述**: 
参考 spec.md 中的 CSS 变量，实现:
- 编辑器基础样式 (.tiptap.ProseMirror.aie-content)
- 引用块、代码块样式
- 链接样式
- 表格样式
**验收**: 样式与 Get笔记 一致

---

#### T031 [US2] 实现编辑模式切换
**文件**: `frontend/src/components/features/NoteDetail.tsx`
**描述**: 
- 查看模式: 只读显示
- 编辑模式: 显示编辑器和工具栏
- 点击"编辑"按钮切换
**验收**: 模式切换正常

---

#### T032 [US2] 实现编辑器 Store
**文件**: `frontend/src/stores/editorStore.ts`
**描述**: 
```typescript
interface EditorStore {
  isEditing: boolean;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  setEditing: (editing: boolean) => void;
  setDirty: (dirty: boolean) => void;
}
```
**验收**: 状态管理正常

---

### Phase 4 检查点
- [ ] 编辑器支持所有格式
- [ ] 自动保存正常
- [ ] 样式与 Get笔记 一致

---

## Phase 5: 标签系统 [US3]

### 目标
实现完整标签功能

### 独立测试标准
- 能创建、删除标签
- 能为笔记添加/移除标签
- 能按标签筛选笔记

### 任务

#### T033 [US3] 实现标签列表 API
**文件**: `backend/internal/handler/tag/listtags.go`
**描述**: 
```
GET /api/v1/tags?limit=50
```
返回用户标签和系统标签，包含关联笔记数
**验收**: 能获取标签列表

---

#### T034 [US3] 实现标签创建 API [P]
**文件**: `backend/internal/handler/tag/createtag.go`
**描述**: 
```
POST /api/v1/tags
Body: { name, color }
```
**验收**: 能创建标签

---

#### T035 [US3] 实现标签删除 API [P]
**文件**: `backend/internal/handler/tag/deletetag.go`
**描述**: 
```
DELETE /api/v1/tags/:id
```
同时删除 note_tags 关联
**验收**: 能删除标签

---

#### T036 [US3] 实现标签页面 (侧边栏)
**文件**: `frontend/src/components/features/TagList.tsx`
**描述**: 
- 显示所有标签
- 系统标签带图标
- 用户标签带颜色
- 点击标签筛选笔记
**验收**: 标签列表显示正确

---

#### T037 [US3] 实现笔记标签选择器
**文件**: `frontend/src/components/features/TagSelector.tsx`
**描述**: 
- 显示已选标签
- 点击 "+ 添加标签" 弹出选择器
- 支持搜索和创建新标签
**验收**: 能为笔记添加标签

---

#### T038 [US3] 实现智能标签按钮
**文件**: `frontend/src/components/features/SmartTagButton.tsx`
**描述**: 
点击后调用 AI 生成标签接口 (Phase 6 实现)
暂时显示 "生成中..."
**验收**: 按钮显示正常

---

#### T039 [US3] 实现标签样式
**文件**: `frontend/src/components/ui/Tag.tsx`
**描述**: 
参考 spec.md 标签样式:
```css
background: rgb(255, 255, 255);
color: rgb(103, 112, 132);
border-radius: 4px;
```
系统标签带图标
**验收**: 样式与 Get笔记 一致

---

#### T040 [US3] 实现按标签筛选笔记
**文件**: `frontend/src/app/(main)/page.tsx`
**描述**: 
- URL 参数: ?tag_id=xxx
- 侧边栏标签点击时更新 URL
- 笔记列表根据 tag_id 过滤
**验收**: 点击标签能筛选笔记

---

### Phase 5 检查点
- [ ] 标签 CRUD 可用
- [ ] 标签筛选正常
- [ ] 样式与 Get笔记 一致

---

## Phase 6: 图片 AI 识别 + 文件存储 [US4, US7]

### 目标
实现图片上传、OCR、AI 标签生成

### 独立测试标准
- 能上传图片并创建图片笔记
- OCR 识别文字正确
- 自动生成标签

### 任务

#### T041 [US7] 集成腾讯云 COS SDK
**文件**: `backend/pkg/storage/cos.go`
**描述**: 
```go
type COSClient struct { ... }
func (c *COSClient) Upload(file io.Reader, key string) (string, error)
func (c *COSClient) GeneratePresignedURL(key string) (string, error)
```
**验收**: 能上传文件到 COS

---

#### T042 [US7] 实现图片上传 API
**文件**: `backend/internal/handler/upload/image.go`
**描述**: 
```
POST /api/v1/upload/image
Content-Type: multipart/form-data
```
- 验证文件类型 (JPEG/PNG)
- 验证文件大小 (<= 10MB)
- 上传到 COS
- 生成缩略图
**验收**: 能上传图片

---

#### T043 [US4] 集成腾讯云 OCR SDK
**文件**: `backend/pkg/ai/ocr.go`
**描述**: 
```go
type OCRClient struct { ... }
func (c *OCRClient) RecognizeText(imageURL string) (string, error)
```
**验收**: 能识别图片文字

---

#### T044 [US4] 集成 DeepSeek API
**文件**: `backend/pkg/ai/deepseek.go`
**描述**: 
```go
type DeepSeekClient struct { ... }
func (c *DeepSeekClient) GenerateTags(content string, maxTags int) ([]string, error)
func (c *DeepSeekClient) Summarize(content string) (string, error)
```
**验收**: 能生成标签和摘要

---

#### T045 [US4] 实现图片笔记创建流程
**文件**: `backend/internal/logic/upload/imagelogic.go`
**描述**: 
1. 上传图片到 COS
2. 调用 OCR 识别文字
3. 调用 AI 生成标签和摘要
4. 创建笔记 (note_type=image)
5. 关联系统标签 "图片笔记"
**验收**: 上传图片后自动创建笔记

---

#### T046 [US4] 实现图片上传前端组件
**文件**: `frontend/src/components/features/ImageUpload.tsx`
**描述**: 
- 点击 "添加图片" 打开文件选择
- 支持拖拽上传
- 显示上传进度
- 完成后跳转到笔记详情
**验收**: 图片上传流程顺畅

---

### Phase 6 检查点
- [ ] 图片上传正常
- [ ] OCR 识别正确
- [ ] AI 标签生成正常

---

## Phase 7: 链接 AI 分析 [US5]

### 目标
实现链接抓取和 AI 分析

### 独立测试标准
- 能提交链接并创建链接笔记
- 自动抓取网页标题、内容
- 自动生成摘要和标签

### 任务

#### T047 [US5] 实现网页抓取服务
**文件**: `backend/pkg/crawler/crawler.go`
**描述**: 
```go
type Crawler struct { ... }
func (c *Crawler) Fetch(url string) (*PageContent, error)

type PageContent struct {
    Title       string
    Description string
    Content     string
    ImageURL    string
    FaviconURL  string
}
```
使用 colly 或 chromedp
**验收**: 能抓取网页内容

---

#### T048 [US5] 实现链接分析 API
**文件**: `backend/internal/handler/upload/link.go`
**描述**: 
```
POST /api/v1/upload/link
Body: { url }
```
1. 抓取网页内容
2. 调用 AI 生成摘要和关键要点
3. 调用 AI 生成标签
4. 创建笔记 (note_type=ai_link)
5. 创建 link_preview 记录
**验收**: 提交链接后创建笔记

---

#### T049 [US5] 实现 link_previews 数据模型
**文件**: `backend/internal/model/linkpreview.go`, `backend/migrations/002_link_preview.sql`
**描述**: 
创建 link_previews 表和 GORM 模型
**验收**: 表结构正确

---

#### T050 [US5] 实现链接预览卡片组件
**文件**: `frontend/src/components/features/LinkPreviewCard.tsx`
**描述**: 
显示:
- 网站图标
- 标题
- 描述
- 预览图
**验收**: 卡片样式正确

---

#### T051 [US5] 实现添加链接弹窗
**文件**: `frontend/src/components/features/AddLinkDialog.tsx`
**描述**: 
- 输入框粘贴/输入 URL
- 确认按钮
- 处理中显示加载状态
**验收**: 能提交链接

---

### Phase 7 检查点
- [ ] 链接抓取正常
- [ ] AI 分析正确
- [ ] 预览卡片显示正常

---

## Phase 8: 音视频转文字 [US6] (可选)

### 目标
实现音视频上传和语音识别

### 独立测试标准
- 能上传音视频文件
- 自动转为文字稿
- 显示处理进度

### 任务

#### T052 [US6] 集成腾讯云 ASR SDK
**文件**: `backend/pkg/ai/asr.go`
**描述**: 
```go
type ASRClient struct { ... }
func (c *ASRClient) CreateTask(audioURL string) (string, error)
func (c *ASRClient) GetTaskStatus(taskId string) (*ASRResult, error)
```
**验收**: 能创建语音识别任务

---

#### T053 [US6] 实现音视频上传 API
**文件**: `backend/internal/handler/upload/media.go`
**描述**: 
```
POST /api/v1/upload/media
Content-Type: multipart/form-data
```
- 验证文件类型 (MP3/WAV/MP4/MOV)
- 验证文件大小 (<= 500MB)
- 上传到 COS
- 创建 AI 任务
**验收**: 能上传音视频

---

#### T054 [US6] 实现异步任务状态查询
**文件**: `backend/internal/handler/upload/mediastatus.go`
**描述**: 
```
GET /api/v1/upload/media/:task_id/status
```
返回: { status, progress, note_id }
**验收**: 能查询处理进度

---

#### T055 [US6] 实现 transcripts 数据模型
**文件**: `backend/internal/model/transcript.go`, `backend/migrations/003_transcript.sql`
**描述**: 
创建 transcripts 表和 GORM 模型
**验收**: 表结构正确

---

#### T056 [US6] 实现音视频处理后台任务
**文件**: `backend/internal/job/asrjob.go`
**描述**: 
1. 调用 ASR 接口
2. 轮询状态直到完成
3. 保存文字稿
4. 调用 AI 生成摘要
5. 创建笔记
**验收**: 处理完成后笔记创建

---

#### T057 [US6] 实现音视频上传前端组件
**文件**: `frontend/src/components/features/MediaUpload.tsx`
**描述**: 
- 文件选择
- 上传进度
- 处理进度轮询
- 完成后跳转
**验收**: 上传流程顺畅

---

### Phase 8 检查点
- [ ] 音视频上传正常
- [ ] ASR 转文字正确
- [ ] 进度显示正常

---

## Phase 9: UI 精调 [US8]

### 目标
对齐 Get笔记 视觉效果

### 独立测试标准
- UI 与 Get笔记 90%+ 一致
- 响应式适配正常

### 任务

#### T058 [US8] 配置 Get笔记 CSS 变量
**文件**: `frontend/src/styles/globals.css`
**描述**: 
参考 spec.md 中的 CSS 变量，配置:
```css
:root {
  --primary: 220 17% 14%;
  --background: 0 0% 100%;
  --aie-chat-item-user-bg-color: #2a88ff;
  /* ... 其他变量 */
}
```
**验收**: 颜色与 Get笔记 一致

---

#### T059 [US8] 实现响应式布局
**文件**: `frontend/src/components/layouts/MainLayout.tsx`
**描述**: 
- 桌面: 三栏布局
- 平板: 隐藏 AI 面板
- 手机: 侧边栏抽屉
**验收**: 各尺寸显示正常

---

#### T060 [US8] 实现骨架屏
**文件**: `frontend/src/components/features/NoteListSkeleton.tsx`, `frontend/src/components/features/NoteDetailSkeleton.tsx`
**描述**: 
使用 shadcn Skeleton 组件
**验收**: 加载时显示骨架屏

---

#### T061 [US8] 实现空状态
**文件**: `frontend/src/components/features/EmptyState.tsx`
**描述**: 
- 无笔记时显示引导
- 无搜索结果时显示提示
**验收**: 空状态显示正确

---

#### T062 [US8] 实现 Toast 通知
**文件**: `frontend/src/components/features/ToastProvider.tsx`
**描述**: 
使用 shadcn toast 组件，封装常用通知:
- success()
- error()
- loading()
**验收**: 通知显示正常

---

#### T063 [US8] 实现 AI 面板
**文件**: `frontend/src/components/features/AIPanel.tsx`
**描述**: 
- "你好，我是你的AI助手"
- 快捷提问按钮
- 输入框
**验收**: 样式与 Get笔记 一致

---

#### T064 [US8] UI 走查和修复
**文件**: 多个
**描述**: 
对比 Get笔记 截图，逐项修复:
- 间距
- 字体大小
- 圆角
- 阴影
**验收**: 视觉一致性 > 90%

---

#### T065 [US8] 实现动画效果
**文件**: `frontend/src/styles/animations.css`
**描述**: 
- 页面切换动画
- 弹窗进入/退出
- 列表项进入
**验收**: 动画流畅

---

### Phase 9 检查点
- [ ] UI 与 Get笔记 90%+ 一致
- [ ] 响应式正常
- [ ] 交互反馈完整

---

## Phase 10: 完善与部署

### 任务

#### T066 [Polish] 编写后端单元测试
**文件**: `backend/internal/logic/*_test.go`
**描述**: 
核心逻辑测试:
- 笔记 CRUD
- 乐观锁
- AI 服务 mock
**验收**: 覆盖率 > 70%

---

#### T067 [Polish] 安全审计
**文件**: 多个
**描述**: 
- SQL 注入检查
- XSS 检查
- CSRF Token 验证
- 敏感信息日志检查
**验收**: 无高危漏洞

---

#### T068 [Polish] 编写部署文档
**文件**: `docs/deployment.md`
**描述**: 
- Docker 部署步骤
- 环境变量配置
- 数据库初始化
- 常见问题
**验收**: 按文档能成功部署

---

### Phase 10 检查点
- [ ] 测试通过
- [ ] 安全审计通过
- [ ] 部署文档完整

---

## 依赖关系图

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundation)
    │
    ▼
Phase 3 (US1: 笔记 CRUD) ─────────────────────────┐
    │                                              │
    ▼                                              │
Phase 4 (US2: Tiptap 编辑器)                      │
    │                                              │
    ▼                                              │
Phase 5 (US3: 标签系统)                           │
    │                                              │
    ├──────────────────────┬───────────────────────┤
    ▼                      ▼                       │
Phase 6 (US4+US7)     Phase 7 (US5)               │
图片+存储              链接分析                    │
    │                      │                       │
    └──────────┬───────────┘                       │
               ▼                                   │
         Phase 8 (US6)  ◀──────────────────────────┘
         音视频转文字 (可选)
               │
               ▼
         Phase 9 (US8: UI 精调)
               │
               ▼
         Phase 10 (部署)
```

---

## 并行执行示例

### Phase 1-2 并行
```
T001 ──┬── T002 [P]
       ├── T003 [P]
       └── T004 [P]
           │
           ▼
       T005 ── T006
```

### Phase 3 内部并行
```
T013 ──┬── T014 [P]
       ├── T015 [P]
       └── T017 [P]
           │
           ▼
       T016 (依赖 T015)
           │
           ▼
T018 ── T019 ── T020 ── T021 ── T022
```

### Phase 6-7 并行
```
Phase 6 (图片) ─────┬───── Phase 7 (链接) [P]
                   │
                   ▼
               Phase 8 (音视频)
```

---

## MVP 范围建议

**MVP (最小可行产品)**: Phase 1-4 (约 2 周)

包含:
- 笔记 CRUD (US1)
- Tiptap 编辑器 (US2)
- 基础 UI 布局

不包含:
- 标签系统 (可后续迭代)
- AI 功能 (可后续迭代)
- 文件上传 (可后续迭代)

---

## 任务统计

| 阶段 | 任务数 | 预估工时 |
|------|--------|----------|
| Phase 1 Setup | 6 | 10h |
| Phase 2 Foundation | 6 | 12h |
| Phase 3 US1 笔记 CRUD | 12 | 24h |
| Phase 4 US2 编辑器 | 8 | 20h |
| Phase 5 US3 标签 | 8 | 14h |
| Phase 6 US4+US7 图片+存储 | 6 | 16h |
| Phase 7 US5 链接 | 5 | 12h |
| Phase 8 US6 音视频 | 6 | 14h |
| Phase 9 US8 UI 精调 | 8 | 20h |
| Phase 10 部署 | 3 | 10h |
| **总计** | **68** | **152h** |
