"""用户相关 API"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_db, get_current_user, success, server_error
from app.models import User
from app.schemas import UserUpdate

router = APIRouter(prefix="/user", tags=["用户"])


@router.get("/profile")
async def get_profile(
    current_user: User = Depends(get_current_user),
):
    """获取用户资料"""
    return success(current_user.to_dict())


@router.put("/profile")
async def update_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """更新用户资料"""
    if data.nickname is not None:
        current_user.nickname = data.nickname
    if data.avatar is not None:
        current_user.avatar = data.avatar

    try:
        await db.commit()
        await db.refresh(current_user)
        return success(current_user.to_dict())
    except Exception as e:
        await db.rollback()
        return server_error(f"更新失败: {str(e)}")
