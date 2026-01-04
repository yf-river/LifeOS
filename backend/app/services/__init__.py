"""服务模块"""

from app.services.storage import upload_to_cos, delete_from_cos
from app.services.tencent import call_ocr, call_asr
from app.services.deepseek import call_summary, call_chat, call_chat_stream
from app.services.embedding import (
    get_embedding,
    get_embeddings_batch,
    chunk_text,
    extract_plain_text,
    count_tokens,
)

__all__ = [
    "upload_to_cos",
    "delete_from_cos",
    "call_ocr",
    "call_asr",
    "call_summary",
    "call_chat",
    "call_chat_stream",
    "get_embedding",
    "get_embeddings_batch",
    "chunk_text",
    "extract_plain_text",
    "count_tokens",
]
