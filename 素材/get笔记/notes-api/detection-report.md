# 笔记 API 探测报告

**探测时间**: 2026-01-03T10:16:37.371Z
**总请求数**: 6
**唯一端点**: 6
**笔记相关端点**: 0

## ❌ 未捕获到笔记 API

### 可能原因：
1. 笔记数据通过 SSR 直接嵌入 HTML，无需额外 API 调用
2. API 调用需要特定的交互或条件才能触发
3. 接口路径与预期不同

### 已捕获的端点：
- GET /note
- GET /yoda/web/v1/chats/question_resource/config
- POST /yoda/web/v1/chats/startup_shortcuts
- POST /yoda/web/v1/chats/startup_questions
- GET /spacex/v1/web/user/info
- GET /spacex/v1/web/team/list
