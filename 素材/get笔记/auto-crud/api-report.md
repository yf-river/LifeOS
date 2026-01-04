# Get笔记 API 捕获报告

生成时间: 2026-01-03T11:18:39.459Z

## 捕获的端点

### AUTH

- `GET /spacex/v1/web/user/info`

### NOTES

- `GET /yoda/web/v1/chats/question_resource/config`
- `POST /yoda/web/v1/chats/startup_shortcuts`
- `POST /yoda/web/v1/chats/startup_questions`
- `GET /spacex/v1/web/team/list`
- `GET /yoda/web/v1/chats/entry`

## 详细信息

### AUTH

#### GET /spacex/v1/web/user/info

**响应** (200):
```json
{
  "h": {
    "c": 0,
    "e": "",
    "s": 1767439102,
    "t": 14,
    "apm": "eb591d51c652001"
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

### NOTES

#### GET /yoda/web/v1/chats/question_resource/config

**响应** (200):
```json
{
  "h": {
    "c": 0,
    "e": "",
    "s": 1767439101,
    "t": 12,
    "apm": "eb591d4f383f003"
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

#### POST /yoda/web/v1/chats/startup_shortcuts

**请求体**:
```json
{}
```

**响应** (200):
```json
{
  "h": {
    "c": 0,
    "e": "",
    "s": 1767439101,
    "t": 10,
    "apm": "eb591d502652001"
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

#### POST /yoda/web/v1/chats/startup_questions

**请求体**:
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

**响应** (200):
```json
{
  "h": {
    "c": 0,
    "e": "",
    "s": 1767439101,
    "t": 15,
    "apm": "eb591d4f9652001"
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

#### GET /spacex/v1/web/team/list

**响应** (200):
```json
{
  "h": {
    "c": 0,
    "e": "",
    "s": 1767439102,
    "t": 4,
    "apm": "eb591d541652001"
  },
  "c": {
    "total": 0,
    "list": []
  }
}
```

#### GET /yoda/web/v1/chats/entry

**响应** (200):
```json
{
  "h": {
    "c": 20103,
    "e": "无法找到此会话",
    "s": 1767439109,
    "t": 11,
    "apm": "eb591dc6e259001"
  },
  "c": {}
}
```

