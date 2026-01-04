# Get笔记 API 参考文档

基于自动化爬取 + 手动验证整理，生成时间: 2026-01-03

## 认证机制

### JWT Token 认证

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx
```

JWT Payload 结构:
```json
{
  "uid": 1840524,
  "env": "production",
  "exp": 1770023937,
  "iat": 1767431937,
  "iss": "ddll_offical"
}
```

### 请求头

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
Accept: application/json, text/plain, */*
Xi-Csrf-Token: <csrf_token>
X-Request-ID: <timestamp>
X-Team-Id: <team_id or empty>
X-Team-Id-Alias: <alias or empty>
X-Topic-Scope: TEAMSPACE
```

---

## API 端点

### 基础 URL
```
https://get-notes.luojilab.com
```

---

## 笔记 CRUD API (已验证)

### 获取笔记列表

```http
GET /voicenotes/web/notes
```

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `limit` | number | 否 | 返回数量，默认 20 |
| `sort` | string | 否 | 排序方式：`create_desc`(创建时间倒序) |
| `q` | string | 否 | 搜索关键词 |
| `tag_id` | string | 否 | 按标签 ID 过滤 |
| `status` | number | 否 | 状态：0=正常，1=回收站(推测) |

**响应示例**:
```json
{
  "h": { "c": 0, "e": "", "s": 1767444014, "t": 27, "apm": "xxx" },
  "c": {
    "notes": [
      {
        "id": "1897778465994971224",
        "note_id": "1897778465994971224",
        "source": "web",
        "entry_type": "manual",
        "note_type": "plain_text",
        "title": "",
        "content": "笔记内容...",
        "json_content": "{\"type\":\"doc\",\"content\":[...]}",
        "tags": [],
        "attachments": [],
        "status": 0,
        "version": 1,
        "created_at": "2026-01-03 20:38:47",
        "updated_at": "2026-01-03 20:38:47"
      }
    ],
    "has_more": false
  }
}
```

---

### 获取笔记详情

```http
GET /voicenotes/web/notes/{id}
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 笔记 ID |

**响应示例**:
```json
{
  "h": { "c": 0, "e": "", "s": 1767444014, "t": 27, "apm": "xxx" },
  "c": {
    "id": "1897778465994971224",
    "note_id": "1897778465994971224",
    "source": "web",
    "entry_type": "manual",
    "note_type": "plain_text",
    "title": "",
    "content": "笔记内容...",
    "json_content": "{\"type\":\"doc\",\"content\":[...]}",
    "body_text": "笔记内容<br>...",
    "ref_content": "",
    "res_info": {
      "title": "",
      "url": "",
      "ptype": 0,
      "ptype_cn_name": ""
    },
    "tags": [],
    "is_ai_generated": false,
    "attachments": [],
    "audio_state": 0,
    "status": 0,
    "display_status": 1,
    "share_scope": 0,
    "share_exclude_audio": false,
    "share_id": "7gwn8mWqqlO3b",
    "is_child_note": false,
    "parent_id": "",
    "small_images": [],
    "original_images": [],
    "has_ai_processed": true,
    "ai_error_type": "",
    "ai_error_reason": "",
    "edit_time": "2026-01-03 20:40:14",
    "created_at": "2026-01-03 20:38:47",
    "updated_at": "2026-01-03 20:40:14",
    "version": 2,
    "event_status": 0,
    "is_author": true,
    "is_in_topic": false,
    "is_in_book_topic": false,
    "can_append_note": false,
    "hide_source_entrance": false,
    "book": {
      "can_read_online": false,
      "chapter_name": "",
      "jump_url": ""
    }
  }
}
```

---

### 创建笔记

```http
POST /voicenotes/web/notes
```

**请求体**:
```json
{
  "title": "",
  "content": "纯文本内容",
  "json_content": "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"lineHeight\":\"100%\",\"textAlign\":null,\"class\":\"\",\"indent\":0},\"content\":[{\"type\":\"text\",\"text\":\"纯文本内容\"}]}]}",
  "entry_type": "manual",
  "note_type": "plain_text",
  "source": "web",
  "tags": []
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 否 | 标题，可为空 |
| `content` | string | 是 | 纯文本内容 |
| `json_content` | string | 是 | TipTap JSON 格式内容(字符串化) |
| `entry_type` | string | 是 | 入口类型：`manual` |
| `note_type` | string | 是 | 笔记类型：`plain_text` |
| `source` | string | 是 | 来源：`web` |
| `tags` | array | 否 | 标签数组 |

**响应**:
```json
{
  "h": { "c": 0, "e": "", "s": 1767444014, "t": 27, "apm": "xxx" },
  "c": {
    "id": "1897778465994971224",
    "note_id": "1897778465994971224",
    // ... 完整笔记对象
  }
}
```

---

### 更新笔记

```http
PUT /voicenotes/web/notes/{id}
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 笔记 ID |

**请求体**:
```json
{
  "note_id": "1897778465994971224",
  "version": 1,
  "title": "",
  "content": "更新后的内容",
  "json_content": "{\"type\":\"doc\",\"content\":[...]}",
  "entry_type": "manual",
  "note_type": "plain_text",
  "source": "web",
  "tags": [],
  "attachments": []
}
```

**关键字段**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `note_id` | string | **是** | 笔记 ID (必须与路径参数一致) |
| `version` | number | **是** | 当前版本号 (乐观锁) |
| `content` | string | 是 | 更新后的纯文本内容 |
| `json_content` | string | 是 | 更新后的 TipTap JSON 内容 |

**响应**:
```json
{
  "h": { "c": 0, "e": "", "s": 1767444014, "t": 27, "apm": "xxx" },
  "c": {
    "id": "1897778465994971224",
    "version": 2,  // 版本号自动递增
    // ... 完整笔记对象
  }
}
```

---

### 删除笔记

```http
DELETE /voicenotes/web/notes/{id}
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 笔记 ID |

**响应**:
```json
{
  "h": { "c": 0, "e": "", "s": 1767444014, "t": 27, "apm": "xxx" },
  "c": null
}
```

---

## 内容格式

### json_content 结构 (TipTap ProseMirror)

```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "attrs": {
        "lineHeight": "100%",
        "textAlign": null,
        "class": "",
        "indent": 0
      },
      "content": [
        {
          "type": "text",
          "text": "段落文本"
        }
      ]
    }
  ]
}
```

### 支持的节点类型

| 类型 | 说明 |
|------|------|
| `doc` | 文档根节点 |
| `paragraph` | 段落 |
| `text` | 文本 |
| `heading` | 标题 (推测) |
| `bulletList` | 无序列表 (推测) |
| `orderedList` | 有序列表 (推测) |
| `image` | 图片 (推测) |

---

## 响应格式

所有 API 响应都遵循统一格式:

```json
{
  "h": {
    "c": 0,           // 状态码: 0=成功
    "e": "",          // 错误信息
    "s": 1767431940,  // 服务器时间戳
    "t": 15,          // 处理时间(ms)
    "apm": "xxx"      // APM 追踪 ID
  },
  "c": {
    // 业务数据
  }
}
```

### 错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 5202 | 请求参数错误 |

---

## 用户相关 API

### 获取用户信息

```http
GET /spacex/v1/web/user/info
```

**响应**:
```json
{
  "h": { "c": 0, "e": "", "s": 1767431940, "t": 15, "apm": "xxx" },
  "c": {
    "uid": 1840524,
    "cellphone": "+86176****4026",
    "nickname": "Get达人",
    "avatar": "https://pic-cdn.trytalks.com/pic/xxx/avatar_xxx.jpg",
    "status": 2,
    "user_team_info": null,
    "create_time": 1767195847,
    "update_time": 1767195847
  }
}
```

### 获取团队列表

```http
GET /spacex/v1/web/team/list?is_owner=0
```

---

## AI 聊天 API

### 获取 AI 配置

```http
GET /yoda/web/v1/chats/question_resource/config
```

### 获取启动快捷方式

```http
POST /yoda/web/v1/chats/startup_shortcuts
```

### 获取 AI 聊天入口

```http
GET /yoda/web/v1/chats/entry?upstream=US_NOTE&id={note_id}
```

---

## 待验证 API

以下 API 尚未抓包验证:

### 文件上传
```
POST   /spacex/v1/web/upload/token    - 获取上传凭证
POST   /spacex/v1/web/upload/image    - 上传图片
```

### 分享
```
POST   /voicenotes/web/notes/{id}/share      - 分享笔记
DELETE /voicenotes/web/notes/{id}/share      - 取消分享
```

### 批量操作
```
POST   /voicenotes/web/notes/batch/delete    - 批量删除
POST   /voicenotes/web/notes/batch/restore   - 批量恢复
```

### 标签管理
```
GET    /spacex/v1/web/tags            - 获取标签列表
POST   /spacex/v1/web/tags            - 创建标签
DELETE /spacex/v1/web/tags/{id}       - 删除标签
```

---

## 文件存储

### OSS 配置
- **域名**: get-notes.umiwi.com
- **CDN**: piccdn2.umiwi.com

### 图片 URL 格式
```
https://get-notes.umiwi.com/get_notes_prod/{YYYYMMDDHHMI}/getnotes_img_{random_id}.jpeg
  ?Expires={timestamp}
  &OSSAccessKeyId={key_id}
  &Signature={signature}
  &x-oss-process=image/resize,m_lfit,w_720,h_3240
```

---

## API 验证状态汇总

| 操作 | 方法 | 端点 | 状态 |
|------|------|------|------|
| 列表 | GET | `/voicenotes/web/notes` | ✅ 已验证 |
| 详情 | GET | `/voicenotes/web/notes/{id}` | ✅ 已验证 |
| 创建 | POST | `/voicenotes/web/notes` | ✅ 已验证 |
| 更新 | PUT | `/voicenotes/web/notes/{id}` | ✅ 已验证 |
| 删除 | DELETE | `/voicenotes/web/notes/{id}` | ✅ 已验证 |
| 上传 | POST | 待确认 | ❓ 待验证 |
| 分享 | POST | 待确认 | ❓ 待验证 |
| 标签 | GET/POST/DELETE | 待确认 | ❓ 待验证 |
