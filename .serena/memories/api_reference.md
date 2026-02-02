# API 参考

## 响应格式

所有 API 响应遵循统一格式：

```json
{
  "h": {
    "c": 0,          // 状态码，0=成功，非0表示错误
    "e": "",         // 错误信息，成功时为空字符串
    "s": "success",  // 状态文本
    "t": 1234567890, // 时间戳（秒）
    "apm": {         // 分页信息（可选）
      "page": 1,
      "per_page": 20,
      "total": 100,
      "total_pages": 5
    }
  },
  "c": {}            // 业务数据
}
```

### 状态码说明
- `0`: 成功
- `1`: 参数错误
- `2`: 认证失败
- `3`: 权限不足
- `4`: 资源不存在
- `5`: 服务器内部错误
- `6`: 业务逻辑错误
- `7`: 版本冲突（乐观锁）

## 核心 API 端点

### 认证相关

#### 登录
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

响应：
```json
{
  "h": { "c": 0, "e": "", "s": "success", "t": 1234567890 },
  "c": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "bearer",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "用户名"
    }
  }
}
```

#### 注册
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "用户名"
}
```

#### 获取当前用户信息
```http
GET /api/v1/auth/me
Authorization: Bearer {access_token}
```

### 笔记管理

#### 获取笔记列表
```http
GET /api/v1/notes
Authorization: Bearer {access_token}
参数:
- page: 页码（默认1）
- per_page: 每页数量（默认20）
- keyword: 搜索关键词（可选）
- tag_id: 按标签筛选（可选）
- is_pinned: 是否只获取置顶笔记（可选）
- order_by: 排序字段（created_at/updated_at，默认created_at）
- order: 排序方向（asc/desc，默认desc）
```

响应：
```json
{
  "h": {
    "c": 0, "e": "", "s": "success", "t": 1234567890,
    "apm": { "page": 1, "per_page": 20, "total": 100, "total_pages": 5 }
  },
  "c": {
    "notes": [
      {
        "id": "note_id",
        "title": "笔记标题",
        "content": "笔记内容",
        "json_content": { /* Tiptap JSON 格式 */ },
        "is_pinned": false,
        "version": 1,
        "created_at": "2026-01-09T08:30:00Z",
        "updated_at": "2026-01-09T08:30:00Z",
        "tags": [
          { "id": "tag_id", "name": "标签名", "color": "#666666" }
        ]
      }
    ]
  }
}
```

#### 获取单个笔记
```http
GET /api/v1/notes/{note_id}
Authorization: Bearer {access_token}
```

#### 创建笔记
```http
POST /api/v1/notes
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "新笔记标题",
  "content": "笔记内容",
  "json_content": { /* Tiptap JSON 格式 */ },
  "tag_ids": ["tag_id1", "tag_id2"],
  "is_pinned": false
}
```

#### 更新笔记
```http
PATCH /api/v1/notes/{note_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "更新后的标题",
  "content": "更新后的内容",
  "json_content": { /* 更新后的 Tiptap JSON */ },
  "tag_ids": ["tag_id1", "tag_id3"],
  "version": 2  // 当前版本号，用于乐观锁
}
```

#### 删除笔记（软删除）
```http
DELETE /api/v1/notes/{note_id}
Authorization: Bearer {access_token}
```

### 标签管理

#### 获取标签列表
```http
GET /api/v1/tags
Authorization: Bearer {access_token}
```

响应：
```json
{
  "h": { "c": 0, "e": "", "s": "success", "t": 1234567890 },
  "c": {
    "tags": [
      {
        "id": "tag_id",
        "name": "标签名",
        "color": "#666666",
        "created_at": "2026-01-09T08:30:00Z",
        "note_count": 5
      }
    ]
  }
}
```

#### 创建标签
```http
POST /api/v1/tags
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "新标签",
  "color": "#3b82f6"
}
```

#### 更新标签
```http
PATCH /api/v1/tags/{tag_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "更新后的标签名",
  "color": "#10b981"
}
```

#### 删除标签
```http
DELETE /api/v1/tags/{tag_id}
Authorization: Bearer {access_token}
```

### 搜索功能

#### 全文搜索
```http
GET /api/v1/notes?keyword=搜索关键词
Authorization: Bearer {access_token}
```

#### 语义搜索（向量相似度）
```http
POST /api/v1/search/semantic
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "query": "搜索查询文本",
  "limit": 10
}
```

响应：
```json
{
  "h": { "c": 0, "e": "", "s": "success", "t": 1234567890 },
  "c": {
    "notes": [
      {
        "id": "note_id",
        "title": "笔记标题",
        "content": "笔记内容",
        "similarity": 0.85,  // 相似度分数（0-1）
        "tags": [...]
      }
    ]
  }
}
```

### AI 聊天（RAG）

#### 流式对话
```http
POST /api/v1/chat/rag/stream
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "message": "用户消息",
  "conversation_id": "可选，对话ID（用于多轮对话）",
  "max_tokens": 1000
}
```

响应格式（Server-Sent Events）：
```
event: message
data: {"type": "chunk", "content": "AI 回复片段"}

event: message
data: {"type": "complete", "content": "完整回复"}

event: error
data: {"code": 1, "message": "错误信息"}
```

#### 获取对话历史
```http
GET /api/v1/chat/conversations
Authorization: Bearer {access_token}
```

#### 获取特定对话消息
```http
GET /api/v1/chat/conversations/{conversation_id}/messages
Authorization: Bearer {access_token}
```

### 文件上传

#### 上传图片（带 OCR）
```http
POST /api/v1/upload/image
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

文件字段: file
```

响应：
```json
{
  "h": { "c": 0, "e": "", "s": "success", "t": 1234567890 },
  "c": {
    "url": "https://cos.example.com/image.jpg",
    "thumbnail_url": "https://cos.example.com/thumbnail.jpg",
    "width": 800,
    "height": 600,
    "file_size": 123456,
    "ocr_text": "从图片识别的文字"
  }
}
```

#### 上传录音（带 ASR）
```http
POST /api/v1/upload/audio
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

文件字段: file
```

### 回收站管理

#### 获取回收站列表
```http
GET /api/v1/trash
Authorization: Bearer {access_token}
```

#### 恢复笔记
```http
POST /api/v1/trash/{note_id}/restore
Authorization: Bearer {access_token}
```

#### 永久删除
```http
DELETE /api/v1/trash/{note_id}/permanent
Authorization: Bearer {access_token}
```

### 版本历史

#### 获取笔记版本历史
```http
GET /api/v1/notes/{note_id}/versions
Authorization: Bearer {access_token}
```

响应：
```json
{
  "h": { "c": 0, "e": "", "s": "success", "t": 1234567890 },
  "c": {
    "versions": [
      {
        "id": "version_id",
        "note_id": "note_id",
        "version": 2,
        "title": "版本2的标题",
        "content": "版本2的内容",
        "created_at": "2026-01-09T09:00:00Z",
        "user_id": "user_id"
      },
      {
        "id": "version_id",
        "note_id": "note_id",
        "version": 1,
        "title": "版本1的标题",
        "content": "版本1的内容",
        "created_at": "2026-01-09T08:30:00Z",
        "user_id": "user_id"
      }
    ]
  }
}
```

#### 恢复到特定版本
```http
POST /api/v1/notes/{note_id}/versions/{version_id}/restore
Authorization: Bearer {access_token}
```

### 系统健康检查

#### 健康状态
```http
GET /health
```

响应：
```json
{
  "status": "healthy",
  "timestamp": "2026-01-09T08:30:00Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

## 错误处理示例

### 参数错误
```json
{
  "h": {
    "c": 1,
    "e": "title 字段不能为空",
    "s": "error",
    "t": 1234567890
  },
  "c": null
}
```

### 认证失败
```json
{
  "h": {
    "c": 2,
    "e": "无效的凭证",
    "s": "error",
    "t": 1234567890
  },
  "c": null
}
```

### 权限不足
```json
{
  "h": {
    "c": 3,
    "e": "无权访问该资源",
    "s": "error",
    "t": 1234567890
  },
  "c": null
}
```

### 版本冲突
```json
{
  "h": {
    "c": 7,
    "e": "版本冲突，请刷新后重试",
    "s": "error",
    "t": 1234567890
  },
  "c": {
    "current_version": 2,
    "server_version": 3
  }
}
```

## 请求头要求

### 认证请求
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### 文件上传
```
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

## 分页参数

所有列表接口支持以下分页参数：
- `page`: 页码，从1开始（默认1）
- `per_page`: 每页数量，1-100（默认20）
- `order_by`: 排序字段（如 created_at, updated_at）
- `order`: 排序方向（asc, desc）

## 时间格式

所有时间字段使用 ISO 8601 格式：
- `2026-01-09T08:30:00Z`（UTC 时间）
- `2026-01-09T16:30:00+08:00`（带时区）

前端显示时使用相对时间格式（如"刚刚"、"5分钟前"）。