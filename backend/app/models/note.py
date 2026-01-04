"""笔记模型"""

import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import String, Text, Boolean, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.version import NoteVersion


class Note(Base):
    """笔记表"""

    __tablename__ = "notes"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    title: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # 纯文本，用于搜索
    json_content: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # Tiptap JSON
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, index=True)

    # 关系
    tags: Mapped[List["Tag"]] = relationship(
        "Tag", secondary="note_tags", back_populates="notes", lazy="selectin"
    )
    attachments: Mapped[List["Attachment"]] = relationship(
        "Attachment", back_populates="note", lazy="selectin"
    )
    versions: Mapped[List["NoteVersion"]] = relationship(
        "NoteVersion", back_populates="note", lazy="noload", order_by="NoteVersion.version.desc()"
    )

    def to_dict(self, include_tags: bool = True, include_attachments: bool = False) -> dict:
        """转换为字典"""
        data = {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "json_content": self.json_content,
            "is_pinned": self.is_pinned,
            "version": self.version,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "deleted_at": self.deleted_at.isoformat() if self.deleted_at else None,
        }
        if include_tags and self.tags:
            data["tags"] = [tag.to_dict() for tag in self.tags]
        else:
            data["tags"] = []
        if include_attachments and self.attachments:
            data["attachments"] = [att.to_dict() for att in self.attachments]
        return data


class Tag(Base):
    """标签表"""

    __tablename__ = "tags"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str] = mapped_column(String(20), default="#666666")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # 关系
    notes: Mapped[List["Note"]] = relationship(
        "Note", secondary="note_tags", back_populates="tags", lazy="selectin"
    )

    def to_dict(self, include_note_count: bool = False) -> dict:
        """转换为字典"""
        data = {
            "id": self.id,
            "name": self.name,
            "color": self.color,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_note_count:
            data["note_count"] = len(self.notes) if self.notes else 0
        return data


class NoteTag(Base):
    """笔记-标签关联表"""

    __tablename__ = "note_tags"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    note_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("notes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tag_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tags.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Attachment(Base):
    """附件表"""

    __tablename__ = "attachments"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    note_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("notes.id", ondelete="SET NULL"), nullable=True, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # image, audio, video, file
    file_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    mime_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    width: Mapped[int] = mapped_column(Integer, default=0)
    height: Mapped[int] = mapped_column(Integer, default=0)
    duration: Mapped[int] = mapped_column(Integer, default=0)  # 音视频时长（秒）
    ocr_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    asr_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extra_info: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # 原名 metadata，是保留字
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # 关系
    note: Mapped[Optional["Note"]] = relationship("Note", back_populates="attachments")

    def to_dict(self) -> dict:
        """转换为字典"""
        return {
            "id": self.id,
            "type": self.type,
            "file_name": self.file_name,
            "file_size": self.file_size,
            "mime_type": self.mime_type,
            "url": self.url,
            "thumbnail_url": self.thumbnail_url,
            "width": self.width,
            "height": self.height,
            "duration": self.duration,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
