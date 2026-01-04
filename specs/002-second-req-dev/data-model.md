# 数据模型设计

功能分支: `002-second-req-dev`
生成时间: 2026-01-03
数据库: PostgreSQL 15

---

## ER 图

```
┌─────────────────┐       ┌─────────────────┐
│     users       │       │     notes       │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │
│ external_uid    │  │    │ note_id (UK)    │
│ nickname        │  └───▶│ user_id (FK)    │
│ avatar_url      │       │ title           │
│ phone           │       │ content         │
│ status          │       │ json_content    │
│ created_at      │       │ note_type       │
│ updated_at      │       │ entry_type      │
└─────────────────┘       │ source          │
                          │ version         │
┌─────────────────┐       │ status          │
│      tags       │       │ is_ai_generated │
├─────────────────┤       │ ai_summary      │
│ id (PK)         │       │ share_id        │
│ user_id (FK)    │       │ share_scope     │
│ name (UK)       │       │ parent_id       │
│ type            │       │ created_at      │
│ icon            │       │ updated_at      │
│ color           │       └────────┬────────┘
│ sort_order      │                │
│ created_at      │                │
└────────┬────────┘                │
         │                         │
         │    ┌─────────────────┐  │
         │    │   note_tags     │  │
         │    ├─────────────────┤  │
         └───▶│ note_id (FK)    │◀─┘
              │ tag_id (FK)     │
              │ source          │
              │ confidence      │
              │ created_at      │
              └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│  attachments    │       │  link_previews  │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ note_id (FK)    │       │ note_id (FK)    │
│ file_type       │       │ url             │
│ file_url        │       │ title           │
│ file_size       │       │ description     │
│ thumbnail_url   │       │ image_url       │
│ original_name   │       │ favicon_url     │
│ mime_type       │       │ fetched_content │
│ created_at      │       │ created_at      │
└─────────────────┘       └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│  transcripts    │       │   ai_tasks      │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ note_id (FK)    │       │ note_id (FK)    │
│ segments (JSONB)│       │ task_type       │
│ full_text       │       │ status          │
│ language        │       │ progress        │
│ duration        │       │ result (JSONB)  │
│ created_at      │       │ error_message   │
└─────────────────┘       │ created_at      │
                          │ completed_at    │
                          └─────────────────┘
```

---

## 实体定义

### users (用户表)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 内部主键 |
| external_uid | BIGINT | UK, NOT NULL | 外部用户ID (Get笔记 uid) |
| nickname | VARCHAR(100) | NOT NULL | 昵称 |
| avatar_url | TEXT | | 头像URL |
| phone | VARCHAR(20) | | 手机号 (脱敏) |
| status | SMALLINT | DEFAULT 1 | 状态: 1=正常, 0=禁用 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |

**索引**:
- `idx_users_external_uid` UNIQUE ON (external_uid)

---

### notes (笔记表)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 内部主键 |
| note_id | VARCHAR(32) | UK, NOT NULL | 业务ID (雪花算法) |
| user_id | BIGINT | FK → users.id | 用户ID |
| title | VARCHAR(500) | | 标题 |
| content | TEXT | NOT NULL | 纯文本内容 (用于搜索) |
| json_content | TEXT | NOT NULL | Tiptap JSON (主存储) |
| note_type | VARCHAR(20) | NOT NULL | 类型: plain_text, image, ai_link, audio, video |
| entry_type | VARCHAR(20) | DEFAULT 'manual' | 入口: manual, import, api |
| source | VARCHAR(20) | DEFAULT 'web' | 来源: web, ios, android |
| version | INTEGER | DEFAULT 1 | 乐观锁版本号 |
| status | SMALLINT | DEFAULT 0 | 状态: 0=正常, 1=回收站, 2=已删除 |
| is_ai_generated | BOOLEAN | DEFAULT FALSE | 是否AI生成 |
| ai_summary | TEXT | | AI摘要 |
| source_url | TEXT | | 链接笔记的原始URL |
| share_id | VARCHAR(20) | | 分享短链ID |
| share_scope | SMALLINT | DEFAULT 0 | 分享范围: 0=私有, 1=公开 |
| parent_id | VARCHAR(32) | | 父笔记ID (追加笔记) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |

**索引**:
- `idx_notes_note_id` UNIQUE ON (note_id)
- `idx_notes_user_id` ON (user_id)
- `idx_notes_user_status_created` ON (user_id, status, created_at DESC)
- `idx_notes_content_gin` GIN (to_tsvector('simple', content)) -- 全文搜索

**验证规则**:
- note_type IN ('plain_text', 'image', 'ai_link', 'audio', 'video')
- version >= 1
- json_content 必须是合法 JSON

---

### tags (标签表)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| user_id | BIGINT | FK → users.id | 用户ID |
| name | VARCHAR(50) | NOT NULL | 标签名 |
| type | VARCHAR(10) | DEFAULT 'user' | 类型: system, user |
| icon | VARCHAR(50) | | 系统标签图标 |
| color | VARCHAR(20) | | 用户标签颜色 |
| sort_order | INTEGER | DEFAULT 0 | 排序权重 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |

**约束**:
- `uk_tags_user_name` UNIQUE ON (user_id, name)

**预置系统标签**:
- `AI链接笔记` (icon: link, type: system)
- `图片笔记` (icon: image, type: system)
- `录音笔记` (icon: audio, type: system)

---

### note_tags (笔记标签关联表)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| note_id | BIGINT | FK → notes.id | 笔记ID |
| tag_id | BIGINT | FK → tags.id | 标签ID |
| source | VARCHAR(10) | DEFAULT 'user' | 来源: ai, user |
| confidence | DECIMAL(3,2) | | AI标签置信度 (0.00-1.00) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |

**约束**:
- PK ON (note_id, tag_id)

---

### attachments (附件表)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| note_id | BIGINT | FK → notes.id | 笔记ID |
| file_type | VARCHAR(20) | NOT NULL | 类型: image, audio, video, document |
| file_url | TEXT | NOT NULL | 文件URL |
| thumbnail_url | TEXT | | 缩略图URL |
| file_size | BIGINT | | 文件大小(字节) |
| original_name | VARCHAR(255) | | 原始文件名 |
| mime_type | VARCHAR(100) | | MIME类型 |
| width | INTEGER | | 图片/视频宽度 |
| height | INTEGER | | 图片/视频高度 |
| duration | INTEGER | | 音视频时长(秒) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |

**索引**:
- `idx_attachments_note_id` ON (note_id)

---

### link_previews (链接预览表)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| note_id | BIGINT | FK → notes.id, UK | 笔记ID (一对一) |
| url | TEXT | NOT NULL | 原始URL |
| title | VARCHAR(500) | | 页面标题 |
| description | TEXT | | 页面描述 |
| image_url | TEXT | | 预览图URL |
| favicon_url | TEXT | | 网站图标URL |
| fetched_content | TEXT | | 抓取的正文内容 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |

---

### transcripts (音视频文字稿表)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| note_id | BIGINT | FK → notes.id, UK | 笔记ID (一对一) |
| segments | JSONB | | 分段文字稿 [{start, end, text}] |
| full_text | TEXT | | 完整文字稿 |
| language | VARCHAR(10) | | 检测到的语言 |
| duration | INTEGER | | 总时长(秒) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |

---

### ai_tasks (AI处理任务表)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| note_id | BIGINT | FK → notes.id | 关联笔记ID |
| task_type | VARCHAR(30) | NOT NULL | 类型: ocr, link_analysis, asr, summarize, tag_generation |
| status | VARCHAR(20) | DEFAULT 'pending' | 状态: pending, processing, completed, failed |
| progress | SMALLINT | DEFAULT 0 | 进度 0-100 |
| result | JSONB | | 处理结果 |
| error_message | TEXT | | 错误信息 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| completed_at | TIMESTAMPTZ | | 完成时间 |

**索引**:
- `idx_ai_tasks_note_status` ON (note_id, status)

---

## 状态转换

### 笔记状态 (notes.status)

```
创建 ──▶ 正常(0) ──▶ 回收站(1) ──▶ 已删除(2)
              │            │
              │            ▼
              │        恢复(0)
              │
              └───────────▶ 永久删除(2)
```

### AI任务状态 (ai_tasks.status)

```
pending ──▶ processing ──▶ completed
                 │
                 └──────▶ failed
```

---

## 验证规则汇总

| 实体 | 字段 | 规则 |
|------|------|------|
| notes | json_content | 必须是合法 JSON 字符串 |
| notes | version | >= 1，更新时必须匹配当前版本 |
| notes | note_type | 枚举值验证 |
| tags | name | 长度 1-50，同用户下唯一 |
| note_tags | confidence | 0.00-1.00 范围 |
| attachments | file_size | <= 500MB (音视频)，<= 10MB (图片) |

---

## 初始化 SQL

```sql
-- 创建枚举类型
CREATE TYPE note_type AS ENUM ('plain_text', 'image', 'ai_link', 'audio', 'video');
CREATE TYPE tag_type AS ENUM ('system', 'user');
CREATE TYPE tag_source AS ENUM ('ai', 'user');
CREATE TYPE task_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- 创建表 (省略，见上述定义)

-- 插入系统标签
INSERT INTO tags (user_id, name, type, icon) VALUES
  (0, 'AI链接笔记', 'system', 'link'),
  (0, '图片笔记', 'system', 'image'),
  (0, '录音笔记', 'system', 'audio');
```

---

## GORM 模型示例

```go
package model

import (
    "time"
    "gorm.io/datatypes"
)

type Note struct {
    ID            int64          `gorm:"primaryKey;autoIncrement"`
    NoteID        string         `gorm:"uniqueIndex;size:32;not null"`
    UserID        int64          `gorm:"index;not null"`
    Title         string         `gorm:"size:500"`
    Content       string         `gorm:"type:text;not null"`
    JSONContent   string         `gorm:"column:json_content;type:text;not null"`
    NoteType      string         `gorm:"size:20;not null;default:plain_text"`
    EntryType     string         `gorm:"size:20;default:manual"`
    Source        string         `gorm:"size:20;default:web"`
    Version       int            `gorm:"default:1;not null"`
    Status        int8           `gorm:"default:0"`
    IsAIGenerated bool           `gorm:"default:false"`
    AISummary     string         `gorm:"type:text"`
    SourceURL     string         `gorm:"type:text"`
    ShareID       string         `gorm:"size:20"`
    ShareScope    int8           `gorm:"default:0"`
    ParentID      string         `gorm:"size:32"`
    CreatedAt     time.Time      `gorm:"autoCreateTime"`
    UpdatedAt     time.Time      `gorm:"autoUpdateTime"`
    
    // 关联
    User        *User        `gorm:"foreignKey:UserID"`
    Tags        []Tag        `gorm:"many2many:note_tags"`
    Attachments []Attachment `gorm:"foreignKey:NoteID;references:ID"`
}

type Tag struct {
    ID        int64     `gorm:"primaryKey;autoIncrement"`
    UserID    int64     `gorm:"index"`
    Name      string    `gorm:"size:50;not null"`
    Type      string    `gorm:"size:10;default:user"`
    Icon      string    `gorm:"size:50"`
    Color     string    `gorm:"size:20"`
    SortOrder int       `gorm:"default:0"`
    CreatedAt time.Time `gorm:"autoCreateTime"`
}
```
