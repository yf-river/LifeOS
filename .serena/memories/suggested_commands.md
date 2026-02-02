# 常用命令

## 开发环境启动

### Docker Compose（推荐）
```bash
# 启动所有服务（PostgreSQL, Redis, 后端, 前端）
docker-compose up -d

# 只启动数据库服务
docker-compose up -d postgres redis

# 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 停止所有服务
docker-compose down

# 重启特定服务
docker-compose restart backend
```

### 前端开发
```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器（端口 3000）
npm run dev

# 清理缓存并启动开发服务器
npm run dev:clean

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint
```

### 后端开发
```bash
cd backend

# 创建虚拟环境（如果不存在）
python -m venv venv

# 激活虚拟环境（Linux/Mac）
source venv/bin/activate
# Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 安装开发依赖
pip install -e ".[dev]"

# 使用 hatch 启动开发服务器（带热重载，端口 8080）
hatch run dev

# 启动生产服务器
hatch run start

# 运行测试
hatch run test

# 运行测试并生成覆盖率报告
hatch run test:cov

# 代码格式化
black .
ruff check .
ruff format .
```

## 测试

### E2E 测试（Playwright）
```bash
cd frontend

# 运行 E2E 测试
npm run test:e2e

# 运行带 UI 的 E2E 测试
npm run test:e2e:ui

# 查看测试报告
npm run test:e2e:report
```

## 数据库

### 初始化数据库
```bash
# 通过 Docker Compose 启动时会自动执行 scripts/init.sql
docker-compose up -d postgres

# 手动连接数据库
psql -h localhost -p 5433 -U lifeos -d lifeos
# 密码: lifeos123
```

### 数据库迁移
```bash
cd backend
alembic revision --autogenerate -m "迁移描述"
alembic upgrade head
```

## Git 命令
```bash
# 查看状态
git status

# 添加文件
git add .

# 提交更改
git commit -m "提交信息"

# 推送更改
git push origin <分支名>

# 拉取更新
git pull origin <分支名>
```

## 系统工具命令
```bash
# 查看进程
ps aux | grep [服务名]

# 查看端口占用
lsof -i :3000

# 查找文件
find . -name "*.ts" -type f

# 搜索代码
grep -r "搜索内容" .

# 清理 node_modules（如果需要）
rm -rf node_modules && npm install
```