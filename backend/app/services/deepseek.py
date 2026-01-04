"""DeepSeek AI 服务"""

from typing import AsyncGenerator

import httpx

from app.core.config import settings


async def call_summary(content: str, max_length: int = 200) -> str:
    """调用 DeepSeek API 生成摘要

    Args:
        content: 要摘要的内容
        max_length: 摘要最大长度

    Returns:
        摘要文本
    """
    if not settings.DEEPSEEK_API_KEY:
        # 开发环境模拟
        return f"[摘要模拟] {content[:max_length]}..."

    prompt = f"请为以下内容生成一个简洁的摘要，不超过{max_length}字：\n\n{content}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{settings.DEEPSEEK_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.DEEPSEEK_MODEL,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": max_length * 2,
            },
        )
        response.raise_for_status()
        data = response.json()

    if data.get("choices") and len(data["choices"]) > 0:
        return data["choices"][0]["message"]["content"]

    return ""


async def call_chat(messages: list, max_tokens: int = 1000) -> str:
    """调用 DeepSeek 聊天 API

    Args:
        messages: 消息列表 [{"role": "user", "content": "..."}]
        max_tokens: 最大 token 数

    Returns:
        AI 回复
    """
    if not settings.DEEPSEEK_API_KEY:
        return "[AI 模拟回复] 这是 AI 的回复内容"

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{settings.DEEPSEEK_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.DEEPSEEK_MODEL,
                "messages": messages,
                "max_tokens": max_tokens,
            },
        )
        response.raise_for_status()
        data = response.json()

    if data.get("choices") and len(data["choices"]) > 0:
        return data["choices"][0]["message"]["content"]

    return ""


async def call_chat_stream(messages: list, max_tokens: int = 1000) -> AsyncGenerator[str, None]:
    """调用 DeepSeek 聊天 API（流式响应）

    Args:
        messages: 消息列表 [{"role": "user", "content": "..."}]
        max_tokens: 最大 token 数

    Yields:
        AI 回复的文本片段
    """
    if not settings.DEEPSEEK_API_KEY:
        # 开发环境模拟流式输出
        mock_response = "[AI 模拟回复] 这是流式 AI 的回复内容，正在逐字输出..."
        for char in mock_response:
            yield char
        return

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            f"{settings.DEEPSEEK_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.DEEPSEEK_MODEL,
                "messages": messages,
                "max_tokens": max_tokens,
                "stream": True,
            },
        ) as response:
            response.raise_for_status()
            
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        break
                    
                    try:
                        import json
                        data = json.loads(data_str)
                        if data.get("choices") and len(data["choices"]) > 0:
                            delta = data["choices"][0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield content
                    except Exception:
                        continue
