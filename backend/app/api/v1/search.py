"""向量搜索 API - RAG 语义搜索"""

from typing import List, Optional

from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy import select, text, delete
from sqlalchemy.ext.asyncio import AsyncSession
from pgvector.sqlalchemy import Vector

from app.core import get_db, get_current_user, success, invalid_params, server_error, settings
from app.models import User, Note, NoteEmbedding
from app.schemas import (
    SemanticSearchRequest, SemanticSearchResult,
    EmbedNoteRequest, EmbedAllNotesRequest,
)
from app.services import get_embedding, get_embeddings_batch, chunk_text, extract_plain_text


router = APIRouter(prefix="/search", tags=["搜索"])


@router.post("/semantic")
async def semantic_search(
    data: SemanticSearchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """语义搜索 - 基于向量相似度
    
    使用 cosine 距离进行语义相似度搜索
    """
    if not data.query or not data.query.strip():
        return invalid_params("搜索词不能为空")
    
    try:
        # 获取查询文本的向量
        query_embedding = await get_embedding(data.query)
        if query_embedding is None:
            return server_error("无法生成查询向量")
        
        # 使用 pgvector 进行向量搜索
        # 1 - cosine_distance = cosine_similarity
        query = text("""
            SELECT 
                ne.id,
                ne.note_id,
                ne.chunk_text,
                1 - (ne.embedding <=> :query_embedding::vector) as similarity,
                n.title as note_title,
                LEFT(n.content, 200) as note_preview
            FROM note_embeddings ne
            JOIN notes n ON ne.note_id = n.id
            WHERE n.user_id = :user_id
                AND ne.embedding IS NOT NULL
            ORDER BY ne.embedding <=> :query_embedding::vector
            LIMIT :top_k
        """)
        
        result = await db.execute(
            query,
            {
                "query_embedding": str(query_embedding),
                "user_id": current_user.id,
                "top_k": data.top_k or settings.RAG_TOP_K,
            }
        )
        
        rows = result.fetchall()
        
        results = []
        for row in rows:
            results.append({
                "note_id": row.note_id,
                "chunk_text": row.chunk_text,
                "score": float(row.similarity) if row.similarity else 0,
                "note_title": row.note_title,
                "note_preview": row.note_preview,
            })
        
        return success({
            "query": data.query,
            "results": results,
            "total": len(results),
        })
    
    except Exception as e:
        return server_error(f"语义搜索失败: {str(e)}")


@router.post("/embed-note")
async def embed_note(
    data: EmbedNoteRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """为单个笔记创建向量嵌入"""
    
    # 获取笔记
    result = await db.execute(
        select(Note).where(
            Note.id == data.note_id,
            Note.user_id == current_user.id
        )
    )
    note = result.scalar_one_or_none()
    
    if not note:
        return invalid_params("笔记不存在")
    
    try:
        # 如果强制重新嵌入，先删除旧的
        if data.force:
            await db.execute(
                delete(NoteEmbedding).where(NoteEmbedding.note_id == note.id)
            )
            await db.commit()
        else:
            # 检查是否已有嵌入
            existing = await db.execute(
                select(NoteEmbedding).where(NoteEmbedding.note_id == note.id).limit(1)
            )
            if existing.scalar_one_or_none():
                return success({
                    "message": "笔记已有嵌入，跳过",
                    "note_id": note.id,
                    "status": "skipped"
                })
        
        # 获取文本内容
        text_content = note.content
        if not text_content and note.json_content:
            text_content = extract_plain_text(note.json_content)
        
        if not text_content or not text_content.strip():
            return success({
                "message": "笔记内容为空，跳过嵌入",
                "note_id": note.id,
                "status": "empty"
            })
        
        # 分块
        chunks = chunk_text(text_content)
        if not chunks:
            return success({
                "message": "分块结果为空",
                "note_id": note.id,
                "status": "empty"
            })
        
        # 批量获取嵌入
        embeddings = await get_embeddings_batch(chunks)
        
        # 保存嵌入
        created_count = 0
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            if embedding is not None:
                note_embedding = NoteEmbedding(
                    note_id=note.id,
                    chunk_index=i,
                    chunk_text=chunk,
                    embedding=embedding,
                )
                db.add(note_embedding)
                created_count += 1
        
        await db.commit()
        
        return success({
            "message": "嵌入创建成功",
            "note_id": note.id,
            "chunks_count": len(chunks),
            "embedded_count": created_count,
            "status": "success"
        })
    
    except Exception as e:
        await db.rollback()
        return server_error(f"创建嵌入失败: {str(e)}")


@router.post("/embed-all")
async def embed_all_notes(
    data: EmbedAllNotesRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """为所有笔记创建向量嵌入（异步任务）"""
    
    # 获取用户所有笔记
    result = await db.execute(
        select(Note).where(Note.user_id == current_user.id)
    )
    notes = result.scalars().all()
    
    if not notes:
        return success({
            "message": "没有笔记需要嵌入",
            "total": 0,
        })
    
    # 启动后台任务
    async def embed_notes_task():
        async with db.begin():
            for note in notes:
                try:
                    # 检查是否需要嵌入
                    if not data.force:
                        existing = await db.execute(
                            select(NoteEmbedding).where(NoteEmbedding.note_id == note.id).limit(1)
                        )
                        if existing.scalar_one_or_none():
                            continue
                    else:
                        await db.execute(
                            delete(NoteEmbedding).where(NoteEmbedding.note_id == note.id)
                        )
                    
                    # 获取文本
                    text_content = note.content
                    if not text_content and note.json_content:
                        text_content = extract_plain_text(note.json_content)
                    
                    if not text_content or not text_content.strip():
                        continue
                    
                    # 分块和嵌入
                    chunks = chunk_text(text_content)
                    if not chunks:
                        continue
                    
                    embeddings = await get_embeddings_batch(chunks)
                    
                    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                        if embedding is not None:
                            note_embedding = NoteEmbedding(
                                note_id=note.id,
                                chunk_index=i,
                                chunk_text=chunk,
                                embedding=embedding,
                            )
                            db.add(note_embedding)
                    
                except Exception as e:
                    print(f"[Embed Error] Note {note.id}: {str(e)}")
                    continue
    
    background_tasks.add_task(embed_notes_task)
    
    return success({
        "message": "嵌入任务已启动",
        "total_notes": len(notes),
        "status": "processing"
    })


@router.get("/embedding-stats")
async def get_embedding_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取嵌入统计信息"""
    
    # 统计已嵌入的笔记数
    embedded_notes_query = text("""
        SELECT COUNT(DISTINCT note_id) as embedded_notes
        FROM note_embeddings ne
        JOIN notes n ON ne.note_id = n.id
        WHERE n.user_id = :user_id
    """)
    
    result = await db.execute(embedded_notes_query, {"user_id": current_user.id})
    embedded_notes = result.scalar() or 0
    
    # 总笔记数
    total_notes_result = await db.execute(
        select(Note).where(Note.user_id == current_user.id)
    )
    total_notes = len(total_notes_result.scalars().all())
    
    # 总嵌入块数
    chunks_query = text("""
        SELECT COUNT(*) as total_chunks
        FROM note_embeddings ne
        JOIN notes n ON ne.note_id = n.id
        WHERE n.user_id = :user_id
    """)
    
    result = await db.execute(chunks_query, {"user_id": current_user.id})
    total_chunks = result.scalar() or 0
    
    return success({
        "total_notes": total_notes,
        "embedded_notes": embedded_notes,
        "coverage": f"{(embedded_notes / total_notes * 100):.1f}%" if total_notes > 0 else "0%",
        "total_chunks": total_chunks,
    })
