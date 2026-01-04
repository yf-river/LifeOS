"""回收站相关 API"""

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core import get_db, get_current_user, success, success_with_pagination, not_found, forbidden
from app.models import User, Note, NoteTag

router = APIRouter(prefix="/trash", tags=["回收站"])


@router.get("")
async def list_trash(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取回收站笔记列表"""
    query = select(Note).where(
        Note.user_id == current_user.id,
        Note.deleted_at.isnot(None)
    )
    
    # 总数
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # 分页，按删除时间倒序
    query = (
        query.options(selectinload(Note.tags))
        .order_by(Note.deleted_at.desc())
        .offset((page - 1) * page_size)
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


@router.post("/{note_id}/restore")
async def restore_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """恢复笔记（从回收站移出）"""
    result = await db.execute(
        select(Note).where(
            Note.id == note_id,
            Note.deleted_at.isnot(None)
        )
    )
    note = result.scalar_one_or_none()
    
    if not note:
        return not_found("笔记不存在或未被删除")
    
    if note.user_id != current_user.id:
        return forbidden("无权限操作")
    
    note.deleted_at = None
    await db.commit()
    
    return success({"message": "笔记已恢复", "id": note_id})


@router.delete("/{note_id}")
async def permanently_delete_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """永久删除笔记"""
    result = await db.execute(
        select(Note).where(
            Note.id == note_id,
            Note.deleted_at.isnot(None)
        )
    )
    note = result.scalar_one_or_none()
    
    if not note:
        return not_found("笔记不存在或未被删除")
    
    if note.user_id != current_user.id:
        return forbidden("无权限操作")
    
    # 删除关联
    await db.execute(
        select(NoteTag).where(NoteTag.note_id == note_id)
    )
    
    # 永久删除
    await db.delete(note)
    await db.commit()
    
    return success({"message": "笔记已永久删除", "id": note_id})


@router.delete("")
async def empty_trash(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """清空回收站"""
    result = await db.execute(
        select(Note).where(
            Note.user_id == current_user.id,
            Note.deleted_at.isnot(None)
        )
    )
    notes = result.scalars().all()
    
    count = len(notes)
    
    for note in notes:
        await db.delete(note)
    
    await db.commit()
    
    return success({"message": f"已清空回收站，删除 {count} 篇笔记", "count": count})
