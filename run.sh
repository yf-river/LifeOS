#!/bin/bash

# LifeOS 开发启动脚本
# 用法:
#   ./dev.sh          - 显示帮助
#   ./dev.sh frontend - 启动前端 (清理缓存)
#   ./dev.sh backend  - 启动后端
#   ./dev.sh all      - 同时启动前后端
#   ./dev.sh db       - 启动数据库服务

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_DIR="$PROJECT_DIR/backend"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_help() {
    echo -e "${BLUE}LifeOS 开发启动脚本${NC}"
    echo ""
    echo "用法: ./dev.sh <command>"
    echo ""
    echo "命令:"
    echo "  frontend    启动前端开发服务器 (清理 .next 缓存)"
    echo "  backend     启动后端开发服务器"
    echo "  all         同时启动前后端 (后台运行)"
    echo "  db          启动数据库服务 (PostgreSQL + Redis)"
    echo "  stop        停止所有后台服务"
    echo ""
    echo "端口:"
    echo "  前端: http://localhost:3000"
    echo "  后端: http://localhost:8080"
    echo "  API文档: http://localhost:8080/docs"
}

start_frontend() {
    echo -e "${GREEN}启动前端开发服务器...${NC}"
    cd "$FRONTEND_DIR"
    npm run dev:clean
}

start_backend() {
    echo -e "${GREEN}启动后端开发服务器...${NC}"
    cd "$BACKEND_DIR"
    
    # 检查虚拟环境
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}创建 Python 虚拟环境...${NC}"
        python3 -m venv venv
    fi
    
    # 激活虚拟环境
    source venv/bin/activate
    
    # 安装依赖
    if [ ! -f "venv/.deps_installed" ]; then
        echo -e "${YELLOW}安装 Python 依赖...${NC}"
        pip install -r requirements.txt
        touch venv/.deps_installed
    fi
    
    # 启动服务
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
}

start_db() {
    echo -e "${GREEN}启动数据库服务...${NC}"
    cd "$PROJECT_DIR"
    docker-compose up -d postgres redis
    echo -e "${GREEN}数据库服务已启动${NC}"
    echo "  PostgreSQL: localhost:5433"
    echo "  Redis: localhost:6380"
}

start_all() {
    echo -e "${GREEN}启动所有服务...${NC}"
    
    # 先启动数据库
    start_db
    
    # 后台启动后端
    echo -e "${YELLOW}后台启动后端...${NC}"
    cd "$BACKEND_DIR"
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    source venv/bin/activate
    if [ ! -f "venv/.deps_installed" ]; then
        pip install -r requirements.txt
        touch venv/.deps_installed
    fi
    nohup uvicorn app.main:app --reload --host 0.0.0.0 --port 8080 > "$PROJECT_DIR/backend.log" 2>&1 &
    echo $! > "$PROJECT_DIR/.backend.pid"
    echo -e "${GREEN}后端已在后台启动 (PID: $(cat $PROJECT_DIR/.backend.pid))${NC}"
    
    # 前台启动前端
    echo -e "${YELLOW}启动前端...${NC}"
    cd "$FRONTEND_DIR"
    npm run dev:clean
}

stop_all() {
    echo -e "${YELLOW}停止所有服务...${NC}"
    
    # 停止后端
    if [ -f "$PROJECT_DIR/.backend.pid" ]; then
        PID=$(cat "$PROJECT_DIR/.backend.pid")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            echo -e "${GREEN}后端已停止 (PID: $PID)${NC}"
        fi
        rm "$PROJECT_DIR/.backend.pid"
    fi
    
    # 停止数据库
    cd "$PROJECT_DIR"
    docker-compose down
    echo -e "${GREEN}数据库服务已停止${NC}"
}

# 主逻辑
case "${1:-}" in
    frontend|fe|f)
        start_frontend
        ;;
    backend|be|b)
        start_backend
        ;;
    db|database)
        start_db
        ;;
    all|a)
        start_all
        ;;
    stop|s)
        stop_all
        ;;
    *)
        print_help
        ;;
esac
