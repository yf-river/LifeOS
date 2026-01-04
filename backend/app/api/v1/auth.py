"""认证相关 API"""

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import (
    get_db,
    success,
    invalid_params,
    unauthorized,
    hash_password,
    verify_password,
    create_access_token,
)
from app.models import User
from app.schemas import UserLogin, UserRegister

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/login")
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    """登录"""
    # 查找用户
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user:
        return unauthorized("邮箱或密码错误")

    # 验证密码
    if not verify_password(data.password, user.password):
        return unauthorized("邮箱或密码错误")

    # 生成 token
    token = create_access_token(user.id)

    # 更新最后登录时间
    user.last_login_at = datetime.utcnow()
    await db.commit()

    return success({
        "token": token,
        "user": user.to_dict(),
    })


@router.post("/register")
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    """注册"""
    # 检查邮箱是否已存在
    result = await db.execute(select(User).where(User.email == data.email))
    existing = result.scalar_one_or_none()

    if existing:
        return invalid_params("邮箱已被注册")

    # 创建用户
    user = User(
        email=data.email,
        password=hash_password(data.password),
        nickname=data.nickname or "用户",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # 生成 token
    token = create_access_token(user.id)

    return success({
        "token": token,
        "user": user.to_dict(),
    })
