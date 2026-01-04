"""文件上传 API"""

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_db, get_current_user, success, invalid_params, server_error, settings
from app.models import User, Attachment
from app.services.storage import upload_to_cos

router = APIRouter(prefix="/upload", tags=["上传"])

# 允许的文件类型
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "audio/mp4", "audio/x-m4a"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/ogg"}


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    note_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """上传图片"""
    # 验证文件类型
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        return invalid_params("不支持的图片格式")

    # 验证文件大小（10MB）
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        return invalid_params("图片大小不能超过10MB")

    # 生成文件名
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    file_name = f"images/{datetime.now().strftime('%Y/%m/%d')}/{uuid.uuid4()}.{ext}"

    # 上传到 COS
    try:
        url = await upload_to_cos(content, file_name, file.content_type)
    except Exception as e:
        return server_error(f"上传失败: {str(e)}")

    # 创建附件记录
    attachment = Attachment(
        note_id=note_id,
        user_id=current_user.id,
        type="image",
        file_name=file.filename,
        file_size=len(content),
        mime_type=file.content_type,
        url=url,
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)

    return success({
        "id": attachment.id,
        "url": url,
        "file_name": file.filename,
        "file_size": len(content),
    })


@router.post("/audio")
async def upload_audio(
    file: UploadFile = File(...),
    note_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """上传音频"""
    if file.content_type not in ALLOWED_AUDIO_TYPES:
        return invalid_params("不支持的音频格式")

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:  # 50MB
        return invalid_params("音频大小不能超过50MB")

    ext = file.filename.split(".")[-1] if "." in file.filename else "mp3"
    file_name = f"audio/{datetime.now().strftime('%Y/%m/%d')}/{uuid.uuid4()}.{ext}"

    try:
        url = await upload_to_cos(content, file_name, file.content_type)
    except Exception as e:
        return server_error(f"上传失败: {str(e)}")

    attachment = Attachment(
        note_id=note_id,
        user_id=current_user.id,
        type="audio",
        file_name=file.filename,
        file_size=len(content),
        mime_type=file.content_type,
        url=url,
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)

    return success({
        "id": attachment.id,
        "url": url,
        "file_name": file.filename,
        "file_size": len(content),
    })


@router.post("/video")
async def upload_video(
    file: UploadFile = File(...),
    note_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """上传视频"""
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        return invalid_params("不支持的视频格式")

    content = await file.read()
    if len(content) > 200 * 1024 * 1024:  # 200MB
        return invalid_params("视频大小不能超过200MB")

    ext = file.filename.split(".")[-1] if "." in file.filename else "mp4"
    file_name = f"video/{datetime.now().strftime('%Y/%m/%d')}/{uuid.uuid4()}.{ext}"

    try:
        url = await upload_to_cos(content, file_name, file.content_type)
    except Exception as e:
        return server_error(f"上传失败: {str(e)}")

    attachment = Attachment(
        note_id=note_id,
        user_id=current_user.id,
        type="video",
        file_name=file.filename,
        file_size=len(content),
        mime_type=file.content_type,
        url=url,
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)

    return success({
        "id": attachment.id,
        "url": url,
        "file_name": file.filename,
        "file_size": len(content),
    })
