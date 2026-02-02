# 数据库指南

## 数据库配置

### PostgreSQL 配置
- **镜像**: `pgvector/pgvector:pg15`
- **端口**: 5433（容器外部）-> 5432（容器内部）
- **用户**: `lifeos`
- **密码**: `lifeos123`
- **数据库**: `lifeos`

### Redis 配置
- **镜像**: `redis:7-alpine`
- **端口**: 6380（容器外部）-> 6379（容器内部）
- **持久化**: 启用 appendonly

## 数据库初始化

### 初始化脚本
位置: `scripts/init.sql`

脚本内容包含：
1. 创建扩展
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;  -- pgvector 扩展
   CREATE EXTENSION IF NOT EXISTS pg_trgm; -- 全文搜索扩展
   CREATE EXTENSION IF NOT EXISTS btree_gin; -- GIN 索引支持
   ```

2. 创建表结构
   - `users` 用户表
   - `notes` 笔记表
   - `tags` 标签表
   - `note_tags` 笔记-标签关联表
   - `attachments` 附件表
   - `note_versions` 笔记版本历史表
   - `note_embeddings` 笔记向量嵌入表

3. 创建索引
   - 外键索引
   - 全文搜索索引
   - 向量相似度索引

### 启动数据库
```bash
# 使用 Docker Compose
docker-compose up -d postgres redis

# 数据库会自动执行 init.sql
```

### 手动连接数据库
```bash
# 使用 psql 客户端
psql -h localhost -p 5433 -U lifeos -d lifeos

# 密码提示时输入: lifeos123
```

## 数据库模型

### 用户表 (users)
```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 笔记表 (notes)
```sql
CREATE TABLE notes (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500),
    content TEXT,          -- 纯文本，用于搜索
    json_content JSONB,    -- Tiptap JSON 格式
    is_pinned BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,  -- 软删除时间戳
    
    -- 索引
    INDEX idx_notes_user_id (user_id),
    INDEX idx_notes_created_at (created_at),
    INDEX idx_notes_updated_at (updated_at),
    INDEX idx_notes_deleted_at (deleted_at),
    INDEX idx_notes_is_pinned (is_pinned)
);
```

### 标签表 (tags)
```sql
CREATE TABLE tags (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#666666',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- 约束：用户下的标签名唯一
    UNIQUE (user_id, name),
    
    -- 索引
    INDEX idx_tags_user_id (user_id)
);
```

### 笔记-标签关联表 (note_tags)
```sql
CREATE TABLE note_tags (
    id VARCHAR(36) PRIMARY KEY,
    note_id VARCHAR(36) NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id VARCHAR(36) NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- 约束：防止重复关联
    UNIQUE (note_id, tag_id),
    
    -- 索引
    INDEX idx_note_tags_note_id (note_id),
    INDEX idx_note_tags_tag_id (tag_id)
);
```

### 附件表 (attachments)
```sql
CREATE TABLE attachments (
    id VARCHAR(36) PRIMARY KEY,
    note_id VARCHAR(36) REFERENCES notes(id) ON DELETE SET NULL,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL,           -- image, audio, video, file
    file_name VARCHAR(255),
    file_size INTEGER DEFAULT 0,
    mime_type VARCHAR(100),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    width INTEGER DEFAULT 0,
    height INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0,          -- 音视频时长（秒）
    ocr_text TEXT,                       -- OCR 识别文字
    asr_text TEXT,                       -- 语音识别文字
    extra_info JSONB,                    -- 额外信息
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- 索引
    INDEX idx_attachments_note_id (note_id),
    INDEX idx_attachments_user_id (user_id),
    INDEX idx_attachments_type (type)
);
```

### 笔记版本历史表 (note_versions)
```sql
CREATE TABLE note_versions (
    id VARCHAR(36) PRIMARY KEY,
    note_id VARCHAR(36) NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    title VARCHAR(500),
    content TEXT,
    json_content JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    
    -- 约束：笔记版本唯一
    UNIQUE (note_id, version),
    
    -- 索引
    INDEX idx_note_versions_note_id (note_id),
    INDEX idx_note_versions_created_at (created_at)
);
```

### 笔记向量嵌入表 (note_embeddings)
```sql
CREATE TABLE note_embeddings (
    id VARCHAR(36) PRIMARY KEY,
    note_id VARCHAR(36) NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    embedding vector(1536),  -- OpenAI embedding 维度
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- 索引：用于向量相似度搜索
    INDEX idx_note_embeddings_embedding 
        USING ivfflat (embedding vector_cosine_ops) 
        WITH (lists = 100),
    
    -- 外键索引
    INDEX idx_note_embeddings_note_id (note_id)
);
```

## 数据库迁移

### Alembic 配置
项目使用 Alembic 进行数据库迁移管理。

### 创建迁移
```bash
cd backend

# 生成迁移脚本（自动检测模型变化）
alembic revision --autogenerate -m "迁移描述"

# 示例
alembic revision --autogenerate -m "添加用户头像字段"
```

### 应用迁移
```bash
# 应用所有未执行的迁移
alembic upgrade head

# 回滚到上一个版本
alembic downgrade -1

# 升级到特定版本
alembic upgrade abc123456789

# 检查当前版本
alembic current
```

### 迁移脚本位置
- `backend/alembic/versions/` - 迁移脚本文件

### 迁移脚本示例
```python
"""添加用户头像字段

Revision ID: abc123456789
Revises: def987654321
Create Date: 2026-01-09 08:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    # 添加 avatar_url 字段
    op.add_column('users', sa.Column('avatar_url', sa.Text(), nullable=True))


def downgrade() -> None:
    # 删除 avatar_url 字段
    op.drop_column('users', 'avatar_url')
```

## 数据库索引策略

### 查询优化索引
1. **用户笔记查询**
   ```sql
   CREATE INDEX idx_notes_user_created 
   ON notes(user_id, created_at DESC);
   ```

2. **全文搜索优化**
   ```sql
   CREATE INDEX idx_notes_content_gin 
   ON notes USING GIN (to_tsvector('english', content));
   ```

3. **标签关联查询**
   ```sql
   CREATE INDEX idx_note_tags_composite 
   ON note_tags(tag_id, note_id);
   ```

### 向量搜索索引
```sql
-- IVFFlat 索引，优化余弦相似度搜索
CREATE INDEX idx_note_embeddings_embedding 
ON note_embeddings 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);
```

## 数据库维护

### 备份数据库
```bash
# 备份 PostgreSQL
docker exec lifeos-postgres pg_dump -U lifeos lifeos > backup_$(date +%Y%m%d).sql

# 备份 Redis
docker exec lifeos-redis redis-cli save
docker cp lifeos-redis:/data/dump.rdb redis_backup_$(date +%Y%m%d).rdb
```

### 恢复数据库
```bash
# 恢复 PostgreSQL
cat backup_file.sql | docker exec -i lifeos-postgres psql -U lifeos lifeos

# 恢复 Redis
docker cp redis_backup.rdb lifeos-redis:/data/dump.rdb
docker restart lifeos-redis
```

### 监控数据库
```bash
# 查看 PostgreSQL 连接数
docker exec lifeos-postgres psql -U lifeos -c "SELECT count(*) FROM pg_stat_activity;"

# 查看 Redis 内存使用
docker exec lifeos-redis redis-cli info memory
```

## 性能优化

### 查询优化建议
1. **避免 SELECT ***
   ```python
   # 不推荐
   session.query(Note).all()
   
   # 推荐：只选择需要的字段
   session.query(Note.id, Note.title, Note.created_at).all()
   ```

2. **使用分页**
   ```python
   # 使用 limit 和 offset
   notes = session.query(Note)\
       .filter(Note.user_id == user_id)\
       .order_by(Note.created_at.desc())\
       .limit(20).offset(0).all()
   ```

3. **批量操作**
   ```python
   # 批量插入
   session.bulk_save_objects(notes_list)
   session.commit()
   ```

### 连接池配置
SQLAlchemy 连接池配置：
```python
# backend/app/core/database.py
SQLALCHEMY_DATABASE_URL = "postgresql+asyncpg://lifeos:lifeos123@localhost:5432/lifeos"

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    echo=False
)
```

## 常见问题

### 数据库连接失败
1. **检查服务状态**
   ```bash
   docker ps | grep postgres
   docker logs lifeos-postgres
   ```

2. **检查端口冲突**
   ```bash
   lsof -i :5433
   ```

3. **验证连接信息**
   ```bash
   psql -h localhost -p 5433 -U lifeos -d lifeos
   ```

### 迁移失败
1. **检查模型与数据库一致性**
   ```bash
   alembic revision --autogenerate -m "检查差异"
   ```

2. **手动执行 SQL**
   ```bash
   # 查看生成的 SQL
   alembic upgrade head --sql
   
   # 手动执行
   psql -h localhost -p 5433 -U lifeos -d lifeos -f migration.sql
   ```

### 性能问题
1. **分析慢查询**
   ```sql
   -- 在 PostgreSQL 中启用慢查询日志
   ALTER SYSTEM SET log_min_duration_statement = 1000;
   ```

2. **检查索引使用**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM notes WHERE user_id = 'user_id';
   ```

## 开发注意事项

### 模型修改流程
1. 修改 SQLAlchemy 模型
2. 生成迁移脚本：`alembic revision --autogenerate`
3. 检查生成的迁移脚本
4. 应用迁移：`alembic upgrade head`
5. 测试相关功能

### 数据一致性
- 使用数据库事务保证数据一致性
- 外键约束确保引用完整性
- 软删除模式（`deleted_at` 字段）

### 测试数据库
- 测试使用独立的测试数据库
- 每次测试后清理数据
- 使用事务回滚保证测试隔离