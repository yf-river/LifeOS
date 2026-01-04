# Get笔记 API 完整捕获报告

生成时间: 2026-01-03T09:53:27.565Z
总请求数: 19

## 唯一端点 (8 个)

### GET /yoda/web/v1/chats/question_resource/config

调用次数: 4

**响应示例** (200):
```json
{
  "h": {
    "c": 0,
    "e": "",
    "s": 1767433968,
    "t": 7,
    "apm": "eb57e3f60c32002"
  },
  "c": {
    "enable_deep_think_mode": false,
    "enable_auto_agent_mode": false,
    "auto_agent_mode_tip": "",
    "max_share_chat_message_count": 0,
    "support_file_types": [
      "pdf",
      "docx",
      "doc",
      "xlsx",
      "csv",
      "ppt",
      "pptx",
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "tiff",
      "tif"
    ],
    "file_parse_max_wait_ms": 1800000,
    "total_resources_max_count": 50,
    "topic_files_max_count": 10,
    "local_files_max_count": 10,
    "images_max_count": 10,
    "note_max_count": 20,
    "book_topic_max_count": 0,
    "chat_file_max_size_byte": 104857600,
    "chat_image_max_size_byte": 10485760,
    "chat_image_max_width": 10240,
    "chat_image_max_height": 10240,
    "chat_image_max_pixels": 36000000,
    "has_exceeded_daily_file_quota": false
  }
}
```

### POST /yoda/web/v1/chats/startup_shortcuts

调用次数: 4

**请求体示例**:
```json
{}
```

**响应示例** (200):
```json
{
  "h": {
    "c": 0,
    "e": "",
    "s": 1767433968,
    "t": 12,
    "apm": "eb57e3f5f659001"
  },
  "c": {
    "shortcuts": [
      {
        "image": "https://piccdn2.umiwi.com/fe-oss/default/MTc1MDE0ODU2OTM1.png",
        "icon": "https://piccdn2.umiwi.com/fe-oss/default/MTc1MDEzMTI1NDgx.png",
        "text": "Get日报",
        "type": "daily_report",
        "has_new": false
      }
    ]
  }
}
```

### POST /yoda/web/v1/chats/startup_questions

调用次数: 4

**请求体示例**:
```json
{
  "notes": {
    "select_all": true
  },
  "web": true,
  "dedao": true,
  "study": false,
  "topics": {},
  "mode": "AUTO",
  "selected_resources": []
}
```

**响应示例** (200):
```json
{
  "h": {
    "c": 0,
    "e": "",
    "s": 1767433968,
    "t": 19,
    "apm": "eb57e3f60e59002"
  },
  "c": {
    "questions": [
      {
        "question": "汇总一周笔记，生成“本周重点工作总结”和“下周计划”",
        "show_question": "帮我生成周报"
      },
      {
        "question": "提取一周笔记里的待办事项，按紧急-重要程度排序",
        "show_question": "整理一周待办"
      },
      {
        "question": "汇总过去 24 小时全球最值得关注的 10 条新闻，并各用 50 字摘要",
        "show_question": "24小时热点"
      },
      {
        "question": "请根据我提供的 [事件/产品/问题] 开展多维度的调研，包含背景、核心优势、争议点及当前现状。",
        "show_question": "多维度深度调研"
      },
      {
        "question": "遇到一个难题，稍后我会发给你，请在全部内容中搜索，有哪些解决方案或思维模型？",
        "show_question": "寻找解决方案"
      },
      {
        "question": "稍后我会发给你一个[主题/关键词]，请搜索得到内容，找出相关的精彩金句或颠覆性观点。",
        "show_question": "搜索金句/观点"
      }
    ]
  }
}
```

### GET /spacex/v1/web/user/info

调用次数: 2

**响应示例** (200):
```json
{
  "h": {
    "c": 0,
    "e": "",
    "s": 1767433968,
    "t": 14,
    "apm": "eb57e3f7e652003"
  },
  "c": {
    "uid": 1840524,
    "cellphone": "+86176****4026",
    "nickname": "Get达人",
    "avatar": "https://pic-cdn.trytalks.com/pic/202306022120/avatar_191e7b2240007088.jpg",
    "status": 2,
    "user_team_info": null,
    "create_time": 1767195847,
    "update_time": 1767195847
  }
}
```

### GET /spacex/v1/web/team/list

调用次数: 2

**响应示例** (200):
```json
{
  "h": {
    "c": 0,
    "e": "",
    "s": 1767433968,
    "t": 3,
    "apm": "eb57e3fa2e59002"
  },
  "c": {
    "total": 0,
    "list": []
  }
}
```

### GET /yoda/web/v1/chats/entry

调用次数: 1

**响应示例** (200):
```json
{
  "h": {
    "c": 20103,
    "e": "无法找到此会话",
    "s": 1767433977,
    "t": 10,
    "apm": "eb57e48c6832003"
  },
  "c": {}
}
```

### POST /yoda/web/v1/chats

调用次数: 1

**请求体示例**:
```json
{}
```

**响应示例** (200):
```json
{
  "h": {
    "c": 0,
    "e": "",
    "s": 1767433989,
    "t": 17,
    "apm": "eb57e547eed2001"
  },
  "c": {
    "id": "6958e70581ed461753c57419",
    "title": "新对话"
  }
}
```

### POST /yoda/web/v1/chats/stream

调用次数: 1

**请求体示例**:
```json
{
  "mode": "AUTO",
  "notes": {
    "select_all": true
  },
  "web": true,
  "dedao": true,
  "study": false,
  "topics": {},
  "selected_resources": [],
  "parent_id": "",
  "question": "测试",
  "action": "next",
  "session_id": "6958e70581ed461753c57419"
}
```

