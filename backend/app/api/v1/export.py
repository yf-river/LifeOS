"""导出相关 API"""

import io
import json
import re
from datetime import datetime
from typing import List, Optional

import markdown2
from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from weasyprint import HTML

from app.core import get_db, get_current_user, success, not_found, forbidden, invalid_params
from app.models import User, Note, Tag, NoteTag

router = APIRouter(prefix="/export", tags=["导出"])


def json_content_to_markdown(json_content: str) -> str:
    """将 Tiptap JSON 转换为 Markdown"""
    try:
        doc = json.loads(json_content) if isinstance(json_content, str) else json_content
    except json.JSONDecodeError:
        return ""
    
    if not doc or not isinstance(doc, dict):
        return ""
    
    content = doc.get("content", [])
    return _nodes_to_markdown(content)


def _nodes_to_markdown(nodes: list, depth: int = 0) -> str:
    """递归转换节点为 Markdown"""
    result = []
    
    for node in nodes:
        node_type = node.get("type", "")
        
        if node_type == "paragraph":
            text = _inline_to_markdown(node.get("content", []))
            result.append(text + "\n")
            
        elif node_type == "heading":
            level = node.get("attrs", {}).get("level", 1)
            text = _inline_to_markdown(node.get("content", []))
            result.append("#" * level + " " + text + "\n")
            
        elif node_type == "bulletList":
            items = node.get("content", [])
            for item in items:
                item_text = _nodes_to_markdown(item.get("content", []), depth + 1)
                result.append("  " * depth + "- " + item_text.strip() + "\n")
                
        elif node_type == "orderedList":
            items = node.get("content", [])
            for i, item in enumerate(items, 1):
                item_text = _nodes_to_markdown(item.get("content", []), depth + 1)
                result.append("  " * depth + f"{i}. " + item_text.strip() + "\n")
                
        elif node_type == "listItem":
            text = _nodes_to_markdown(node.get("content", []), depth)
            result.append(text)
            
        elif node_type == "blockquote":
            text = _nodes_to_markdown(node.get("content", []))
            lines = text.strip().split("\n")
            for line in lines:
                result.append("> " + line + "\n")
                
        elif node_type == "codeBlock":
            language = node.get("attrs", {}).get("language", "")
            text = _inline_to_markdown(node.get("content", []))
            result.append(f"```{language}\n{text}\n```\n")
            
        elif node_type == "image":
            attrs = node.get("attrs", {})
            src = attrs.get("src", "")
            alt = attrs.get("alt", "")
            result.append(f"![{alt}]({src})\n")
            
        elif node_type == "horizontalRule":
            result.append("---\n")
            
        elif node_type == "hardBreak":
            result.append("  \n")
            
    return "".join(result)


def _inline_to_markdown(nodes: list) -> str:
    """转换行内元素为 Markdown"""
    result = []
    
    for node in nodes:
        node_type = node.get("type", "")
        
        if node_type == "text":
            text = node.get("text", "")
            marks = node.get("marks", [])
            
            for mark in marks:
                mark_type = mark.get("type", "")
                if mark_type == "bold":
                    text = f"**{text}**"
                elif mark_type == "italic":
                    text = f"*{text}*"
                elif mark_type == "code":
                    text = f"`{text}`"
                elif mark_type == "strike":
                    text = f"~~{text}~~"
                elif mark_type == "link":
                    href = mark.get("attrs", {}).get("href", "")
                    text = f"[{text}]({href})"
                elif mark_type == "highlight":
                    text = f"=={text}=="
                    
            result.append(text)
            
        elif node_type == "hardBreak":
            result.append("  \n")
            
    return "".join(result)


def format_note_markdown(note: Note, include_metadata: bool = True) -> str:
    """格式化单个笔记为 Markdown"""
    parts = []
    
    # 标题
    if note.title:
        parts.append(f"# {note.title}\n\n")
    
    # 元数据
    if include_metadata:
        meta = []
        meta.append(f"- 创建时间: {note.created_at.strftime('%Y-%m-%d %H:%M:%S') if note.created_at else '未知'}")
        meta.append(f"- 更新时间: {note.updated_at.strftime('%Y-%m-%d %H:%M:%S') if note.updated_at else '未知'}")
        
        # 标签
        if note.tags:
            tag_names = [tag.name for tag in note.tags]
            meta.append(f"- 标签: {', '.join(tag_names)}")
            
        # 置顶
        if note.is_pinned:
            meta.append("- 状态: 已置顶")
            
        parts.append("\n".join(meta) + "\n\n---\n\n")
    
    # 内容
    if note.json_content:
        content = json_content_to_markdown(note.json_content)
        parts.append(content)
    elif note.content:
        parts.append(note.content)
    
    return "".join(parts)


def markdown_to_pdf_bytes(markdown_text: str, title: str = "笔记导出") -> bytes:
    """将 Markdown 转为 PDF 二进制"""
    html_body = markdown2.markdown(markdown_text)
    html = f"""
    <html>
      <head>
        <meta charset='utf-8'/>
        <title>{title}</title>
        <style>
          body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 24px; }}
          h1,h2,h3,h4,h5,h6 {{ margin-top: 16px; margin-bottom: 8px; }}
          pre {{ background: #f5f5f5; padding: 12px; border-radius: 8px; overflow-x: auto; }}
          code {{ background: #f5f5f5; padding: 2px 4px; border-radius: 4px; }}
          blockquote {{ border-left: 4px solid #e5e7eb; padding-left: 12px; color: #6b7280; margin: 12px 0; }}
          img {{ max-width: 100%; }}
          hr {{ border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }}
        </style>
      </head>
      <body>
        {html_body}
      </body>
    </html>
    """
    pdf = HTML(string=html).write_pdf()
    return pdf


@router.get("/note/{note_id}/markdown")
async def export_note_markdown(
    note_id: str,
    include_metadata: bool = Query(True, description="是否包含元数据"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """导出单个笔记为 Markdown"""
    result = await db.execute(
        select(Note)
        .options(selectinload(Note.tags))
        .where(Note.id == note_id)
    )
    note = result.scalar_one_or_none()
    
    if not note:
        return not_found("笔记不存在")
    
    if note.user_id != current_user.id:
        return forbidden("无权限访问")
    
    markdown = format_note_markdown(note, include_metadata)
    
    # 生成文件名
    filename = note.title or note.id
    # 移除不安全字符
    filename = re.sub(r'[<>:"/\\|?*]', '', filename)[:50]
    
    return Response(
        content=markdown.encode('utf-8'),
        media_type="text/markdown; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}.md"'
        }
    )


@router.get("/notes/markdown")
async def export_notes_markdown(
    note_ids: str = Query(None, description="笔记 ID，逗号分隔"),
    tag_id: str = Query(None, description="按标签导出"),
    include_metadata: bool = Query(True, description="是否包含元数据"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """批量导出笔记为 Markdown（打包为单个文件）"""
    query = select(Note).options(selectinload(Note.tags)).where(Note.user_id == current_user.id)
    
    if note_ids:
        ids = [id.strip() for id in note_ids.split(",") if id.strip()]
        if not ids:
            return invalid_params("请提供笔记 ID")
        query = query.where(Note.id.in_(ids))
    elif tag_id:
        query = query.join(NoteTag, Note.id == NoteTag.note_id).where(NoteTag.tag_id == tag_id)
    else:
        # 默认导出所有笔记
        pass
    
    query = query.order_by(Note.created_at.desc())
    result = await db.execute(query)
    notes = result.scalars().unique().all()
    
    if not notes:
        return not_found("没有可导出的笔记")
    
    # 生成合并的 Markdown
    parts = []
    parts.append(f"# 笔记导出\n\n")
    parts.append(f"导出时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    parts.append(f"共 {len(notes)} 篇笔记\n\n")
    parts.append("---\n\n")
    
    for note in notes:
        parts.append(format_note_markdown(note, include_metadata))
        parts.append("\n\n---\n\n")
    
    content = "".join(parts)
    
    filename = f"notes_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    return Response(
        content=content.encode('utf-8'),
        media_type="text/markdown; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}.md"'
        }
    )


@router.get("/note/{note_id}/pdf")
async def export_note_pdf(
    note_id: str,
    include_metadata: bool = Query(True, description="是否包含元数据"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """导出单个笔记为 PDF"""
    result = await db.execute(
        select(Note)
        .options(selectinload(Note.tags))
        .where(Note.id == note_id)
    )
    note = result.scalar_one_or_none()

    if not note:
        return not_found("笔记不存在")

    if note.user_id != current_user.id:
        return forbidden("无权限访问")

    markdown = format_note_markdown(note, include_metadata)
    pdf_bytes = markdown_to_pdf_bytes(markdown, title=note.title or "笔记导出")

    filename = re.sub(r'[<>:"/\\|?*]', '', note.title or note.id)[:50]

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}.pdf"'}
    )


@router.get("/notes/pdf")
async def export_notes_pdf(
    note_ids: str = Query(None, description="笔记 ID，逗号分隔"),
    tag_id: str = Query(None, description="按标签导出"),
    include_metadata: bool = Query(True, description="是否包含元数据"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """批量导出笔记为 PDF（合并成单个 PDF）"""
    query = select(Note).options(selectinload(Note.tags)).where(Note.user_id == current_user.id)

    if note_ids:
        ids = [id.strip() for id in note_ids.split(",") if id.strip()]
        if not ids:
            return invalid_params("请提供笔记 ID")
        query = query.where(Note.id.in_(ids))
    elif tag_id:
        query = query.join(NoteTag, Note.id == NoteTag.note_id).where(NoteTag.tag_id == tag_id)

    query = query.order_by(Note.created_at.desc())
    result = await db.execute(query)
    notes = result.scalars().unique().all()

    if not notes:
        return not_found("没有可导出的笔记")

    parts = ["# 笔记导出 (PDF)\n\n"]
    parts.append(f"导出时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    parts.append(f"共 {len(notes)} 篇笔记\n\n")
    parts.append("---\n\n")

    for note in notes:
        parts.append(format_note_markdown(note, include_metadata))
        parts.append("\n\n---\n\n")

    merged_markdown = "".join(parts)
    pdf_bytes = markdown_to_pdf_bytes(merged_markdown, title="笔记导出")
    filename = f"notes_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}.pdf"'}
    )


@router.get("/note/{note_id}/json")
async def export_note_json(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """导出单个笔记为 JSON"""
    result = await db.execute(
        select(Note)
        .options(selectinload(Note.tags))
        .where(Note.id == note_id)
    )
    note = result.scalar_one_or_none()
    
    if not note:
        return not_found("笔记不存在")
    
    if note.user_id != current_user.id:
        return forbidden("无权限访问")
    
    data = note.to_dict(include_tags=True)
    content = json.dumps(data, ensure_ascii=False, indent=2)
    
    filename = note.title or note.id
    filename = re.sub(r'[<>:"/\\|?*]', '', filename)[:50]
    
    return Response(
        content=content.encode('utf-8'),
        media_type="application/json; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}.json"'
        }
    )


@router.get("/notes/json")
async def export_notes_json(
    note_ids: str = Query(None, description="笔记 ID，逗号分隔"),
    tag_id: str = Query(None, description="按标签导出"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """批量导出笔记为 JSON"""
    query = select(Note).options(selectinload(Note.tags)).where(Note.user_id == current_user.id)
    
    if note_ids:
        ids = [id.strip() for id in note_ids.split(",") if id.strip()]
        if not ids:
            return invalid_params("请提供笔记 ID")
        query = query.where(Note.id.in_(ids))
    elif tag_id:
        query = query.join(NoteTag, Note.id == NoteTag.note_id).where(NoteTag.tag_id == tag_id)
    
    query = query.order_by(Note.created_at.desc())
    result = await db.execute(query)
    notes = result.scalars().unique().all()
    
    if not notes:
        return not_found("没有可导出的笔记")
    
    data = {
        "export_time": datetime.now().isoformat(),
        "count": len(notes),
        "notes": [note.to_dict(include_tags=True) for note in notes]
    }
    
    content = json.dumps(data, ensure_ascii=False, indent=2)
    filename = f"notes_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    return Response(
        content=content.encode('utf-8'),
        media_type="application/json; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}.json"'
        }
    )
