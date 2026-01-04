"""笔记相关 Schema"""

from typing import Optional, List, Any

from pydantic import BaseModel, Field


class NoteCreate(BaseModel):
    """创建笔记"""

    title: Optional[str] = None
    content: Optional[str] = None
    json_content: Optional[Any] = None  # Tiptap JSON
    is_pinned: bool = False
    tag_ids: List[str] = []


class NoteUpdate(BaseModel):
    """更新笔记"""

    title: Optional[str] = None
    content: Optional[str] = None
    json_content: Optional[Any] = None
    is_pinned: Optional[bool] = None
    version: int = Field(..., description="乐观锁版本号")


class TagCreate(BaseModel):
    """创建标签"""

    name: str = Field(..., min_length=1, max_length=100)
    color: Optional[str] = "#666666"


class TagUpdate(BaseModel):
    """更新标签"""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = None


class AddNoteTags(BaseModel):
    """添加笔记标签"""

    tag_ids: List[str]


class NoteListParams(BaseModel):
    """笔记列表参数"""

    page: int = 1
    page_size: int = 20
    tag_id: Optional[str] = None
    is_pinned: Optional[bool] = None
