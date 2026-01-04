"""AI 服务 API"""

import re
from typing import Optional
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_db, get_current_user, success, invalid_params, server_error, settings
from app.models import User, Attachment
from app.schemas import OCRRequest, ASRRequest, SummaryRequest, LinkPreviewRequest
from app.services.tencent import call_ocr, call_asr
from app.services.deepseek import call_summary

router = APIRouter(prefix="/ai", tags=["AI服务"])


@router.post("/ocr")
async def ocr(
    data: OCRRequest,
    current_user: User = Depends(get_current_user),
):
    """OCR 图片文字识别"""
    if not data.image_url and not data.image_base64:
        return invalid_params("请提供图片URL或Base64")

    try:
        text = await call_ocr(data.image_url, data.image_base64)
        return success({"text": text})
    except Exception as e:
        return server_error(f"OCR识别失败: {str(e)}")


@router.post("/asr")
async def asr(
    data: ASRRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """ASR 语音识别"""
    audio_url = data.audio_url

    # 如果提供了附件ID，获取URL
    if data.attachment_id:
        result = await db.execute(
            select(Attachment).where(Attachment.id == data.attachment_id)
        )
        attachment = result.scalar_one_or_none()
        if not attachment:
            return invalid_params("附件不存在")
        audio_url = attachment.url

    if not audio_url:
        return invalid_params("请提供音频URL或附件ID")

    try:
        text = await call_asr(audio_url)

        # 更新附件的 ASR 文本
        if data.attachment_id:
            result = await db.execute(
                select(Attachment).where(Attachment.id == data.attachment_id)
            )
            attachment = result.scalar_one_or_none()
            if attachment:
                attachment.asr_text = text
                await db.commit()

        return success({"text": text})
    except Exception as e:
        return server_error(f"语音识别失败: {str(e)}")


@router.post("/summary")
async def summary(
    data: SummaryRequest,
    current_user: User = Depends(get_current_user),
):
    """AI 摘要生成"""
    if not data.content:
        return invalid_params("内容不能为空")

    try:
        result = await call_summary(data.content, data.max_length)
        return success({"summary": result})
    except Exception as e:
        return server_error(f"生成摘要失败: {str(e)}")


@router.post("/link-preview")
async def link_preview(
    data: LinkPreviewRequest,
    current_user: User = Depends(get_current_user),
):
    """获取链接预览"""
    if not data.url:
        return invalid_params("URL不能为空")

    try:
        preview = await fetch_link_preview(data.url)
        return success(preview)
    except Exception as e:
        return server_error(f"获取链接预览失败: {str(e)}")


async def fetch_link_preview(url: str) -> dict:
    """获取链接预览信息"""
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        response = await client.get(url, headers={
            "User-Agent": "Mozilla/5.0 (compatible; GetNotesBot/1.0)"
        })
        response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    parsed_url = urlparse(url)

    preview = {
        "url": url,
        "title": None,
        "description": None,
        "image": None,
        "favicon": None,
        "site_name": None,
    }

    # Open Graph 标签
    for meta in soup.find_all("meta"):
        prop = meta.get("property", "")
        content = meta.get("content", "")

        if prop == "og:title":
            preview["title"] = content
        elif prop == "og:description":
            preview["description"] = content
        elif prop == "og:image":
            preview["image"] = content
        elif prop == "og:site_name":
            preview["site_name"] = content

    # 回退到普通标签
    if not preview["title"]:
        title_tag = soup.find("title")
        if title_tag:
            preview["title"] = title_tag.get_text().strip()

    if not preview["description"]:
        desc_meta = soup.find("meta", attrs={"name": "description"})
        if desc_meta:
            preview["description"] = desc_meta.get("content", "")

    # Favicon
    favicon_link = soup.find("link", rel=lambda x: x and "icon" in x.lower() if x else False)
    if favicon_link:
        favicon_href = favicon_link.get("href", "")
        if favicon_href:
            if not favicon_href.startswith("http"):
                if favicon_href.startswith("/"):
                    preview["favicon"] = f"{parsed_url.scheme}://{parsed_url.netloc}{favicon_href}"
                else:
                    preview["favicon"] = f"{parsed_url.scheme}://{parsed_url.netloc}/{favicon_href}"
            else:
                preview["favicon"] = favicon_href

    # Site name 回退
    if not preview["site_name"]:
        preview["site_name"] = parsed_url.netloc

    return preview
