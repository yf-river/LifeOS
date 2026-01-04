#!/bin/bash

# LifeOS - 一键重建脚本
# 用法: ./scripts/rebuild.sh [选项]
#
# 选项:
#   --frontend   只重建前端
#   --backend    只重建后端
#   --all        重建所有服务（默认）
#   --clean      清理镜像和卷后重建

set -e

cd "$(dirname "$0")/.."

echo "🚀 LifeOS - 重建脚本"
echo "================================"

# 解析参数
TARGET="all"
CLEAN=false

for arg in "$@"; do
    case $arg in
        --frontend)
            TARGET="frontend"
            ;;
        --backend)
            TARGET="backend"
            ;;
        --all)
            TARGET="all"
            ;;
        --clean)
            CLEAN=true
            ;;
    esac
done

# 停止所有容器
echo "📦 停止现有容器..."
if [ "$CLEAN" = true ]; then
    docker compose down -v --rmi all --remove-orphans
else
    docker compose down --remove-orphans
fi

# 重建
case $TARGET in
    frontend)
        echo "🔨 重建前端镜像..."
        docker compose build --no-cache frontend
        ;;
    backend)
        echo "🔨 重建后端镜像..."
        docker compose build --no-cache backend
        ;;
    all)
        echo "🔨 重建所有镜像..."
        docker compose build --no-cache
        ;;
esac

# 启动
echo "🚀 启动服务..."
docker compose up -d

# 等待服务就绪
echo "⏳ 等待服务就绪..."
sleep 5

# 检查服务状态
echo ""
echo "📊 服务状态:"
docker compose ps

echo ""
echo "✅ 完成！"
echo ""
echo "🌐 访问地址:"
echo "   前端: http://localhost:3000"
echo "   后端: http://localhost:8080"
echo "   API文档: http://localhost:8080/docs"
echo ""
echo "📝 查看日志: docker compose logs -f"
