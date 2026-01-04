# 数据模型 - Prism Next

## 1. 核心实体

### 用户 & 工作区
*   **User (用户)**: 独立的人类个体。
*   **Workspace (工作区)**: 数据所有权的边界 (例如 "个人", "家庭")。
    *   *理由*: 支持未来的多用户场景，同时保持 "量化自我" 默认私有。

### 信息单元
*   **Note (笔记)**: 文本/知识的基本单元。
    *   字段: `id`, `content` (Markdown), `created_at`, `updated_at`, `source_type` (手动/语音/链接), `location` (Point).
    *   元数据 (JSONB): `tags`, `sentiment_score`, `summary`.
*   **Block (块)**: 笔记的细分 (用于细粒度引用)。
    *   字段: `id` (Hash), `note_id`, `content`, `embedding` (向量).

### 生活日志 (时间序列)
*   **LocationEvent (位置事件)**:
    *   字段: `timestamp`, `geom` (PostGIS Point), `accuracy`, `activity_type` (静止/步行/驾驶).
*   **HealthMetrics (健康指标)**:
    *   字段: `timestamp`, `type` (步数/心率), `value`, `unit`.

## 2. Schema (SQL 定义)

```sql
-- 启用扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 用户
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 工作区
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES users(id)
);

-- 笔记 (核心)
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id),
    content TEXT NOT NULL,
    source_type TEXT CHECK (source_type IN ('manual', 'voice', 'link', 'image')),
    metadata JSONB DEFAULT '{}', -- 存储标签, 摘要, AI 属性
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- 软删除
);

-- 笔记块 (用于 RAG)
CREATE TABLE note_blocks (
    id TEXT PRIMARY KEY, -- 内容的哈希
    note_id UUID REFERENCES notes(id),
    content_chunk TEXT NOT NULL,
    embedding vector(1536) -- OpenAI 小嵌入尺寸
);

-- 位置日志 (Timescale Hypertable 候选)
CREATE TABLE location_logs (
    time TIMESTAMPTZ NOT NULL,
    user_id UUID REFERENCES users(id),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    activity TEXT
);
-- 转换为 hypertable (如果启用了 Timescale)
-- SELECT create_hypertable('location_logs', 'time');
```

## 3. SQLite Schema (客户端)

*服务端 Schema 的镜像，但已简化。*

```sql
CREATE TABLE notes (
    id TEXT PRIMARY KEY, -- UUID 字符串
    content TEXT,
    sync_status TEXT CHECK (sync_status IN ('synced', 'dirty', 'deleted')),
    updated_at TEXT -- ISO8601
);

CREATE TABLE offline_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation TEXT, -- 'CREATE', 'UPDATE'
    payload TEXT -- JSON
);
```
