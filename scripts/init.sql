-- LifeOS 数据库初始化脚本
-- 使用 PostgreSQL 15 with pgvector

-- 启用扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- 用于模糊搜索
CREATE EXTENSION IF NOT EXISTS "vector";   -- 用于向量搜索（RAG）

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    avatar TEXT,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 笔记表
CREATE TABLE IF NOT EXISTS notes (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    title VARCHAR(500),
    content TEXT,
    json_content JSONB,
    is_pinned BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#666666',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(user_id, name)
);

-- 笔记-标签关联表
CREATE TABLE IF NOT EXISTS note_tags (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    note_id VARCHAR(36) NOT NULL REFERENCES notes(id),
    tag_id VARCHAR(36) NOT NULL REFERENCES tags(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(note_id, tag_id)
);

-- 附件表
CREATE TABLE IF NOT EXISTS attachments (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    note_id VARCHAR(36) REFERENCES notes(id),
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL, -- image, audio, video, file
    file_name VARCHAR(255),
    file_size BIGINT DEFAULT 0,
    mime_type VARCHAR(100),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    width INTEGER DEFAULT 0,
    height INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0, -- 音视频时长（秒）
    ocr_text TEXT,
    asr_text TEXT,
    extra_info JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes(is_pinned);
CREATE INDEX IF NOT EXISTS idx_notes_content_trgm ON notes USING gin(content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_notes_title_trgm ON notes USING gin(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id);

CREATE INDEX IF NOT EXISTS idx_attachments_note_id ON attachments(note_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON attachments(user_id);

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_tags_updated_at
    BEFORE UPDATE ON tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_attachments_updated_at
    BEFORE UPDATE ON attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 笔记向量表（用于 RAG 语义搜索）
CREATE TABLE IF NOT EXISTS note_embeddings (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    note_id VARCHAR(36) NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL DEFAULT 0,  -- 文档分块索引
    chunk_text TEXT NOT NULL,                 -- 原始文本块
    embedding vector(1536),                   -- OpenAI text-embedding-3-small 维度
    model_name VARCHAR(100) DEFAULT 'text-embedding-3-small',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(note_id, chunk_index)
);

-- 向量搜索索引（使用 HNSW 算法，适合高性能近似搜索）
CREATE INDEX IF NOT EXISTS idx_note_embeddings_vector ON note_embeddings 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_note_embeddings_note_id ON note_embeddings(note_id);

CREATE TRIGGER trigger_note_embeddings_updated_at
    BEFORE UPDATE ON note_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 笔记版本历史表
CREATE TABLE IF NOT EXISTS note_versions (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    note_id VARCHAR(36) NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    title VARCHAR(500),
    content TEXT,
    json_content JSONB,
    change_type VARCHAR(50) DEFAULT 'update',  -- create, update, restore
    change_summary VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_note_versions_note_id ON note_versions(note_id);
CREATE INDEX IF NOT EXISTS idx_note_versions_version ON note_versions(note_id, version DESC);

-- 版本递增触发器（笔记乐观锁）
CREATE OR REPLACE FUNCTION increment_note_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notes_version
    BEFORE UPDATE ON notes
    FOR EACH ROW
    WHEN (OLD.content IS DISTINCT FROM NEW.content OR OLD.json_content IS DISTINCT FROM NEW.json_content OR OLD.title IS DISTINCT FROM NEW.title)
    EXECUTE FUNCTION increment_note_version();

-- 测试数据（开发环境）
-- 密码: test123456 (bcrypt hash)
INSERT INTO users (id, email, password, nickname)
VALUES (
    'test-user-001', 
    'test@example.com', 
    '$2b$12$qRQHCZkVqHpqLB/G1kxghu12dJ7Qb2BYmydri0jP5YHHPak/yZlVS', 
    '测试用户'
) ON CONFLICT (email) DO NOTHING;

-- 创建示例笔记
INSERT INTO notes (id, user_id, title, content, json_content)
VALUES (
    'note-001',
    'test-user-001',
    '欢迎使用 Get笔记 Clone',
    '这是一个功能完整的笔记应用克隆。\n\n主要功能：\n- 富文本编辑\n- 图片/音频/视频上传\n- OCR 图片识别\n- ASR 语音转文字\n- AI 摘要生成\n- 链接预览',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"这是一个功能完整的笔记应用克隆。"}]}]}'
) ON CONFLICT (id) DO NOTHING;

-- 创建示例标签
INSERT INTO tags (id, user_id, name, color)
VALUES 
    ('tag-001', 'test-user-001', '工作', '#3B82F6'),
    ('tag-002', 'test-user-001', '学习', '#10B981'),
    ('tag-003', 'test-user-001', '生活', '#F59E0B')
ON CONFLICT (user_id, name) DO NOTHING;
