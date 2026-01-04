"""用户相关 Schema"""

from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserLogin(BaseModel):
    """登录请求"""

    email: EmailStr
    password: str = Field(..., min_length=6)


class UserRegister(BaseModel):
    """注册请求"""

    email: EmailStr
    password: str = Field(..., min_length=6)
    nickname: Optional[str] = None


class UserUpdate(BaseModel):
    """更新用户资料"""

    nickname: Optional[str] = None
    avatar: Optional[str] = None


class UserResponse(BaseModel):
    """用户响应"""

    id: str
    email: str
    nickname: Optional[str]
    avatar: Optional[str]

    class Config:
        from_attributes = True
