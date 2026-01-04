"""AI 相关 Schema"""

from typing import Optional, List

from pydantic import BaseModel, HttpUrl


class OCRRequest(BaseModel):
    """OCR 请求"""

    image_url: Optional[str] = None
    image_base64: Optional[str] = None


class ASRRequest(BaseModel):
    """ASR 请求"""

    audio_url: Optional[str] = None
    attachment_id: Optional[str] = None


class SummaryRequest(BaseModel):
    """摘要请求"""

    content: str
    max_length: int = 200


class LinkPreviewRequest(BaseModel):
    """链接预览请求"""

    url: str


class SemanticSearchRequest(BaseModel):
    """语义搜索请求"""
    
    query: str
    top_k: int = 5


class SemanticSearchResult(BaseModel):
    """语义搜索结果"""
    
    note_id: str
    chunk_text: str
    score: float
    note_title: Optional[str] = None
    note_preview: Optional[str] = None


class ChatMessage(BaseModel):
    """聊天消息"""
    
    role: str  # user, assistant, system
    content: str


class RAGChatRequest(BaseModel):
    """RAG 聊天请求"""
    
    query: str
    history: List[ChatMessage] = []
    use_rag: bool = True
    top_k: int = 3


class EmbedNoteRequest(BaseModel):
    """嵌入笔记请求"""
    
    note_id: str
    force: bool = False  # 是否强制重新嵌入


class EmbedAllNotesRequest(BaseModel):
    """批量嵌入请求"""
    
    force: bool = False
