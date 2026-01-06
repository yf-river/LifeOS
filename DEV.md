# 本地开发手册

## 快速启动

### 1. 启动数据库（Docker）

```bash
cd /Users/huyunfei/project/LifeOS
docker-compose up -d postgres redis
```

### 2. 启动后端

```bash
cd /Users/huyunfei/project/LifeOS/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

首次运行需要先安装依赖：
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. 启动前端

```bash
cd /Users/huyunfei/project/LifeOS/frontend
npm run dev
```

首次运行需要先安装依赖：
```bash
npm install
```

## 访问地址

| 服务 | 地址 |
|-----|------|
| 前端 | http://localhost:3000 |
| 后端 | http://localhost:8080 |
| API 文档 | http://localhost:8080/docs |

## 热更新

- **前端**: 修改代码后自动刷新
- **后端**: 修改代码后自动重启（`--reload` 参数）

## 何时需要手动重启

| 场景 | 前端 | 后端 |
|-----|------|------|
| 修改代码 | 自动 | 自动 |
| 修改 package.json | `npm install` | - |
| 修改 requirements.txt | - | `pip install -r requirements.txt` |
| 修改 .env 文件 | 重启 | 重启 |

## 环境变量

后端 `.env` 文件（从 `.env.example` 复制）：
```
DATABASE_URL=postgresql+asyncpg://lifeos:lifeos123@localhost:5433/lifeos
REDIS_URL=redis://localhost:6380/0
JWT_SECRET=lifeos-jwt-secret-2026
DEBUG=true
```

前端 `.env.local` 文件：
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

## 停止服务

- 前端/后端: `Ctrl+C`
- 数据库: `docker-compose down`
