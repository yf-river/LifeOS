# 快速开始指南 - Prism Next

## 先决条件
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose
- Capacitor CLI

## 1. 后端设置 (FastAPI)

```bash
cd backend
# 安装依赖
pip install poetry
poetry install

# 启动数据库
docker-compose up -d

# 运行开发服务器
poetry run uvicorn main:app --reload
```

## 2. 前端设置 (Next.js)

```bash
cd frontend
# 安装依赖
npm install

# 运行 Web 开发服务器
npm run dev
```

## 3. 移动端设置 (Capacitor)

```bash
cd frontend
# 构建 Web 资源
npm run build

# 同步到原生
npx cap sync

# 在 Xcode/Android Studio 中打开
npx cap open ios
npx cap open android
```

## 4. 环境变量

在 `backend/` 中创建 `.env` 文件:
```
DATABASE_URL=postgresql://user:pass@localhost:5432/prism
OPENAI_API_KEY=sk-...
```
