"""笔记版本历史模型"""

import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.core import Base


class NoteVersion(Base):
    """笔记版本历史
    
    每次笔记更新时自动保存历史版本
    """
    __tablename__ = "note_versions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    note_id = Column(String(36), ForeignKey("notes.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, nullable=False)  # 版本号
    
    # 快照内容
    title = Column(String(500), nullable=True)
    content = Column(Text, nullable=True)
    json_content = Column(Text, nullable=True)
    
    # 变更信息
    change_type = Column(String(50), default="update")  # create, update, restore
    change_summary = Column(String(500), nullable=True)  # 变更摘要
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    note = relationship("Note", back_populates="versions")
    
    def to_dict(self):
        return {
            "id": self.id,
            "note_id": self.note_id,
            "version": self.version,
            "title": self.title,
            "content": self.content[:200] + "..." if self.content and len(self.content) > 200 else self.content,
            "json_content": None,  # 不返回完整 JSON，节省带宽
            "change_type": self.change_type,
            "change_summary": self.change_summary,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
    
    def to_dict_full(self):
        """包含完整内容的字典"""
        return {
            "id": self.id,
            "note_id": self.note_id,
            "version": self.version,
            "title": self.title,
            "content": self.content,
            "json_content": self.json_content,
            "change_type": self.change_type,
            "change_summary": self.change_summary,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
