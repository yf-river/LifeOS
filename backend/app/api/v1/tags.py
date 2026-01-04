"""标签相关 API"""

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core import (
    get_db,
    get_current_user,
    success,
    invalid_params,
    not_found,
    forbidden,
    server_error,
)
from app.models import User, Note, Tag, NoteTag
from app.schemas import TagCreate, TagUpdate, AddNoteTags

router = APIRouter(prefix="/tags", tags=["标签"])


@router.get("")
async def list_tags(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取标签列表"""
    result = await db.execute(
        select(Tag)
        .options(selectinload(Tag.notes))
        .where(Tag.user_id == current_user.id)
        .order_by(Tag.created_at.desc())
    )
    tags = result.scalars().unique().all()

    return success([tag.to_dict(include_note_count=True) for tag in tags])


@router.post("")
async def create_tag(
    data: TagCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """创建标签"""
    # 检查标签名是否已存在
    result = await db.execute(
        select(Tag).where(Tag.user_id == current_user.id, Tag.name == data.name)
    )
    existing = result.scalar_one_or_none()

    if existing:
        return invalid_params("标签名已存在")

    tag = Tag(
        user_id=current_user.id,
        name=data.name,
        color=data.color or "#666666",
    )
    db.add(tag)
    await db.commit()
    await db.refresh(tag)

    return success(tag.to_dict())


@router.put("/{tag_id}")
async def update_tag(
    tag_id: str,
    data: TagUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """更新标签"""
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = result.scalar_one_or_none()

    if not tag:
        return not_found("标签不存在")

    if tag.user_id != current_user.id:
        return forbidden("无权限修改")

    # 检查新名称是否重复
    if data.name and data.name != tag.name:
        existing_result = await db.execute(
            select(Tag).where(
                Tag.user_id == current_user.id,
                Tag.name == data.name,
                Tag.id != tag_id,
            )
        )
        if existing_result.scalar_one_or_none():
            return invalid_params("标签名已存在")
        tag.name = data.name

    if data.color is not None:
        tag.color = data.color

    try:
        await db.commit()
        await db.refresh(tag)
        return success(tag.to_dict())
    except Exception as e:
        await db.rollback()
        return server_error(f"更新失败: {str(e)}")


@router.delete("/{tag_id}")
async def delete_tag(
    tag_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """删除标签"""
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = result.scalar_one_or_none()

    if not tag:
        return not_found("标签不存在")

    if tag.user_id != current_user.id:
        return forbidden("无权限删除")

    # 删除关联
    await db.execute(
        select(NoteTag).where(NoteTag.tag_id == tag_id)
    )

    # 删除标签
    await db.delete(tag)
    await db.commit()

    return success(None)


@router.post("/{tag_id}/merge/{target_tag_id}")
async def merge_tags(
    tag_id: str,
    target_tag_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """合并标签 - 将 tag_id 合并到 target_tag_id
    
    将所有使用 tag_id 的笔记改为使用 target_tag_id，然后删除 tag_id
    """
    # 验证源标签
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    source_tag = result.scalar_one_or_none()
    if not source_tag:
        return not_found("源标签不存在")
    if source_tag.user_id != current_user.id:
        return forbidden("无权限操作")

    # 验证目标标签
    result = await db.execute(select(Tag).where(Tag.id == target_tag_id))
    target_tag = result.scalar_one_or_none()
    if not target_tag:
        return not_found("目标标签不存在")
    if target_tag.user_id != current_user.id:
        return forbidden("无权限操作")

    if tag_id == target_tag_id:
        return invalid_params("不能合并到自身")

    try:
        # 获取源标签的所有笔记关联
        result = await db.execute(
            select(NoteTag).where(NoteTag.tag_id == tag_id)
        )
        source_note_tags = result.scalars().all()

        for note_tag in source_note_tags:
            # 检查目标标签是否已关联该笔记
            existing = await db.execute(
                select(NoteTag).where(
                    NoteTag.note_id == note_tag.note_id,
                    NoteTag.tag_id == target_tag_id
                )
            )
            if not existing.scalar_one_or_none():
                # 创建新关联
                new_note_tag = NoteTag(note_id=note_tag.note_id, tag_id=target_tag_id)
                db.add(new_note_tag)
            
            # 删除旧关联
            await db.delete(note_tag)

        # 删除源标签
        await db.delete(source_tag)
        await db.commit()

        return success({
            "merged_count": len(source_note_tags),
            "target_tag": target_tag.to_dict(include_note_count=True)
        })

    except Exception as e:
        await db.rollback()
        return server_error(f"合并失败: {str(e)}")


# 笔记标签关联 API
notes_tags_router = APIRouter(tags=["笔记标签"])


@notes_tags_router.post("/notes/{note_id}/tags")
async def add_note_tags(
    note_id: str,
    data: AddNoteTags,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """为笔记添加标签"""
    # 验证笔记
    note_result = await db.execute(select(Note).where(Note.id == note_id))
    note = note_result.scalar_one_or_none()

    if not note:
        return not_found("笔记不存在")

    if note.user_id != current_user.id:
        return forbidden("无权限操作")

    # 添加标签
    for tag_id in data.tag_ids:
        # 验证标签属于当前用户
        tag_result = await db.execute(
            select(Tag).where(Tag.id == tag_id, Tag.user_id == current_user.id)
        )
        if not tag_result.scalar_one_or_none():
            continue

        # 检查是否已存在关联
        existing = await db.execute(
            select(NoteTag).where(NoteTag.note_id == note_id, NoteTag.tag_id == tag_id)
        )
        if existing.scalar_one_or_none():
            continue

        note_tag = NoteTag(note_id=note_id, tag_id=tag_id)
        db.add(note_tag)

    await db.commit()
    return success(None)


@notes_tags_router.delete("/notes/{note_id}/tags/{tag_id}")
async def remove_note_tag(
    note_id: str,
    tag_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """移除笔记标签"""
    # 验证笔记
    note_result = await db.execute(select(Note).where(Note.id == note_id))
    note = note_result.scalar_one_or_none()

    if not note:
        return not_found("笔记不存在")

    if note.user_id != current_user.id:
        return forbidden("无权限操作")

    # 删除关联
    result = await db.execute(
        select(NoteTag).where(NoteTag.note_id == note_id, NoteTag.tag_id == tag_id)
    )
    note_tag = result.scalar_one_or_none()

    if note_tag:
        await db.delete(note_tag)
        await db.commit()

    return success(None)
