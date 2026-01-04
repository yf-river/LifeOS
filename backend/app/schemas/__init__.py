"""Pydantic Schemas"""

from app.schemas.user import UserLogin, UserRegister, UserUpdate, UserResponse
from app.schemas.note import NoteCreate, NoteUpdate, TagCreate, TagUpdate, AddNoteTags, NoteListParams
from app.schemas.ai import (
    OCRRequest, ASRRequest, SummaryRequest, LinkPreviewRequest,
    SemanticSearchRequest, SemanticSearchResult, ChatMessage,
    RAGChatRequest, EmbedNoteRequest, EmbedAllNotesRequest,
)

__all__ = [
    "UserLogin",
    "UserRegister",
    "UserUpdate",
    "UserResponse",
    "NoteCreate",
    "NoteUpdate",
    "TagCreate",
    "TagUpdate",
    "AddNoteTags",
    "NoteListParams",
    "OCRRequest",
    "ASRRequest",
    "SummaryRequest",
    "LinkPreviewRequest",
    "SemanticSearchRequest",
    "SemanticSearchResult",
    "ChatMessage",
    "RAGChatRequest",
    "EmbedNoteRequest",
    "EmbedAllNotesRequest",
]
