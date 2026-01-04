"""依赖注入"""

from typing import Optional

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    """获取当前用户"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供认证信息",
        )

    # 支持 Bearer token 格式
    token = authorization
    if authorization.startswith("Bearer "):
        token = authorization[7:]

    # 开发环境测试 token
    if token == "dev-test-token":
        # 返回测试用户（实际环境需要从数据库获取）
        from sqlalchemy import select

        result = await db.execute(select(User).where(User.email == "test@example.com"))
        user = result.scalar_one_or_none()
        if user:
            return user
        # 如果没有测试用户，创建一个
        from app.core.security import hash_password

        user = User(
            email="test@example.com",
            password=hash_password("test123"),
            nickname="测试用户",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    # 解码 token
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证信息",
        )

    # 查询用户
    from sqlalchemy import select

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
        )

    return user


async def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """获取当前用户（可选）"""
    if not authorization:
        return None

    try:
        return await get_current_user(authorization, db)
    except HTTPException:
        return None
