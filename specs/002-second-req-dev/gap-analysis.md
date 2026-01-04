# Get笔记 1:1 复刻差距分析报告

生成时间: 2026-01-03

## 总体评估

| 维度 | 掌握度 | 状态 |
|------|--------|------|
| 视觉设计系统 | 75% | 基本完成 |
| 页面布局结构 | 70% | 基本完成 |
| 组件库识别 | 80% | 已确认 |
| 交互流程 | 40% | 需要补充 |
| API接口规范 | 15% | 严重缺失 |
| 编辑器实现 | 30% | 需要深入 |
| AI功能细节 | 35% | 需要补充 |

**综合掌握度: 约 50%**

---

## 一、已掌握的内容

### 1.1 技术栈确认
- **前端框架**: Vue 3 + Naive UI
- **编辑器**: Tiptap / ProseMirror (class: `tiptap ProseMirror aie-content`)
- **样式方案**: Tailwind CSS + CSS Variables
- **图片存储**: 阿里云 OSS (get-notes.umiwi.com)

### 1.2 页面结构
```
├── 侧边栏 (pc-sider)
│   ├── Logo
│   ├── 菜单项
│   │   ├── 首页 (icon-shouye)
│   │   ├── AI助手 (icon-zhushouxingxiang)
│   │   ├── 知识库 (icon-zhishiku)
│   │   ├── 标签 (icon-biaoqian1)
│   │   ├── 小程序
│   │   └── 下载App
│   └── 用户信息
├── 主内容区
│   ├── 顶部输入框 (Omnibar)
│   ├── 笔记列表
│   └── 笔记详情
└── AI面板 (可选)
```

### 1.3 笔记卡片结构
```html
<div class="note-item card">
  <div class="note-item-header">
    <span class="header-ai-icon"></span>  <!-- AI处理标记 -->
  </div>
  <div class="note-item-ai">
    <div class="note-item-ai-link">标题</div>
  </div>
  <div class="note-tags">
    <span class="n-tag n-tag--icon system">AI链接笔记</span>
    <span class="n-tag">用户标签</span>
  </div>
</div>
```

### 1.4 标签系统
- 系统标签类型: `AI链接笔记`, `图片笔记`, `录音笔记`
- 系统标签样式: `n-tag n-tag--icon system`
- 系统标签图标: `tag-icon ai_link`, `tag-icon image`, `tag-icon audio`
- 用户标签样式: `n-tag` (白底灰字)
- 共发现 86 个不同标签

### 1.5 CSS变量 (核心)
```css
--primary: 220 17% 14%;           /* 主色调 */
--background: 0 0% 100%;          /* 背景色 */
--foreground: 240 10% 3.9%;       /* 前景色 */
--border: 240 5.9% 90%;           /* 边框色 */
--radius: 0.5rem;                 /* 圆角 */
--header-height: 76px;            /* 头部高度 */
--chat-background: #F2F2F3;       /* 聊天背景 */
--aie-text-color: #333;           /* 编辑器文字色 */
--aie-content-blockquote-bg-color: #f6f6f7;
--shadow-textarea: 0px 4px 24px 0px rgba(0, 0, 0, 0.05);
```

### 1.6 已捕获的API端点
```
GET  https://notes-api.biji.com/yoda/web/v1/chats/question_resource/config
POST https://notes-api.biji.com/yoda/web/v1/chats/startup_shortcuts
POST https://notes-api.biji.com/yoda/web/v1/chats/startup_questions
GET  https://notes-api.biji.com/spacex/v1/web/user/info
GET  https://notes-api.biji.com/spacex/v1/web/team/list?is_owner=0
GET  https://notes-api.biji.com/yoda/web/v1/chats/entry?upstream=US_NOTE&id=xxx
```

---

## 二、严重缺失的内容

### 2.1 API接口规范 (缺失 85%)

#### 需要但未获取的API:
```
# 笔记CRUD
POST   /api/notes              - 创建笔记
GET    /api/notes              - 获取笔记列表
GET    /api/notes/:id          - 获取单个笔记
PUT    /api/notes/:id          - 更新笔记
DELETE /api/notes/:id          - 删除笔记

# 文件上传
POST   /api/upload/image       - 上传图片
POST   /api/upload/audio       - 上传音频
POST   /api/upload/video       - 上传视频
GET    /api/upload/oss-token   - 获取OSS上传凭证

# AI处理
POST   /api/ai/ocr             - 图片OCR
POST   /api/ai/analyze-link    - 链接分析
POST   /api/ai/transcribe      - 音频转写
POST   /api/ai/summarize       - AI总结
POST   /api/ai/generate-tags   - 生成标签

# 标签管理
GET    /api/tags               - 获取标签列表
POST   /api/tags               - 创建标签
DELETE /api/tags/:id           - 删除标签

# 搜索
GET    /api/search?q=xxx       - 全文搜索
```

#### 未知信息:
- 认证方式 (JWT? Cookie? Token?)
- 请求/响应格式
- 分页参数格式
- 错误响应格式
- WebSocket 实时更新机制

### 2.2 编辑器配置 (缺失 70%)

#### 已知:
- 使用 Tiptap/ProseMirror
- 类名: `tiptap ProseMirror aie-content`

#### 未知:
- [ ] 启用的扩展列表 (Extensions)
- [ ] 工具栏按钮配置
- [ ] 快捷键映射
- [ ] 支持的Block类型
- [ ] 图片拖拽/粘贴处理
- [ ] @提及功能
- [ ] 自动保存机制
- [ ] 协同编辑支持

### 2.3 交互细节 (缺失 60%)

#### 笔记操作:
- [ ] 创建新笔记的完整流程
- [ ] 自动保存 vs 手动保存
- [ ] 删除确认流程
- [ ] 归档/取消归档
- [ ] 分享功能
- [ ] 导出功能

#### 列表交互:
- [ ] 拖拽排序
- [ ] 批量选择
- [ ] 右键菜单内容
- [ ] 滚动加载机制

#### 搜索功能:
- [ ] 实时搜索 vs 回车搜索
- [ ] 搜索建议/自动完成
- [ ] 高亮匹配
- [ ] 搜索历史

### 2.4 AI功能细节 (缺失 65%)

#### 图片AI:
- [ ] OCR 调用时机 (上传后自动? 手动触发?)
- [ ] OCR 结果展示位置
- [ ] OCR 结果是否可编辑
- [ ] 处理进度显示

#### 链接AI:
- [ ] 链接分析请求格式
- [ ] 返回的字段 (标题、摘要、关键词、图片)
- [ ] 分析失败处理
- [ ] 重新分析功能

#### 音视频AI:
- [ ] 转写服务提供商
- [ ] 支持的格式和大小限制
- [ ] 转写进度显示
- [ ] 分段转写还是全文
- [ ] 时间轴对应

#### 自动标签:
- [ ] 生成时机 (创建时? 保存时?)
- [ ] 生成数量限制
- [ ] 用户是否可修改AI标签
- [ ] 标签推荐算法

### 2.5 微交互和动画 (缺失 80%)

- [ ] 页面切换动画
- [ ] 卡片悬停效果
- [ ] 按钮点击反馈
- [ ] 加载状态 (骨架屏? Spinner?)
- [ ] Toast通知样式和位置
- [ ] 模态框动画
- [ ] 拖拽视觉反馈

### 2.6 响应式设计 (缺失 50%)

- [ ] 断点定义
- [ ] 移动端布局
- [ ] 平板端布局
- [ ] 侧边栏折叠逻辑
- [ ] 触摸手势支持

---

## 三、建议的补充方案

### 方案A: 手动体验记录 (推荐)

1. **准备录屏工具** - 录制完整操作流程
2. **逐一测试功能**:
   - 创建各类型笔记
   - 上传图片观察OCR
   - 添加链接观察分析
   - 上传音频观察转写
   - 添加/删除标签
   - 搜索功能
   - 删除笔记
3. **记录API请求** - 使用浏览器开发者工具Network面板
4. **截图关键状态** - 加载中、空状态、错误状态

### 方案B: 深度自动化爬取

需要您手动登录后保持浏览器打开，脚本执行:
1. 自动创建测试笔记
2. 触发各种操作
3. 捕获所有网络请求
4. 记录DOM变化

### 方案C: 基于现有数据推进

使用已有的50%信息开始开发，边开发边补充:
1. 先实现基础架构
2. UI基本还原
3. API格式自定义设计
4. 后续根据需要调整

---

## 四、复刻优先级建议

### P0 - 必须精确还原
- [x] 页面布局结构
- [x] 颜色系统
- [x] 标签样式
- [ ] 笔记卡片样式
- [ ] 编辑器基本功能

### P1 - 功能等价即可
- [ ] AI处理流程 (可用不同服务实现)
- [ ] 文件上传 (可用不同存储)
- [ ] 搜索功能

### P2 - 可以简化
- [ ] 动画效果
- [ ] 微交互
- [ ] 高级编辑功能

---

## 五、结论

**当前状态**: 可以开始基础框架开发，但完整1:1复刻还需要更多信息。

**建议下一步**:
1. 选择上述方案之一补充缺失信息
2. 或者接受当前50%的掌握度，开始开发并边做边完善

**预计达到90%还原度需要**:
- 完整的API抓包数据
- 编辑器配置详情
- 所有交互流程录屏
