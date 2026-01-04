# 快速启动指南

功能分支: `002-second-req-dev`
生成时间: 2026-01-03

---

## 环境要求

| 组件 | 版本 | 用途 |
|------|------|------|
| Node.js | >= 18.x | 前端构建 |
| Go | >= 1.21 | 后端服务 |
| PostgreSQL | >= 15 | 数据库 |
| Redis | >= 7.0 | 缓存 (可选) |
| Docker | >= 24.x | 容器化部署 |

---

## 项目结构

```
get-notes-clone/
├── frontend/                 # Next.js 前端
│   ├── src/
│   │   ├── app/             # App Router 页面
│   │   ├── components/
│   │   │   ├── ui/          # shadcn/ui 组件
│   │   │   ├── features/    # 业务组件
│   │   │   └── layouts/     # 布局组件
│   │   ├── lib/             # 工具函数
│   │   ├── stores/          # Zustand stores
│   │   └── styles/          # 全局样式
│   ├── public/
│   ├── package.json
│   └── tailwind.config.ts
│
├── backend/                  # Go 后端
│   ├── cmd/
│   │   └── api/             # 主入口
│   ├── internal/
│   │   ├── config/          # 配置
│   │   ├── handler/         # HTTP 处理器
│   │   ├── logic/           # 业务逻辑
│   │   ├── model/           # 数据模型
│   │   ├── svc/             # 服务上下文
│   │   └── types/           # 类型定义
│   ├── pkg/
│   │   ├── ai/              # AI 服务封装
│   │   └── storage/         # 文件存储封装
│   ├── go.mod
│   └── etc/                 # 配置文件
│
├── docker-compose.yml
├── Makefile
└── specs/                   # 规范文档
```

---

## 快速开始

### 1. 克隆项目

```bash
git clone <repo-url>
cd get-notes-clone
git checkout 002-second-req-dev
```

### 2. 启动数据库

```bash
# 使用 Docker Compose
docker-compose up -d postgres redis

# 或本地 PostgreSQL
createdb get_notes_dev
```

### 3. 配置环境变量

**后端 (`backend/etc/api.yaml`)**:
```yaml
Name: get-notes-api
Host: 0.0.0.0
Port: 8080

Database:
  DSN: "host=localhost user=postgres password=postgres dbname=get_notes_dev port=5432 sslmode=disable"

JWT:
  Secret: "your-jwt-secret-key-change-in-production"
  Expire: 86400  # 24 hours

AI:
  DeepSeek:
    APIKey: "sk-xxx"
    BaseURL: "https://api.deepseek.com"
  TencentOCR:
    SecretId: "xxx"
    SecretKey: "xxx"
  TencentASR:
    SecretId: "xxx"
    SecretKey: "xxx"

Storage:
  Type: "cos"  # cos | local
  COS:
    SecretId: "xxx"
    SecretKey: "xxx"
    Bucket: "get-notes-xxx"
    Region: "ap-guangzhou"
```

**前端 (`.env.local`)**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

### 4. 启动后端

```bash
cd backend

# 安装依赖
go mod tidy

# 运行数据库迁移
go run cmd/migrate/main.go

# 启动服务
go run cmd/api/main.go
```

### 5. 启动前端

```bash
cd frontend

# 安装依赖
pnpm install

# 安装 shadcn/ui 组件
pnpm dlx shadcn-ui@latest init
pnpm dlx shadcn-ui@latest add button card input dialog toast

# 启动开发服务器
pnpm dev
```

### 6. 访问应用

- **前端**: http://localhost:3000
- **后端 API**: http://localhost:8080/api/v1
- **API 文档**: http://localhost:8080/swagger

---

## Docker 一键启动

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

**docker-compose.yml**:
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

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis
    environment:
      - DB_HOST=postgres
      - REDIS_HOST=redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 常用命令

```bash
# === 后端 ===
make build          # 构建
make test           # 测试
make lint           # 代码检查
make migrate        # 数据库迁移
make swagger        # 生成 API 文档

# === 前端 ===
pnpm dev            # 开发
pnpm build          # 构建
pnpm lint           # 代码检查
pnpm test           # 测试

# === Docker ===
make docker-build   # 构建镜像
make docker-up      # 启动服务
make docker-down    # 停止服务
```

---

## 开发规范

### Git 分支

```
main                    # 稳定版本
└── feature/002-xxx     # 功能开发
```

### Commit 格式

```
feat: 添加笔记创建功能
fix: 修复乐观锁冲突处理
docs: 更新 API 文档
chore: 升级依赖
```

### 代码风格

- **Go**: `gofmt` + `golangci-lint`
- **TypeScript**: ESLint + Prettier
- **CSS**: Tailwind CSS 优先

---

## 测试账号

开发环境可使用以下测试账号:

```
# 本地开发 (跳过真实认证)
Authorization: Bearer dev-test-token
```

---

## 常见问题

### Q: 数据库连接失败

```bash
# 检查 PostgreSQL 是否运行
docker-compose ps postgres

# 检查连接字符串
psql "postgresql://postgres:postgres@localhost:5432/get_notes_dev"
```

### Q: AI 服务调用失败

1. 检查 API Key 是否正确配置
2. 检查网络是否能访问 API 端点
3. 查看后端日志: `docker-compose logs backend`

### Q: 前端编译错误

```bash
# 清理缓存重新安装
rm -rf node_modules .next
pnpm install
pnpm dev
```

---

## 参考文档

- [spec.md](./spec.md) - 功能规范
- [data-model.md](./data-model.md) - 数据模型
- [api-reference.md](./api-reference.md) - API 参考 (Get笔记原始)
- [contracts/api-spec.yaml](./contracts/api-spec.yaml) - OpenAPI 规范
- [research.md](./research.md) - 技术研究
