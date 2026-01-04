"""腾讯云 COS 存储服务"""

import asyncio
from typing import Optional

from qcloud_cos import CosConfig, CosS3Client

from app.core.config import settings


def get_cos_client() -> Optional[CosS3Client]:
    """获取 COS 客户端"""
    if not settings.TENCENT_SECRET_ID or not settings.TENCENT_SECRET_KEY:
        return None

    config = CosConfig(
        Region=settings.COS_REGION,
        SecretId=settings.TENCENT_SECRET_ID,
        SecretKey=settings.TENCENT_SECRET_KEY,
    )
    return CosS3Client(config)


async def upload_to_cos(content: bytes, file_name: str, content_type: str) -> str:
    """上传文件到 COS

    Args:
        content: 文件内容
        file_name: 文件名（包含路径）
        content_type: MIME 类型

    Returns:
        文件 URL
    """
    client = get_cos_client()

    if not client or not settings.COS_BUCKET:
        # 开发环境：返回模拟 URL
        return f"https://{settings.COS_BUCKET or 'mock-bucket'}.cos.{settings.COS_REGION}.myqcloud.com/{file_name}"

    # 同步上传（在线程池中执行）
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: client.put_object(
            Bucket=settings.COS_BUCKET,
            Body=content,
            Key=file_name,
            ContentType=content_type,
        ),
    )

    # 返回文件 URL
    return f"https://{settings.COS_BUCKET}.cos.{settings.COS_REGION}.myqcloud.com/{file_name}"


async def delete_from_cos(file_name: str) -> bool:
    """从 COS 删除文件"""
    client = get_cos_client()

    if not client or not settings.COS_BUCKET:
        return True

    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: client.delete_object(
                Bucket=settings.COS_BUCKET,
                Key=file_name,
            ),
        )
        return True
    except Exception:
        return False
