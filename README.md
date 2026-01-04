# Get笔记 Clone

一个功能完整的 Get笔记 Web 端 1:1 克隆，使用现代技术栈构建。

## 技术栈

### 前端
- **框架**: Next.js 14 (App Router)
- **UI**: React 18 + shadcn/ui + Tailwind CSS
- **状态管理**: Zustand
- **编辑器**: Tiptap 2.x (ProseMirror)
- **语言**: TypeScript

### 后端
- **语言**: Python 3.11
- **框架**: FastAPI
- **ORM**: SQLAlchemy 2.0 (异步)
- **数据库**: PostgreSQL 15
- **缓存**: Redis 7

### AI 服务
- **OCR**: 腾讯云通用文字识别
- **ASR**: 腾讯云语音识别
- **文本**: DeepSeek API

### 存储
- **文件**: 腾讯云 COS

## 功能特性

- ✅ 笔记 CRUD（创建、读取、更新、删除）
- ✅ 富文本编辑器（Tiptap）
  - 标题、加粗、斜体、删除线
  - 代码块、引用、高亮
  - 有序/无序列表、任务列表
  - 链接、图片
- ✅ 标签系统
- ✅ 搜索（全文搜索）
- ✅ 置顶笔记
- ✅ 图片上传 + OCR 识别
- ✅ 录音 + 语音转文字
- ✅ 链接预览卡片
- ✅ 乐观锁版本冲突处理
- ✅ Omnibar 快捷搜索
- ✅ 键盘快捷键

## 快速开始

### 使用 Docker Compose（推荐）

```bash
# 克隆项目
git clone <repo-url>
cd get-notes-clone

# 启动所有服务
docker-compose up -d

# 访问
# 前端: http://localhost:3000
# 后端: http://localhost:8080
# API 文档: http://localhost:8080/docs
```

### 本地开发

#### 后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 复制环境变量
cp .env.example .env

# 启动数据库（需要先启动 PostgreSQL）
# 或使用 docker-compose up postgres redis -d

# 启动服务
uvicorn app.main:app --reload --port 8080
```

#### 前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 配置

### 环境变量

后端 (`.env`):
```
# 数据库
DATABASE_URL=postgresql+asyncpg://getnotes:getnotes123@localhost:5432/getnotes

# JWT
JWT_SECRET=your-jwt-secret

# 腾讯云（可选）
TENCENT_SECRET_ID=your-secret-id
TENCENT_SECRET_KEY=your-secret-key
COS_BUCKET=your-bucket
COS_REGION=ap-guangzhou

# DeepSeek（可选）
DEEPSEEK_API_KEY=your-api-key
```

前端 (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

## API 文档

启动后端后访问 http://localhost:8080/docs 查看 Swagger 文档。

API 遵循统一响应格式：

```json
{
  "h": {
    "c": 0,          // 状态码，0=成功
    "e": "",         // 错误信息
    "s": "success",  // 状态文本
    "t": 1234567890, // 时间戳
    "apm": {}        // 分页信息（可选）
  },
  "c": {}            // 响应数据
}
```

## 项目结构

```
get-notes-clone/
├── frontend/                 # Next.js 前端
│   ├── src/
│   │   ├── app/             # 页面
│   │   ├── components/      # 组件
│   │   ├── store/           # Zustand 状态
│   │   ├── hooks/           # 自定义 Hooks
│   │   └── lib/             # 工具函数
│   └── ...
├── backend/                  # Python FastAPI 后端
│   ├── app/
│   │   ├── api/v1/          # API 路由
│   │   ├── core/            # 核心配置
│   │   ├── models/          # SQLAlchemy 模型
│   │   ├── schemas/         # Pydantic Schema
│   │   ├── services/        # 业务服务
│   │   └── main.py          # 入口
│   └── tests/               # 测试
├── scripts/                  # 脚本
│   └── init.sql             # 数据库初始化
├── docker-compose.yml        # Docker 编排
└── README.md
```

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `⌘ K` | 打开搜索 |
| `⌘ N` | 新建笔记 |
| `Esc` | 关闭弹窗 |

## License

MIT
