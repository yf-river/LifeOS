"""版本历史相关 API"""

import difflib

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_db, get_current_user, success, success_with_pagination, not_found, forbidden, invalid_params
from app.models import User, Note, NoteVersion

router = APIRouter(prefix="/notes", tags=["版本历史"])


@router.get("/{note_id}/versions")
async def list_note_versions(
    note_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取笔记的版本历史列表"""
    # 验证笔记权限
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()
    
    if not note:
        return not_found("笔记不存在")
    if note.user_id != current_user.id:
        return forbidden("无权限访问")
    
    # 查询版本列表
    query = select(NoteVersion).where(NoteVersion.note_id == note_id)
    
    # 总数
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # 分页
    query = query.order_by(NoteVersion.version.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    versions = result.scalars().all()
    
    return success_with_pagination(
        data=[v.to_dict() for v in versions],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{note_id}/versions/{version_id}")
async def get_note_version(
    note_id: str,
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取某个版本的详细内容"""
    # 验证笔记权限
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()
    
    if not note:
        return not_found("笔记不存在")
    if note.user_id != current_user.id:
        return forbidden("无权限访问")
    
    # 获取版本
    result = await db.execute(
        select(NoteVersion).where(
            NoteVersion.id == version_id,
            NoteVersion.note_id == note_id
        )
    )
    version = result.scalar_one_or_none()
    
    if not version:
        return not_found("版本不存在")
    
    return success(version.to_dict_full())


@router.post("/{note_id}/versions/{version_id}/restore")
async def restore_note_version(
    note_id: str,
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """恢复到某个历史版本"""
    # 验证笔记权限
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()
    
    if not note:
        return not_found("笔记不存在")
    if note.user_id != current_user.id:
        return forbidden("无权限访问")
    
    # 获取目标版本
    result = await db.execute(
        select(NoteVersion).where(
            NoteVersion.id == version_id,
            NoteVersion.note_id == note_id
        )
    )
    target_version = result.scalar_one_or_none()
    
    if not target_version:
        return not_found("版本不存在")
    
    # 先保存当前版本到历史
    current_snapshot = NoteVersion(
        note_id=note.id,
        version=note.version,
        title=note.title,
        content=note.content,
        json_content=note.json_content,
        change_type="update",
        change_summary="恢复前的版本",
    )
    db.add(current_snapshot)
    
    # 恢复笔记内容
    note.title = target_version.title
    note.content = target_version.content
    note.json_content = target_version.json_content
    # version 会自动递增（通过触发器）
    
    await db.commit()
    await db.refresh(note)
    
    # 保存恢复操作记录
    restore_record = NoteVersion(
        note_id=note.id,
        version=note.version,
        title=note.title,
        content=note.content,
        json_content=note.json_content,
        change_type="restore",
        change_summary=f"从版本 {target_version.version} 恢复",
    )
    db.add(restore_record)
    await db.commit()
    
    return success({
        "message": f"已恢复到版本 {target_version.version}",
        "note": note.to_dict(),
    })


@router.get("/{note_id}/versions/compare")
async def compare_versions(
    note_id: str,
    version1_id: str = Query(..., description="版本1 ID"),
    version2_id: str = Query(..., description="版本2 ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """比较两个版本的差异"""
    # 验证笔记权限
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()
    
    if not note:
        return not_found("笔记不存在")
    if note.user_id != current_user.id:
        return forbidden("无权限访问")
    
    # 获取版本1
    result = await db.execute(
        select(NoteVersion).where(
            NoteVersion.id == version1_id,
            NoteVersion.note_id == note_id
        )
    )
    v1 = result.scalar_one_or_none()
    
    # 获取版本2
    result = await db.execute(
        select(NoteVersion).where(
            NoteVersion.id == version2_id,
            NoteVersion.note_id == note_id
        )
    )
    v2 = result.scalar_one_or_none()
    
    if not v1 or not v2:
        return not_found("版本不存在")
    
    content1 = v1.content or ""
    content2 = v2.content or ""
    diff_lines = list(
        difflib.unified_diff(
            content1.splitlines(),
            content2.splitlines(),
            fromfile=f"v{v1.version}",
            tofile=f"v{v2.version}",
            lineterm="",
        )
    )

    differences = {
        "title_changed": v1.title != v2.title,
        "content_changed": v1.content != v2.content,
        "version1": v1.to_dict_full(),
        "version2": v2.to_dict_full(),
        "diff": diff_lines,
    }
    
    return success(differences)


@router.get("/{note_id}/versions/{version_id}/diff")
async def diff_with_current(
    note_id: str,
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """对比某个历史版本与当前版本的差异"""
    # 验证笔记
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()

    if not note:
        return not_found("笔记不存在")
    if note.user_id != current_user.id:
        return forbidden("无权限访问")

    # 获取目标版本
    result = await db.execute(
        select(NoteVersion).where(
            NoteVersion.id == version_id,
            NoteVersion.note_id == note_id
        )
    )
    target = result.scalar_one_or_none()

    if not target:
        return not_found("版本不存在")

    content_old = target.content or ""
    content_new = note.content or ""

    diff_lines = list(
        difflib.unified_diff(
            content_old.splitlines(),
            content_new.splitlines(),
            fromfile=f"v{target.version}",
            tofile=f"current(v{note.version})",
            lineterm="",
        )
    )

    return success({
        "version": target.to_dict_full(),
        "current_version": note.version,
        "diff": diff_lines,
    })
