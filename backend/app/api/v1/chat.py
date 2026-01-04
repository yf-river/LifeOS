"""RAG 聊天 API - 基于检索增强的 AI 对话"""

import json
from typing import List, AsyncGenerator

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.core import get_db, get_current_user, success, invalid_params, server_error, settings
from app.models import User, Note, NoteEmbedding
from app.schemas import RAGChatRequest, ChatMessage
from app.services import get_embedding, call_chat
from app.services.deepseek import call_chat_stream


router = APIRouter(prefix="/chat", tags=["AI聊天"])


async def retrieve_context(
    query: str,
    user_id: str,
    db: AsyncSession,
    top_k: int = 3,
) -> List[dict]:
    """检索相关上下文
    
    使用向量相似度搜索获取与查询最相关的笔记片段
    """
    # 获取查询向量
    query_embedding = await get_embedding(query)
    if query_embedding is None:
        return []
    
    # 向量搜索
    search_query = text("""
        SELECT 
            ne.chunk_text,
            n.title as note_title,
            1 - (ne.embedding <=> :query_embedding::vector) as similarity
        FROM note_embeddings ne
        JOIN notes n ON ne.note_id = n.id
        WHERE n.user_id = :user_id
            AND ne.embedding IS NOT NULL
        ORDER BY ne.embedding <=> :query_embedding::vector
        LIMIT :top_k
    """)
    
    result = await db.execute(
        search_query,
        {
            "query_embedding": str(query_embedding),
            "user_id": user_id,
            "top_k": top_k,
        }
    )
    
    rows = result.fetchall()
    
    contexts = []
    for row in rows:
        if row.similarity and row.similarity > 0.5:  # 相似度阈值
            contexts.append({
                "text": row.chunk_text,
                "title": row.note_title,
                "score": float(row.similarity),
            })
    
    return contexts


def build_rag_prompt(query: str, contexts: List[dict], history: List[ChatMessage]) -> List[dict]:
    """构建 RAG 提示词
    
    将检索到的上下文注入到系统提示中
    """
    messages = []
    
    # 系统提示
    if contexts:
        context_text = "\n\n".join([
            f"【{ctx.get('title', '笔记')}】\n{ctx['text']}"
            for ctx in contexts
        ])
        system_prompt = f"""你是一个智能笔记助手。请基于用户的笔记内容回答问题。

以下是从用户笔记中检索到的相关内容：

{context_text}

请根据这些内容回答用户的问题。如果笔记内容不足以回答问题，请明确告知用户，并提供你知道的相关信息。
回答要简洁、准确、有帮助。使用中文回答。"""
    else:
        system_prompt = """你是一个智能笔记助手。用户的笔记库中没有找到与问题相关的内容。
请基于你的知识回答问题，但要明确告知用户这不是来自他们的笔记。
回答要简洁、准确、有帮助。使用中文回答。"""
    
    messages.append({"role": "system", "content": system_prompt})
    
    # 历史消息
    for msg in history[-6:]:  # 只保留最近6条历史
        messages.append({"role": msg.role, "content": msg.content})
    
    # 当前问题
    messages.append({"role": "user", "content": query})
    
    return messages


@router.post("/rag")
async def rag_chat(
    data: RAGChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """RAG 聊天 - 基于笔记内容的 AI 对话（非流式）"""
    
    if not data.query or not data.query.strip():
        return invalid_params("问题不能为空")
    
    try:
        # 检索相关上下文
        contexts = []
        if data.use_rag:
            contexts = await retrieve_context(
                query=data.query,
                user_id=current_user.id,
                db=db,
                top_k=data.top_k,
            )
        
        # 构建消息
        messages = build_rag_prompt(data.query, contexts, data.history)
        
        # 调用 AI
        response = await call_chat(messages)
        
        return success({
            "answer": response,
            "contexts": contexts,
            "has_context": len(contexts) > 0,
        })
    
    except Exception as e:
        return server_error(f"AI 对话失败: {str(e)}")


@router.post("/rag/stream")
async def rag_chat_stream(
    data: RAGChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """RAG 聊天 - 流式响应（SSE）"""
    
    if not data.query or not data.query.strip():
        return invalid_params("问题不能为空")
    
    async def generate() -> AsyncGenerator[str, None]:
        try:
            # 检索相关上下文
            contexts = []
            if data.use_rag:
                contexts = await retrieve_context(
                    query=data.query,
                    user_id=current_user.id,
                    db=db,
                    top_k=data.top_k,
                )
            
            # 先发送上下文信息
            yield json.dumps({
                "type": "context",
                "data": {
                    "contexts": contexts,
                    "has_context": len(contexts) > 0,
                }
            })
            
            # 构建消息
            messages = build_rag_prompt(data.query, contexts, data.history)
            
            # 流式调用 AI
            async for chunk in call_chat_stream(messages):
                yield json.dumps({
                    "type": "content",
                    "data": chunk,
                })
            
            # 结束标记
            yield json.dumps({
                "type": "done",
                "data": None,
            })
        
        except Exception as e:
            yield json.dumps({
                "type": "error",
                "data": str(e),
            })
    
    return EventSourceResponse(generate())


@router.post("/simple")
async def simple_chat(
    data: RAGChatRequest,
    current_user: User = Depends(get_current_user),
):
    """简单聊天 - 不使用 RAG"""
    
    if not data.query or not data.query.strip():
        return invalid_params("问题不能为空")
    
    try:
        messages = [{"role": "system", "content": "你是一个有帮助的助手。使用中文回答。"}]
        
        for msg in data.history[-6:]:
            messages.append({"role": msg.role, "content": msg.content})
        
        messages.append({"role": "user", "content": data.query})
        
        response = await call_chat(messages)
        
        return success({
            "answer": response,
        })
    
    except Exception as e:
        return server_error(f"AI 对话失败: {str(e)}")
