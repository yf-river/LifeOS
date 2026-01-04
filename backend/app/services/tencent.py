"""腾讯云 AI 服务（OCR、ASR）"""

import asyncio
import json
from typing import Optional

from tencentcloud.common import credential
from tencentcloud.common.profile.client_profile import ClientProfile
from tencentcloud.common.profile.http_profile import HttpProfile
from tencentcloud.ocr.v20181119 import ocr_client, models as ocr_models
from tencentcloud.asr.v20190614 import asr_client, models as asr_models

from app.core.config import settings


def get_credential():
    """获取腾讯云凭证"""
    if not settings.TENCENT_SECRET_ID or not settings.TENCENT_SECRET_KEY:
        return None
    return credential.Credential(settings.TENCENT_SECRET_ID, settings.TENCENT_SECRET_KEY)


async def call_ocr(image_url: Optional[str] = None, image_base64: Optional[str] = None) -> str:
    """调用腾讯云 OCR 通用文字识别

    Args:
        image_url: 图片 URL
        image_base64: 图片 Base64

    Returns:
        识别的文本
    """
    cred = get_credential()
    if not cred:
        # 开发环境模拟
        return "[OCR 模拟结果] 这是识别出的文字内容"

    http_profile = HttpProfile()
    http_profile.endpoint = "ocr.tencentcloudapi.com"

    client_profile = ClientProfile()
    client_profile.httpProfile = http_profile

    client = ocr_client.OcrClient(cred, "ap-guangzhou", client_profile)

    req = ocr_models.GeneralBasicOCRRequest()
    params = {}
    if image_url:
        params["ImageUrl"] = image_url
    elif image_base64:
        params["ImageBase64"] = image_base64
    req.from_json_string(json.dumps(params))

    # 同步调用（在线程池中执行）
    loop = asyncio.get_event_loop()
    resp = await loop.run_in_executor(None, client.GeneralBasicOCR, req)

    # 提取文本
    texts = []
    for item in resp.TextDetections:
        texts.append(item.DetectedText)

    return "\n".join(texts)


async def call_asr(audio_url: str) -> str:
    """调用腾讯云 ASR 语音识别

    注意：这是录音文件识别，是异步任务。
    简化处理：这里只返回模拟结果。
    实际使用需要：
    1. 创建识别任务 (CreateRecTask)
    2. 轮询获取结果 (DescribeTaskStatus)

    Args:
        audio_url: 音频 URL

    Returns:
        识别的文本
    """
    cred = get_credential()
    if not cred:
        # 开发环境模拟
        return "[ASR 模拟结果] 这是语音识别出的文字内容"

    http_profile = HttpProfile()
    http_profile.endpoint = "asr.tencentcloudapi.com"

    client_profile = ClientProfile()
    client_profile.httpProfile = http_profile

    client = asr_client.AsrClient(cred, "", client_profile)

    # 创建识别任务
    req = asr_models.CreateRecTaskRequest()
    params = {
        "EngineModelType": "16k_zh",
        "ChannelNum": 1,
        "ResTextFormat": 0,
        "SourceType": 0,
        "Url": audio_url,
    }
    req.from_json_string(json.dumps(params))

    loop = asyncio.get_event_loop()
    resp = await loop.run_in_executor(None, client.CreateRecTask, req)

    # 实际使用需要轮询 DescribeTaskStatus 获取结果
    # 这里简化返回任务 ID
    return f"[ASR 任务已创建] TaskId: {resp.Data.TaskId}，请稍后查询结果"
