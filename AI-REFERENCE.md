# Get笔记 Clone - AI 开发参考文档

> 本文档整合了从 Get笔记爬取的数据和参考项目(blinko, memos, FastGPT, khoj, WeKnora)的核心实现，
> 为第二期迭代开发提供详细的 AI 参考。

**生成时间**: 2026-01-04
**目标**: UI/交互改进 + AI能力集成 + 向量数据库 + Tauri桌面应用

---

## 目录

1. [UI/交互设计参考](#1-ui交互设计参考)
2. [AI 流式对话实现](#2-ai-流式对话实现)
3. [向量数据库 (PG Vector)](#3-向量数据库-pg-vector)
4. [智能标签系统](#4-智能标签系统)
5. [语义搜索实现](#5-语义搜索实现)
6. [Get日报功能](#6-get日报功能)
7. [Tauri 桌面应用](#7-tauri-桌面应用)
8. [MCP 协议集成](#8-mcp-协议集成)
9. [API 设计规范](#9-api-设计规范)
10. [技术选型推荐](#10-技术选型推荐)

---

## 1. UI/交互设计参考

### 1.1 Get笔记 原版设计系统

**来源**: `crawled-assets/final-design-analysis.md`, `crawled-assets/interactions/`

#### 颜色系统
```css
/* 主色调 */
--primary-bg: #1e2329;        /* 深灰背景 */
--secondary-bg: #282d34;      /* 卡片背景 */
--border-color: #3a3f47;      /* 边框 */

/* AI 相关 */
--ai-user-msg: #2a88ff;       /* 用户消息气泡 */
--ai-assistant-msg: #f5f5f5;  /* AI 回复气泡 */

/* 交互 */
--hover-bg: rgba(255,255,255,0.05);
--active-bg: rgba(255,255,255,0.1);
```

#### 布局尺寸
```
三栏布局:
├── Sidebar: 175px (固定)
├── MainContent: 774px (flex)
└── AIPanel: 280px (可折叠)

笔记卡片:
├── 宽度: 100% (自适应)
├── 内边距: 16px
├── 圆角: 8px
└── 间距: 12px

编辑器:
├── Omnibar 高度: 56px
├── 最大高度: 300px
└── 字体大小: 14px
```

### 1.2 笔记卡片交互

**来源**: `crawled-assets/interactions/05-note-cards-analysis.json`

```typescript
// 笔记卡片组件接口
interface NoteCard {
  id: string;
  content: string;
  createdAt: string;      // ISO 时间
  displayTime: string;    // "刚刚", "5分钟前", "昨天 14:30"
  tags: Tag[];
  attachments: Attachment[];
  isExpanded: boolean;
  
  // 交互状态
  isHovered: boolean;
  isSelected: boolean;
  isEditing: boolean;
}

// 时间显示逻辑 (Get笔记风格)
function formatDisplayTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 2) return `昨天 ${format(date, 'HH:mm')}`;
  if (days < 7) return format(date, 'EEEE HH:mm', { locale: zhCN });
  return format(date, 'yyyy-MM-dd HH:mm');
}
```

### 1.3 标签筛选交互

**来源**: `crawled-assets/interactions/07-tags-analysis.json`

```typescript
// 标签系统
interface Tag {
  id: string;
  name: string;
  color?: string;
  count: number;        // 使用次数
  parentId?: string;    // 支持层级标签
}

// 标签筛选状态
interface TagFilter {
  selectedTags: string[];
  matchMode: 'AND' | 'OR';  // AND: 同时包含, OR: 包含任一
}

// 标签云渲染
const TagCloud: React.FC<{ tags: Tag[] }> = ({ tags }) => {
  const sortedTags = useMemo(() => 
    [...tags].sort((a, b) => b.count - a.count),
    [tags]
  );
  
  return (
    <div className="flex flex-wrap gap-2">
      {sortedTags.map(tag => (
        <TagChip 
          key={tag.id}
          tag={tag}
          size={getTagSize(tag.count)} // 根据使用次数调整大小
        />
      ))}
    </div>
  );
};
```

### 1.4 Omnibar (编辑器入口)

**来源**: `crawled-assets/interactions/01-main-structure.json`

```typescript
// Omnibar 配置
const omnibarConfig = {
  placeholder: '记录一条笔记...',
  shortcuts: [
    { key: 'Ctrl+Enter', action: 'submit' },
    { key: '#', action: 'insertTag' },
    { key: '@', action: 'mention' },
    { key: '/', action: 'command' },
  ],
  
  // 快捷操作
  quickActions: [
    { icon: 'image', label: '添加图片', action: 'uploadImage' },
    { icon: 'link', label: '添加链接', action: 'addLink' },
    { icon: 'microphone', label: '语音输入', action: 'voiceInput' },
    { icon: 'ai', label: 'AI 助手', action: 'openAI' },
  ],
};
```

---

## 2. AI 流式对话实现

### 2.1 Get笔记 AI API

**来源**: `crawled-assets/full-api/api-report.md`

```typescript
// Get笔记 API 格式
interface GetNotesAPIResponse<T> {
  h: {
    c: number;      // 错误码，0 表示成功
    e: string;      // 错误信息
    s: number;      // 时间戳
    t: number;      // 耗时(ms)
    apm: string;    // APM 追踪 ID
  };
  c: T;             // 业务数据
}

// 流式对话请求
const streamChatRequest = {
  endpoint: 'POST /yoda/web/v1/chats/stream',
  body: {
    mode: 'AUTO',                   // 自动模式
    notes: { select_all: true },    // 搜索范围
    web: true,                      // 搜索网络
    dedao: true,                    // 搜索得到
    study: false,
    topics: {},
    selected_resources: [],
    parent_id: '',
    question: '用户问题',
    action: 'next',
    session_id: 'session_id'
  },
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>',
  }
};

// 启动问题 (推荐问题)
const startupQuestions = [
  { question: '汇总一周笔记，生成"本周重点工作总结"和"下周计划"', show_question: '帮我生成周报' },
  { question: '提取一周笔记里的待办事项，按紧急-重要程度排序', show_question: '整理一周待办' },
  { question: '汇总过去 24 小时全球最值得关注的 10 条新闻，并各用 50 字摘要', show_question: '24小时热点' },
  { question: '请根据我提供的 [事件/产品/问题] 开展多维度的调研', show_question: '多维度深度调研' },
  { question: '遇到一个难题，请在全部内容中搜索，有哪些解决方案或思维模型？', show_question: '寻找解决方案' },
  { question: '请搜索得到内容，找出相关的精彩金句或颠覆性观点', show_question: '搜索金句/观点' },
];
```

### 2.2 blinko 流式对话实现

**来源**: `素材/blinko/server/routerTrpc/ai.ts`

```typescript
// tRPC 流式对话 (Generator 模式)
import { router, authProcedure } from '../middleware';
import { z } from 'zod';

export const aiRouter = router({
  // 流式对话
  completions: authProcedure
    .input(z.object({
      question: z.string(),
      withTools: z.boolean().optional(),     // 启用工具调用
      withOnline: z.boolean().optional(),    // 启用联网搜索
      withRAG: z.boolean().optional(),       // 启用 RAG
      conversations: z.array(z.object({ 
        role: z.string(), 
        content: z.string() 
      })),
      systemPrompt: z.string().optional()
    }))
    .mutation(async function* ({ input, ctx }) {
      const { question, conversations, withTools, withOnline, withRAG, systemPrompt } = input;
      
      // 调用 AI 服务
      const { result: responseStream, notes } = await AiService.completions({
        question,
        conversations,
        ctx,
        withTools,
        withOnline,
        withRAG,
        systemPrompt
      });
      
      // 先返回相关笔记
      yield { notes };
      
      // 流式返回内容
      for await (const chunk of responseStream.fullStream) {
        yield { chunk };
      }
    }),
    
  // AI 写作助手
  writing: authProcedure
    .input(z.object({
      question: z.string(),
      type: z.enum(['expand', 'polish', 'custom']),
      content: z.string().optional()
    }))
    .mutation(async function* ({ input }) {
      const { question, type, content } = input;
      const agent = await AiModelFactory.WritingAgent(type);
      
      const result = await agent.stream([
        { role: 'user', content: question },
        { role: 'system', content: `用户笔记内容: ${content || ''}` }
      ]);
      
      for await (const chunk of result.fullStream) {
        yield chunk;
      }
    }),
});
```

### 2.3 前端流式处理

```typescript
// React Hook 处理流式响应
import { useState, useCallback } from 'react';
import { trpc } from '@/trpc/client';

export function useStreamingChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const sendMessage = useCallback(async (question: string) => {
    setIsStreaming(true);
    
    // 添加用户消息
    const userMessage: Message = { role: 'user', content: question };
    setMessages(prev => [...prev, userMessage]);
    
    // 添加空的 AI 消息占位
    const aiMessageId = Date.now().toString();
    setMessages(prev => [...prev, { id: aiMessageId, role: 'assistant', content: '' }]);
    
    try {
      // 使用 tRPC subscription 或 mutation generator
      const stream = await trpc.ai.completions.mutate({
        question,
        conversations: messages,
        withRAG: true,
      });
      
      // 处理流式数据
      for await (const data of stream) {
        if (data.notes) {
          // 处理相关笔记
          console.log('Related notes:', data.notes);
        }
        if (data.chunk) {
          // 更新 AI 消息内容
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: msg.content + data.chunk.content }
              : msg
          ));
        }
      }
    } finally {
      setIsStreaming(false);
    }
  }, [messages]);
  
  return { messages, isStreaming, sendMessage };
}
```

---

## 3. 向量数据库 (PG Vector)

### 3.1 数据库 Schema

**来源**: `素材/代码实现参考.md`

```sql
-- 安装 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 笔记表
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  markdown TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id UUID NOT NULL REFERENCES users(id),
  visibility VARCHAR(20) DEFAULT 'PRIVATE'
);

-- 向量嵌入表
CREATE TABLE note_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL UNIQUE REFERENCES notes(id) ON DELETE CASCADE,
  embedding vector(384),  -- 384 维向量 (all-MiniLM-L6-v2)
  model_name VARCHAR(100) DEFAULT 'all-MiniLM-L6-v2',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HNSW 索引 (高效近邻搜索)
CREATE INDEX note_embedding_idx ON note_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- 全文搜索支持
ALTER TABLE notes ADD COLUMN textsearch tsvector 
GENERATED ALWAYS AS (to_tsvector('chinese', content)) STORED;
CREATE INDEX notes_textsearch_idx ON notes USING gin(textsearch);
```

### 3.2 Prisma Schema

**来源**: `素材/blinko/prisma/schema.prisma`

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Note {
  id        String   @id @default(cuid())
  content   String   @db.Text
  markdown  String?  @db.Text
  
  // 关系
  tags      Tag[]    @relation("NoteToTag")
  embedding NoteEmbedding?
  
  // 元数据
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  
  // 用户
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([createdAt])
}

model NoteEmbedding {
  id        String @id @default(cuid())
  noteId    String @unique
  note      Note   @relation(fields: [noteId], references: [id], onDelete: Cascade)
  
  embedding Bytes  // 向量数据
  model     String // 嵌入模型
  
  createdAt DateTime @default(now())
  
  @@index([noteId])
}

model Tag {
  id       String  @id @default(cuid())
  name     String  @unique
  color    String?
  parentId String?
  parent   Tag?    @relation("TagHierarchy", fields: [parentId], references: [id])
  children Tag[]   @relation("TagHierarchy")
  
  notes    Note[]  @relation("NoteToTag")
  
  @@index([name])
  @@index([parentId])
}
```

### 3.3 向量搜索实现

**来源**: `素材/代码实现参考.md`

```typescript
// services/vectorSearch.ts

import { prisma } from '@/lib/prisma';
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

export class VectorSearchService {
  private embeddingModel = openai.embedding('text-embedding-3-small');
  
  // 生成向量嵌入
  async generateEmbedding(text: string): Promise<number[]> {
    const result = await embed({
      model: this.embeddingModel,
      value: text,
    });
    return result.embedding;
  }
  
  // 向量搜索
  async searchByVector(
    query: string, 
    options: { topK?: number; minSimilarity?: number } = {}
  ) {
    const { topK = 10, minSimilarity = 0.5 } = options;
    
    // 生成查询向量
    const queryEmbedding = await this.generateEmbedding(query);
    
    // 使用原生 SQL 进行向量搜索
    const results = await prisma.$queryRaw`
      SELECT 
        n.id, n.content, n.created_at,
        1 - (ne.embedding <=> ${queryEmbedding}::vector) as similarity
      FROM notes n
      JOIN note_embeddings ne ON n.id = ne.note_id
      WHERE 1 - (ne.embedding <=> ${queryEmbedding}::vector) > ${minSimilarity}
      ORDER BY similarity DESC
      LIMIT ${topK}
    `;
    
    return results;
  }
  
  // 混合搜索 (向量 + 全文)
  async hybridSearch(
    query: string,
    options: { topK?: number; vectorWeight?: number } = {}
  ) {
    const { topK = 10, vectorWeight = 0.7 } = options;
    const ftsWeight = 1 - vectorWeight;
    
    const queryEmbedding = await this.generateEmbedding(query);
    
    const results = await prisma.$queryRaw`
      SELECT 
        n.id, n.content, n.created_at,
        (
          COALESCE(ts_rank(n.textsearch, websearch_to_tsquery('chinese', ${query})), 0) * ${ftsWeight} +
          (1 - (ne.embedding <=> ${queryEmbedding}::vector)) * ${vectorWeight}
        ) as score
      FROM notes n
      LEFT JOIN note_embeddings ne ON n.id = ne.note_id
      WHERE 
        n.textsearch @@ websearch_to_tsquery('chinese', ${query})
        OR (1 - (ne.embedding <=> ${queryEmbedding}::vector)) > 0.5
      ORDER BY score DESC
      LIMIT ${topK}
    `;
    
    return results;
  }
  
  // 更新笔记向量
  async upsertEmbedding(noteId: string, content: string) {
    const embedding = await this.generateEmbedding(content);
    
    await prisma.noteEmbedding.upsert({
      where: { noteId },
      create: {
        noteId,
        embedding: Buffer.from(new Float32Array(embedding).buffer),
        model: 'text-embedding-3-small',
      },
      update: {
        embedding: Buffer.from(new Float32Array(embedding).buffer),
      },
    });
  }
}
```

---

## 4. 智能标签系统

### 4.1 AI 自动标签

**来源**: `素材/blinko/server/routerTrpc/ai.ts`

```typescript
// AI 自动标签
export const aiRouter = router({
  autoTag: authProcedure
    .input(z.object({
      content: z.string()
    }))
    .mutation(async function ({ input }) {
      const config = await AiModelFactory.globalConfig();
      const { content } = input;
      
      // 获取已有标签
      const existingTags = await getAllPathTags();
      
      // 创建标签 Agent
      const tagAgent = await AiModelFactory.TagAgent(config.aiTagsPrompt);
      
      // 生成标签
      const result = await tagAgent.generate(`
        已有标签列表: [${existingTags.join(', ')}]
        笔记内容: ${content}
        请为此内容推荐合适的标签。包含完整的层级路径，如 #Parent/Child。
      `);
      
      // 解析结果
      return result?.text
        ?.trim()
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean) ?? [];
    }),
});
```

### 4.2 标签 Agent Prompt

```typescript
// 标签生成 Agent
const tagAgentPrompt = `
你是一个智能标签助手。根据笔记内容，推荐最相关的标签。

规则:
1. 优先使用已有标签列表中的标签
2. 如果需要新标签，确保与已有标签风格一致
3. 支持层级标签，如 #工作/会议、#学习/技术/前端
4. 每条笔记推荐 1-5 个标签
5. 返回格式: 标签1, 标签2, 标签3

示例:
输入: "今天学习了 React Hooks 的使用方法，特别是 useEffect 的依赖数组"
输出: #学习/技术/前端, #React, #Hooks
`;
```

### 4.3 层级标签管理

```typescript
// 层级标签服务
export class TagService {
  // 获取所有标签（包含层级路径）
  async getAllPathTags(): Promise<string[]> {
    const tags = await prisma.tag.findMany({
      include: { parent: true }
    });
    
    return tags.map(tag => this.buildTagPath(tag, tags));
  }
  
  // 构建标签路径
  private buildTagPath(tag: Tag, allTags: Tag[]): string {
    const path: string[] = [tag.name];
    let current = tag;
    
    while (current.parentId) {
      const parent = allTags.find(t => t.id === current.parentId);
      if (!parent) break;
      path.unshift(parent.name);
      current = parent;
    }
    
    return '#' + path.join('/');
  }
  
  // 创建或获取标签（支持层级）
  async getOrCreateTag(tagPath: string): Promise<Tag> {
    const parts = tagPath.replace('#', '').split('/');
    let parentId: string | null = null;
    let tag: Tag | null = null;
    
    for (const part of parts) {
      tag = await prisma.tag.upsert({
        where: { 
          name_parentId: { name: part, parentId: parentId ?? null }
        },
        create: { name: part, parentId },
        update: {},
      });
      parentId = tag.id;
    }
    
    return tag!;
  }
}
```

---

## 5. 语义搜索实现

### 5.1 搜索服务架构

**来源**: `素材/深度分析-5个参考项目.md`

```typescript
// services/searchService.ts

export class SearchService {
  private vectorSearch: VectorSearchService;
  
  constructor() {
    this.vectorSearch = new VectorSearchService();
  }
  
  // 统一搜索入口
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const {
      mode = 'hybrid',  // 'vector' | 'fulltext' | 'hybrid'
      filters = {},
      pagination = { limit: 20, offset: 0 },
    } = options;
    
    let results: SearchResult[];
    
    switch (mode) {
      case 'vector':
        results = await this.vectorSearch.searchByVector(query, { topK: pagination.limit });
        break;
      case 'fulltext':
        results = await this.fulltextSearch(query, pagination);
        break;
      case 'hybrid':
      default:
        results = await this.vectorSearch.hybridSearch(query, { topK: pagination.limit });
    }
    
    // 应用过滤器
    if (filters.tags?.length) {
      results = results.filter(r => 
        r.tags?.some(t => filters.tags!.includes(t.name))
      );
    }
    
    if (filters.dateRange) {
      results = results.filter(r =>
        r.createdAt >= filters.dateRange!.start &&
        r.createdAt <= filters.dateRange!.end
      );
    }
    
    return results;
  }
  
  // 全文搜索
  private async fulltextSearch(query: string, pagination: Pagination) {
    return prisma.note.findMany({
      where: {
        OR: [
          { content: { search: query } },
          { tags: { some: { name: { contains: query } } } },
        ],
      },
      take: pagination.limit,
      skip: pagination.offset,
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

### 5.2 RAG 实现

**来源**: `素材/blinko/server/aiServer/`

```typescript
// AI 服务中的 RAG 实现
export class AiService {
  static async completions(params: CompletionParams) {
    const { question, conversations, withRAG, ctx } = params;
    
    let contextNotes: Note[] = [];
    
    // RAG: 检索相关笔记
    if (withRAG) {
      const searchService = new SearchService();
      const searchResults = await searchService.search(question, {
        mode: 'hybrid',
        pagination: { limit: 5, offset: 0 },
      });
      
      contextNotes = searchResults.map(r => ({
        id: r.id,
        content: r.content,
        similarity: r.score,
      }));
    }
    
    // 构建系统提示
    const systemPrompt = this.buildSystemPrompt(contextNotes);
    
    // 调用 LLM
    const model = await AiModelFactory.getDefaultModel();
    const result = await model.stream([
      { role: 'system', content: systemPrompt },
      ...conversations,
      { role: 'user', content: question },
    ]);
    
    return { result, notes: contextNotes };
  }
  
  private static buildSystemPrompt(notes: Note[]): string {
    if (!notes.length) {
      return '你是一个智能笔记助手，帮助用户管理和检索笔记。';
    }
    
    const notesContext = notes.map((n, i) => 
      `[笔记${i + 1}] (相关度: ${(n.similarity * 100).toFixed(0)}%)\n${n.content}`
    ).join('\n\n');
    
    return `你是一个智能笔记助手。以下是与用户问题相关的笔记内容，请基于这些内容回答问题：

${notesContext}

请基于以上笔记内容回答用户问题。如果笔记中没有相关信息，请说明并提供你的建议。`;
  }
}
```

---

## 6. Get日报功能

### 6.1 API 接口

**来源**: `crawled-assets/full-api/all-apis.json`

```typescript
// Get日报快捷方式
const dailyReportShortcut = {
  image: 'https://piccdn2.umiwi.com/fe-oss/default/MTc1MDE0ODU2OTM1.png',
  icon: 'https://piccdn2.umiwi.com/fe-oss/default/MTc1MDEzMTI1NDgx.png',
  text: 'Get日报',
  type: 'daily_report',
  has_new: false
};

// 日报生成 Prompt
const dailyReportPrompt = `
请汇总过去24小时的笔记内容，生成日报：

1. **今日要点** - 列出3-5个关键点
2. **进展总结** - 简要描述今日完成的事项
3. **待办事项** - 提取未完成的任务
4. **明日计划** - 基于今日内容推荐明日重点

格式要求：
- 使用 Markdown 格式
- 保持简洁，每项不超过2行
- 突出重点，使用粗体标记关键词
`;
```

### 6.2 日报服务实现

```typescript
// services/dailyReportService.ts

export class DailyReportService {
  async generateDailyReport(userId: string, date: Date = new Date()): Promise<DailyReport> {
    // 获取指定日期的笔记
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const notes = await prisma.note.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: { tags: true },
      orderBy: { createdAt: 'asc' },
    });
    
    if (notes.length === 0) {
      return {
        date,
        content: '今日暂无笔记记录。',
        noteCount: 0,
      };
    }
    
    // 构建上下文
    const notesContext = notes.map((n, i) => 
      `[${format(n.createdAt, 'HH:mm')}] ${n.content}`
    ).join('\n\n');
    
    // 调用 AI 生成日报
    const agent = await AiModelFactory.DailyReportAgent();
    const result = await agent.generate(`
      今日笔记 (共${notes.length}条):
      
      ${notesContext}
      
      请生成今日日报。
    `);
    
    return {
      date,
      content: result.text,
      noteCount: notes.length,
      tags: this.extractTopTags(notes),
    };
  }
  
  private extractTopTags(notes: Note[]): string[] {
    const tagCounts = new Map<string, number>();
    
    for (const note of notes) {
      for (const tag of note.tags) {
        tagCounts.set(tag.name, (tagCounts.get(tag.name) || 0) + 1);
      }
    }
    
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
  }
}
```

---

## 7. Tauri 桌面应用

### 7.1 Tauri 配置

**来源**: `素材/blinko/app/src-tauri/tauri.conf.json`

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "GetNotes",
  "version": "1.0.0",
  "identifier": "com.getnotes.app",
  "build": {
    "beforeDevCommand": "pnpm run dev",
    "devUrl": "http://localhost:3001",
    "beforeBuildCommand": "pnpm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "withGlobalTauri": true,
    "security": {
      "csp": null
    },
    "windows": [
      {
        "title": "Get笔记",
        "width": 1920,
        "height": 1080,
        "minWidth": 800,
        "minHeight": 600,
        "fullscreen": false,
        "resizable": true,
        "focus": true,
        "hiddenTitle": true,
        "decorations": true,
        "visible": false
      },
      {
        "label": "quicknote",
        "title": "快速记录",
        "width": 600,
        "height": 125,
        "maxHeight": 600,
        "fullscreen": false,
        "resizable": false,
        "focus": true,
        "center": true,
        "visible": false,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "titleBarStyle": "Overlay",
        "transparent": true,
        "hiddenTitle": true,
        "decorations": false,
        "shadow": true,
        "url": "/quicknote"
      },
      {
        "label": "quickai",
        "title": "快捷AI",
        "width": 600,
        "height": 125,
        "maxHeight": 600,
        "fullscreen": false,
        "resizable": false,
        "focus": true,
        "center": true,
        "visible": false,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "titleBarStyle": "Overlay",
        "transparent": true,
        "hiddenTitle": true,
        "decorations": false,
        "shadow": true,
        "url": "/quickai"
      }
    ]
  },
  "bundle": {
    "createUpdaterArtifacts": true,
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  },
  "plugins": {
    "updater": {
      "pubkey": "YOUR_PUBLIC_KEY",
      "endpoints": [
        "https://your-update-server.com/releases/latest.json"
      ]
    }
  }
}
```

### 7.2 Tauri Helper

**来源**: `素材/blinko/app/src/lib/tauriHelper.ts`

```typescript
// lib/tauriHelper.ts

import { invoke } from '@tauri-apps/api/core';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';

export class TauriHelper {
  static isTauri(): boolean {
    return typeof window !== 'undefined' && '__TAURI__' in window;
  }
  
  // 打开快速笔记窗口
  static async openQuickNote() {
    if (!this.isTauri()) return;
    
    const quickNoteWindow = new WebviewWindow('quicknote', {
      url: '/quicknote',
      title: '快速记录',
      width: 600,
      height: 125,
      center: true,
      alwaysOnTop: true,
      decorations: false,
      transparent: true,
    });
    
    await quickNoteWindow.show();
    await quickNoteWindow.setFocus();
  }
  
  // 打开快速 AI 窗口
  static async openQuickAI() {
    if (!this.isTauri()) return;
    
    const quickAIWindow = new WebviewWindow('quickai', {
      url: '/quickai',
      title: '快捷AI',
      width: 600,
      height: 125,
      center: true,
      alwaysOnTop: true,
      decorations: false,
      transparent: true,
    });
    
    await quickAIWindow.show();
    await quickAIWindow.setFocus();
  }
  
  // 注册全局快捷键
  static async registerShortcuts() {
    if (!this.isTauri()) return;
    
    // Cmd/Ctrl + Shift + N: 快速笔记
    await register('CommandOrControl+Shift+N', () => {
      this.openQuickNote();
    });
    
    // Cmd/Ctrl + Shift + Space: 快速 AI
    await register('CommandOrControl+Shift+Space', () => {
      this.openQuickAI();
    });
  }
  
  // 注销快捷键
  static async unregisterShortcuts() {
    if (!this.isTauri()) return;
    
    await unregister('CommandOrControl+Shift+N');
    await unregister('CommandOrControl+Shift+Space');
  }
}
```

### 7.3 项目结构

```
get-notes-desktop/
├── src-tauri/
│   ├── src/
│   │   └── main.rs           # Rust 入口
│   ├── tauri.conf.json       # Tauri 配置
│   ├── Cargo.toml
│   └── icons/                # 应用图标
├── src/
│   ├── app/
│   │   ├── page.tsx          # 主页面
│   │   ├── quicknote/
│   │   │   └── page.tsx      # 快速笔记页面
│   │   └── quickai/
│   │       └── page.tsx      # 快速 AI 页面
│   ├── components/
│   └── lib/
│       └── tauriHelper.ts
├── package.json
└── next.config.js
```

---

## 8. MCP 协议集成

### 8.1 MCP 服务器实现

**来源**: `素材/代码实现参考.md`

```typescript
// mcp/server.ts

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema 
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server({
  name: "getnotes-server",
  version: "1.0.0",
});

// 定义工具
const tools = [
  {
    name: "create_note",
    description: "创建一条笔记",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "笔记内容" },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["content"],
    },
  },
  {
    name: "search_notes",
    description: "搜索笔记库",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "搜索查询" },
        limit: { type: "number", description: "返回数量", default: 10 },
        mode: { 
          type: "string", 
          enum: ["vector", "fulltext", "hybrid"],
          default: "hybrid" 
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_daily_report",
    description: "获取指定日期的日报",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "日期 (YYYY-MM-DD)" },
      },
    },
  },
];

// 处理工具列表请求
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "create_note":
      return await createNote(args.content, args.tags);
    
    case "search_notes":
      return await searchNotes(args.query, args.limit, args.mode);
    
    case "get_daily_report":
      return await getDailyReport(args.date);
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// 启动服务器
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 8.2 MCP 客户端管理

**来源**: `素材/blinko/server/aiServer/mcp/`

```typescript
// mcp/McpClientManager.ts

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

interface McpConnection {
  client: Client;
  lastUsed: Date;
  transport: any;
}

export class McpClientManager {
  private connections: Map<number, McpConnection> = new Map();
  private cleanupTimer: NodeJS.Timer | null = null;
  
  constructor() {
    // 5分钟清理一次空闲连接
    this.cleanupTimer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }
  
  async getConnection(config: McpServerConfig): Promise<Client> {
    const existing = this.connections.get(config.id);
    
    if (existing) {
      existing.lastUsed = new Date();
      return existing.client;
    }
    
    // 创建新连接
    const connection = await this.createConnection(config);
    this.connections.set(config.id, connection);
    
    return connection.client;
  }
  
  private async createConnection(config: McpServerConfig): Promise<McpConnection> {
    let transport: any;
    
    switch (config.type) {
      case 'STDIO':
        transport = new StdioClientTransport({
          command: config.command,
          args: config.args || [],
        });
        break;
      
      case 'SSE':
        transport = new SSEClientTransport(new URL(config.url));
        break;
      
      default:
        throw new Error(`Unsupported transport type: ${config.type}`);
    }
    
    const client = new Client({
      name: "getnotes-client",
      version: "1.0.0",
    });
    
    await client.connect(transport);
    
    return {
      client,
      transport,
      lastUsed: new Date(),
    };
  }
  
  private cleanup() {
    const now = new Date();
    const maxIdleTime = 5 * 60 * 1000; // 5分钟
    
    for (const [id, conn] of this.connections) {
      if (now.getTime() - conn.lastUsed.getTime() > maxIdleTime) {
        conn.client.close();
        this.connections.delete(id);
      }
    }
  }
  
  async getAllTools(): Promise<Tool[]> {
    const allTools: Tool[] = [];
    
    for (const [id, conn] of this.connections) {
      const tools = await conn.client.listTools();
      allTools.push(...tools.tools.map(t => ({
        ...t,
        serverId: id,
      })));
    }
    
    return allTools;
  }
  
  async callTool(serverId: number, toolName: string, args: any): Promise<any> {
    const conn = this.connections.get(serverId);
    if (!conn) throw new Error(`Server ${serverId} not connected`);
    
    return await conn.client.callTool({
      name: toolName,
      arguments: args,
    });
  }
}
```

---

## 9. API 设计规范

### 9.1 API 响应格式

**参考 Get笔记 格式**:

```typescript
// types/api.ts

// 统一响应格式
interface APIResponse<T> {
  h: ResponseHeader;
  c: T;
}

interface ResponseHeader {
  c: number;      // 错误码，0 = 成功
  e: string;      // 错误信息
  s: number;      // 服务器时间戳
  t: number;      // 耗时(ms)
  apm?: string;   // APM 追踪 ID
}

// 错误码定义
enum ErrorCode {
  SUCCESS = 0,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  VALIDATION_ERROR = 422,
  INTERNAL_ERROR = 500,
  
  // 业务错误码 (20xxx)
  SESSION_NOT_FOUND = 20103,
  NOTE_NOT_FOUND = 20201,
  TAG_ALREADY_EXISTS = 20301,
}
```

### 9.2 tRPC 路由设计

```typescript
// trpc/router.ts

import { router } from './middleware';
import { noteRouter } from './routers/note';
import { tagRouter } from './routers/tag';
import { aiRouter } from './routers/ai';
import { searchRouter } from './routers/search';
import { chatRouter } from './routers/chat';

export const appRouter = router({
  note: noteRouter,
  tag: tagRouter,
  ai: aiRouter,
  search: searchRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
```

### 9.3 RESTful 端点对照

| 功能 | RESTful | tRPC |
|-----|---------|------|
| 笔记列表 | `GET /api/notes` | `trpc.note.list.query()` |
| 创建笔记 | `POST /api/notes` | `trpc.note.create.mutate()` |
| 更新笔记 | `PATCH /api/notes/:id` | `trpc.note.update.mutate()` |
| 删除笔记 | `DELETE /api/notes/:id` | `trpc.note.delete.mutate()` |
| 搜索 | `POST /api/search` | `trpc.search.query.query()` |
| AI 对话 | `POST /api/chat/stream` | `trpc.chat.stream.mutate()` |

---

## 10. 技术选型推荐

### 10.1 技术栈对比

| 层 | 推荐 | 备选 | 说明 |
|---|------|------|-----|
| **前端框架** | Next.js 14 | - | App Router + RSC |
| **UI 组件** | Naive UI / Shadcn | TailwindCSS | Get笔记用 Naive UI |
| **状态管理** | Zustand | Jotai | 轻量、TypeScript 友好 |
| **编辑器** | Tiptap | ProseMirror | Get笔记用 Tiptap |
| **后端框架** | tRPC | Next.js API Routes | 类型安全 |
| **数据库** | PostgreSQL | SQLite | 生产用 PG |
| **向量DB** | PG Vector | Milvus | 集成简单 |
| **ORM** | Prisma | Drizzle | 类型安全 |
| **桌面应用** | Tauri v2 | Electron | 更轻量 |
| **AI SDK** | Vercel AI SDK | LangChain | 流式支持好 |

### 10.2 项目结构推荐

```
get-notes-clone/
├── frontend/                    # Next.js 前端
│   ├── src/
│   │   ├── app/                 # 页面
│   │   ├── components/          # 组件
│   │   │   ├── layout/          # 布局组件
│   │   │   ├── notes/           # 笔记组件
│   │   │   ├── ai/              # AI 组件
│   │   │   └── ui/              # 基础 UI
│   │   ├── hooks/               # 自定义 Hooks
│   │   ├── lib/                 # 工具库
│   │   ├── stores/              # Zustand stores
│   │   └── trpc/                # tRPC 客户端
│   ├── public/
│   └── package.json
│
├── backend/                     # Node.js 后端
│   ├── src/
│   │   ├── routers/             # tRPC 路由
│   │   ├── services/            # 业务服务
│   │   ├── ai/                  # AI 相关
│   │   │   ├── agents/          # AI Agents
│   │   │   ├── providers/       # LLM 提供商
│   │   │   └── mcp/             # MCP 协议
│   │   ├── lib/                 # 工具库
│   │   └── middleware/          # 中间件
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
├── desktop/                     # Tauri 桌面应用
│   ├── src-tauri/
│   │   ├── src/
│   │   └── tauri.conf.json
│   └── package.json
│
├── shared/                      # 共享类型
│   ├── types/
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

### 10.3 开发优先级

**第一阶段 (MVP)**:
1. [ ] 笔记 CRUD + 标签
2. [ ] 基础搜索 (全文)
3. [ ] 简单 AI 对话

**第二阶段 (AI 增强)**:
1. [ ] 向量搜索 (PG Vector)
2. [ ] RAG 检索增强
3. [ ] AI 自动标签
4. [ ] 流式对话

**第三阶段 (桌面应用)**:
1. [ ] Tauri 打包
2. [ ] 全局快捷键
3. [ ] 快速笔记窗口
4. [ ] 自动更新

**第四阶段 (高级功能)**:
1. [ ] Get日报
2. [ ] MCP 协议
3. [ ] 多端同步

---

## 附录

### A. 参考项目链接

- **blinko**: https://github.com/blinkochat/blinko (Tauri + AI)
- **memos**: https://github.com/usememos/memos (gRPC-Gateway)
- **FastGPT**: https://github.com/labring/FastGPT (工作流引擎)
- **khoj**: https://github.com/khoj-ai/khoj (多端 + RAG)
- **WeKnora**: https://github.com/Tencent/WeKnora (GraphRAG)

### B. 技术文档

- **Tauri v2**: https://v2.tauri.app/
- **tRPC**: https://trpc.io/
- **PG Vector**: https://github.com/pgvector/pgvector
- **Vercel AI SDK**: https://sdk.vercel.ai/
- **MCP**: https://spec.modelcontextprotocol.io/

### C. Get笔记 原始数据

- API 捕获: `crawled-assets/full-api/all-apis.json`
- 交互分析: `crawled-assets/interactions/`
- 样式提取: `crawled-assets/styles.json`
- 截图: `crawled-assets/*.png`

---

**文档版本**: 1.0
**最后更新**: 2026-01-04
