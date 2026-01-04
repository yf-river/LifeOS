"""笔记相关 API"""

from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core import (
    get_db,
    get_current_user,
    success,
    success_with_pagination,
    invalid_params,
    not_found,
    forbidden,
    version_conflict,
    server_error,
)
from app.models import User, Note, Tag, NoteTag, NoteVersion
from app.schemas import NoteCreate, NoteUpdate

router = APIRouter(prefix="/notes", tags=["笔记"])


@router.get("")
async def list_notes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    tag_id: str = Query(None),
    is_pinned: str = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取笔记列表"""
    # 构建查询（排除已删除的笔记）
    query = select(Note).where(
        Note.user_id == current_user.id,
        Note.deleted_at.is_(None)
    )

    # 标签过滤
    if tag_id:
        query = query.join(NoteTag, Note.id == NoteTag.note_id).where(NoteTag.tag_id == tag_id)

    # 置顶过滤
    if is_pinned == "true":
        query = query.where(Note.is_pinned == True)

    # 总数
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # 分页
    offset = (page - 1) * page_size
    query = (
        query.options(selectinload(Note.tags))
        .order_by(Note.is_pinned.desc(), Note.updated_at.desc())
        .offset(offset)
        .limit(page_size)
    )

    result = await db.execute(query)
    notes = result.scalars().unique().all()

    return success_with_pagination(
        [note.to_dict() for note in notes],
        total,
        page,
        page_size,
    )


@router.post("")
async def create_note(
    data: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """创建笔记"""
    note = Note(
        user_id=current_user.id,
        title=data.title,
        content=data.content,
        json_content=data.json_content,
        is_pinned=data.is_pinned,
    )
    db.add(note)
    await db.flush()
    
    # 保存初始版本
    initial_version = NoteVersion(
        note_id=note.id,
        version=1,
        title=data.title,
        content=data.content,
        json_content=data.json_content,
        change_type="create",
        change_summary="创建笔记",
    )
    db.add(initial_version)

    # 添加标签
    if data.tag_ids:
        for tag_id in data.tag_ids:
            # 验证标签属于当前用户
            tag_result = await db.execute(
                select(Tag).where(Tag.id == tag_id, Tag.user_id == current_user.id)
            )
            if tag_result.scalar_one_or_none():
                note_tag = NoteTag(note_id=note.id, tag_id=tag_id)
                db.add(note_tag)

    await db.commit()
    await db.refresh(note)

    return success({
        "id": note.id,
        "version": note.version,
        "created_at": note.created_at.isoformat(),
    })


@router.get("/search")
async def search_notes(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """搜索笔记"""
    search_pattern = f"%{q}%"
    query = select(Note).where(
        Note.user_id == current_user.id,
        Note.deleted_at.is_(None),
        or_(
            Note.title.ilike(search_pattern),
            Note.content.ilike(search_pattern),
        ),
    )

    # 总数
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # 分页
    offset = (page - 1) * page_size
    query = query.order_by(Note.updated_at.desc()).offset(offset).limit(page_size)

    result = await db.execute(query)
    notes = result.scalars().all()

    return success_with_pagination(
        [note.to_dict(include_tags=False) for note in notes],
        total,
        page,
        page_size,
    )


@router.get("/{note_id}")
async def get_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取单个笔记"""
    result = await db.execute(
        select(Note)
        .options(selectinload(Note.tags), selectinload(Note.attachments))
        .where(Note.id == note_id)
    )
    note = result.scalar_one_or_none()

    if not note:
        return not_found("笔记不存在")

    if note.user_id != current_user.id:
        return forbidden("无权限访问")

    return success(note.to_dict(include_tags=True, include_attachments=True))


@router.put("/{note_id}")
async def update_note(
    note_id: str,
    data: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """更新笔记"""
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()

    if not note:
        return not_found("笔记不存在")

    if note.user_id != current_user.id:
        return forbidden("无权限修改")

    # 乐观锁检查
    if note.version != data.version:
        # 返回最新数据
        await db.refresh(note)
        return version_conflict(note.to_dict(), "版本冲突，请刷新后重试")

    # 检查内容是否有变化，有变化才保存版本
    content_changed = (
        (data.title is not None and data.title != note.title) or
        (data.content is not None and data.content != note.content) or
        (data.json_content is not None and data.json_content != str(note.json_content))
    )
    
    # 保存当前版本到历史（在修改之前）
    if content_changed:
        version_snapshot = NoteVersion(
            note_id=note.id,
            version=note.version,
            title=note.title,
            content=note.content,
            json_content=str(note.json_content) if note.json_content else None,
            change_type="update",
        )
        db.add(version_snapshot)

    # 更新字段
    if data.title is not None:
        note.title = data.title
    if data.content is not None:
        note.content = data.content
    if data.json_content is not None:
        note.json_content = data.json_content
    if data.is_pinned is not None:
        note.is_pinned = data.is_pinned

    # 递增版本号
    note.version += 1

    try:
        await db.commit()
        await db.refresh(note)
        return success({
            "id": note.id,
            "version": note.version,
            "updated_at": note.updated_at.isoformat(),
        })
    except Exception as e:
        await db.rollback()
        return server_error(f"更新失败: {str(e)}")


@router.delete("/{note_id}")
async def delete_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """删除笔记（软删除，移入回收站）"""
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()

    if not note:
        return not_found("笔记不存在")

    if note.user_id != current_user.id:
        return forbidden("无权限删除")

    # 软删除：设置 deleted_at
    note.deleted_at = datetime.utcnow()
    await db.commit()

    return success({"message": "笔记已移入回收站", "id": note_id})
