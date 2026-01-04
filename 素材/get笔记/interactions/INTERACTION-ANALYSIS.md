# Get笔记 交互逻辑分析

## 爬取时间
2026-01-03T08:34:27.506Z

## 1. 主界面结构
{
  "omnibar": {
    "selector": ".aie-content",
    "placeholder": "",
    "tagName": "DIV",
    "className": "tiptap ProseMirror aie-content"
  },
  "quickActions": [],
  "toolbar": [],
  "noteList": [],
  "sidebar": [
    {
      "text": "首页",
      "className": "menu-item selected",
      "isActive": true
    },
    {
      "text": "首页",
      "className": "menu-item-label",
      "isActive": false
    },
    {
      "text": "AI助手",
      "className": "menu-item",
      "isActive": false
    },
    {
      "text": "AI助手",
      "className": "menu-item-label",
      "isActive": false
    },
    {
      "text": "知识库",
      "className": "menu-item",
      "isActive": false
    },
    {
      "text": "知识库",
      "className": "menu-item-label",
      "isActive": false
    },
    {
      "text": "标签",
      "className": "menu-item",
      "isActive": false
    },
    {
      "text": "标签",
      "className": "menu-item-label",
      "isActive": false
    },
    {
      "text": "小程序",
      "className": "menu-item",
      "isActive": false
    },
    {
      "text": "小程序",
      "className": "menu-item-label",
      "isActive": false
    },
    {
      "text": "下载App",
      "className": "menu-item",
      "isActive": false
    },
    {
      "text": "下载App",
      "className": "menu-item-label",
      "isActive": false
    }
  ],
  "aiAssistant": null
}

## 2. 图片上传流程
- 入口：点击 "添加图片" 按钮
- 支持：AI 智能识别图片内容
- 自动：生成相关标签

## 3. 链接分析流程
- 入口：点击 "添加链接" 按钮
- 支持：AI 智能分析链接内容
- 自动：提取摘要、生成标签

## 4. 音视频导入流程
- 入口：点击 "导入音视频" 按钮
- 支持：语音转文字
- 支持：AI 智能总结

## 5. 标签系统
- 自动标签：AI 根据内容自动生成
- 手动标签：用户可手动添加/编辑
- 标签管理：支持合并、删除、重命名

## 6. 捕获的 API 端点
API 请求: 5 个
上传请求: 0 个
AI 请求: 1 个

## 7. 技术栈
- 编辑器: Tiptap (ProseMirror)
- UI 框架: Naive UI
- 状态管理: 待确认

## 文件列表
- 01-main-structure.json
- 02-image-dialog-analysis.json
- 03-link-dialog-analysis.json
- 04-media-dialog-analysis.json
- 05-note-cards-analysis.json
- 06-note-detail-analysis.json
- 07-tags-analysis.json
- 08-ai-assistant-analysis.json
- 09-knowledge-base-analysis.json
- 10-captured-api-requests.json
