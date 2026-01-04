"""FastAPI 应用入口"""

import contextlib
from contextlib import asynccontextmanager
import asyncio
from datetime import datetime, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db, AsyncSessionLocal
from app.core.response import success
from app.api.v1 import api_router
# 导入模型以注册到 metadata
from app.models import User, Note, Tag, NoteTag, Attachment  # noqa: F401


async def cleanup_trash_worker():
    """周期性清理回收站中过期笔记"""
    while True:
        try:
            async with AsyncSessionLocal() as session:
                threshold = datetime.utcnow() - timedelta(days=settings.TRASH_RETENTION_DAYS)
                await session.execute(
                    Note.__table__.delete().where(
                        Note.deleted_at.is_not(None),
                        Note.deleted_at < threshold,
                    )
                )
                await session.commit()
        except Exception:
            # 静默错误，防止中断循环
            pass
        await asyncio.sleep(settings.TRASH_CLEANUP_INTERVAL_HOURS * 3600)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期"""
    # 启动时初始化数据库
    await init_db()

    # 启动回收站清理后台任务
    cleanup_task = asyncio.create_task(cleanup_trash_worker())

    yield

    # 关闭时清理资源
    cleanup_task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await cleanup_task


app = FastAPI(
    title=settings.APP_NAME,
    description="Get笔记 Clone 后端 API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册 API 路由
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
async def root():
    """根路径"""
    return success({
        "name": settings.APP_NAME,
        "version": "0.1.0",
    })


@app.get("/health")
async def health():
    """健康检查"""
    return success({
        "status": "ok",
    })
