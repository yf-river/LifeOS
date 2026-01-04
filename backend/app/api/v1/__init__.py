"""API v1 路由"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.user import router as user_router
from app.api.v1.notes import router as notes_router
from app.api.v1.tags import router as tags_router, notes_tags_router
from app.api.v1.upload import router as upload_router
from app.api.v1.ai import router as ai_router
from app.api.v1.search import router as search_router
from app.api.v1.chat import router as chat_router
from app.api.v1.export import router as export_router
from app.api.v1.versions import router as versions_router
from app.api.v1.trash import router as trash_router

api_router = APIRouter()

# 注册路由
api_router.include_router(auth_router)
api_router.include_router(user_router)
api_router.include_router(notes_router)
api_router.include_router(tags_router)
api_router.include_router(notes_tags_router)
api_router.include_router(upload_router)
api_router.include_router(ai_router)
api_router.include_router(search_router)
api_router.include_router(chat_router)
api_router.include_router(export_router)
api_router.include_router(versions_router)
api_router.include_router(trash_router)
