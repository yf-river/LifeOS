"""向量嵌入服务 - 使用 OpenAI Embedding API"""

import re
from typing import List, Optional, Tuple

import httpx
import tiktoken

from app.core.config import settings


def count_tokens(text: str, model: str = "text-embedding-3-small") -> int:
    """计算文本 token 数量"""
    try:
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        encoding = tiktoken.get_encoding("cl100k_base")
    return len(encoding.encode(text))


def chunk_text(
    text: str,
    chunk_size: int = None,
    chunk_overlap: int = None,
) -> List[str]:
    """将文本分块
    
    使用基于句子边界的分块策略，避免在句子中间切断
    
    Args:
        text: 要分块的文本
        chunk_size: 每块的最大字符数（默认从配置读取）
        chunk_overlap: 块之间的重叠字符数（默认从配置读取）
    
    Returns:
        分块后的文本列表
    """
    if not text or not text.strip():
        return []
    
    chunk_size = chunk_size or settings.RAG_CHUNK_SIZE
    chunk_overlap = chunk_overlap or settings.RAG_CHUNK_OVERLAP
    
    # 清理文本
    text = text.strip()
    
    # 按句子边界分割（中英文标点）
    sentence_endings = re.compile(r'(?<=[。！？.!?\n])')
    sentences = sentence_endings.split(text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    if not sentences:
        return [text] if len(text) <= chunk_size else [text[:chunk_size]]
    
    chunks = []
    current_chunk = []
    current_length = 0
    
    for sentence in sentences:
        sentence_length = len(sentence)
        
        # 如果单个句子超过 chunk_size，强制切分
        if sentence_length > chunk_size:
            if current_chunk:
                chunks.append("".join(current_chunk))
                current_chunk = []
                current_length = 0
            
            # 切分长句子
            for i in range(0, sentence_length, chunk_size - chunk_overlap):
                chunks.append(sentence[i:i + chunk_size])
            continue
        
        # 如果加入当前句子会超过 chunk_size
        if current_length + sentence_length > chunk_size:
            if current_chunk:
                chunks.append("".join(current_chunk))
                # 保留 overlap 部分
                overlap_text = "".join(current_chunk)[-chunk_overlap:] if chunk_overlap > 0 else ""
                current_chunk = [overlap_text] if overlap_text else []
                current_length = len(overlap_text)
        
        current_chunk.append(sentence)
        current_length += sentence_length
    
    # 添加最后一个块
    if current_chunk:
        chunks.append("".join(current_chunk))
    
    return chunks


async def get_embedding(text: str) -> Optional[List[float]]:
    """获取单个文本的向量嵌入
    
    Args:
        text: 要嵌入的文本
    
    Returns:
        向量列表，失败返回 None
    """
    if not text or not text.strip():
        return None
    
    if not settings.OPENAI_API_KEY:
        # 开发环境模拟 - 返回随机向量
        import random
        return [random.uniform(-1, 1) for _ in range(settings.OPENAI_EMBEDDING_DIMENSIONS)]
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.OPENAI_BASE_URL}/embeddings",
                headers={
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.OPENAI_EMBEDDING_MODEL,
                    "input": text,
                    "dimensions": settings.OPENAI_EMBEDDING_DIMENSIONS,
                },
            )
            response.raise_for_status()
            data = response.json()
        
        if data.get("data") and len(data["data"]) > 0:
            return data["data"][0]["embedding"]
        
        return None
    
    except Exception as e:
        print(f"[Embedding Error] {str(e)}")
        return None


async def get_embeddings_batch(texts: List[str]) -> List[Optional[List[float]]]:
    """批量获取向量嵌入
    
    Args:
        texts: 文本列表
    
    Returns:
        向量列表的列表
    """
    if not texts:
        return []
    
    # 过滤空文本
    valid_texts = [(i, t) for i, t in enumerate(texts) if t and t.strip()]
    if not valid_texts:
        return [None] * len(texts)
    
    if not settings.OPENAI_API_KEY:
        # 开发环境模拟
        import random
        results = [None] * len(texts)
        for i, _ in valid_texts:
            results[i] = [random.uniform(-1, 1) for _ in range(settings.OPENAI_EMBEDDING_DIMENSIONS)]
        return results
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.OPENAI_BASE_URL}/embeddings",
                headers={
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.OPENAI_EMBEDDING_MODEL,
                    "input": [t for _, t in valid_texts],
                    "dimensions": settings.OPENAI_EMBEDDING_DIMENSIONS,
                },
            )
            response.raise_for_status()
            data = response.json()
        
        # 构建结果
        results = [None] * len(texts)
        if data.get("data"):
            for j, (i, _) in enumerate(valid_texts):
                if j < len(data["data"]):
                    results[i] = data["data"][j]["embedding"]
        
        return results
    
    except Exception as e:
        print(f"[Batch Embedding Error] {str(e)}")
        return [None] * len(texts)


def extract_plain_text(json_content: dict) -> str:
    """从 Tiptap JSON 内容提取纯文本
    
    Args:
        json_content: Tiptap 编辑器的 JSON 内容
    
    Returns:
        纯文本内容
    """
    if not json_content:
        return ""
    
    texts = []
    
    def extract_from_node(node: dict):
        if not isinstance(node, dict):
            return
        
        # 提取文本节点
        if node.get("type") == "text":
            text = node.get("text", "")
            if text:
                texts.append(text)
        
        # 递归处理子节点
        content = node.get("content", [])
        if isinstance(content, list):
            for child in content:
                extract_from_node(child)
    
    extract_from_node(json_content)
    return " ".join(texts)
