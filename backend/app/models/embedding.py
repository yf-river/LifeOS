"""向量嵌入模型"""

import uuid
from datetime import datetime
from typing import Optional, List

from pgvector.sqlalchemy import Vector
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.config import settings


class NoteEmbedding(Base):
    """笔记向量嵌入表"""

    __tablename__ = "note_embeddings"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    note_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("notes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    chunk_index: Mapped[int] = mapped_column(Integer, default=0)  # 文档分块索引
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)  # 原始文本块
    embedding: Mapped[Optional[List[float]]] = mapped_column(
        Vector(settings.OPENAI_EMBEDDING_DIMENSIONS), nullable=True
    )  # 向量嵌入
    model_name: Mapped[str] = mapped_column(
        String(100), default=settings.OPENAI_EMBEDDING_MODEL
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # 关系 - 关联到笔记
    note: Mapped["Note"] = relationship("Note", backref="embeddings", lazy="selectin")

    def to_dict(self, include_embedding: bool = False) -> dict:
        """转换为字典"""
        data = {
            "id": self.id,
            "note_id": self.note_id,
            "chunk_index": self.chunk_index,
            "chunk_text": self.chunk_text,
            "model_name": self.model_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_embedding and self.embedding is not None:
            data["embedding"] = list(self.embedding)
        return data


# 需要在 Note 模型被定义后导入
from app.models.note import Note
