# 技术研究报告

生成时间: 2026-01-03
功能分支: `002-second-req-dev`

---

## 技术上下文

### 已确定项

| 类别 | 技术选型 | 来源 |
|------|----------|------|
| 前端框架 | React 18 + Next.js 14 | Clarification Q4 |
| UI 组件库 | shadcn/ui + Tailwind CSS | Clarification Q4 |
| 状态管理 | Zustand | Clarification Q4 |
| 富文本编辑器 | Tiptap (ProseMirror) | spec.md - Get笔记使用 |
| 后端框架 | Go + go-zero | 用户偏好 (CODEBUDDY.md) |
| ORM | GORM | 用户偏好 |
| 认证方式 | JWT + CSRF Token | API 验证结果 |
| 内容存储 | json_content 主存储 | Clarification Q2 |
| 冲突处理 | 弹窗 + 剪贴板 | Clarification Q3 |

---

## 研究议题

### R1: 数据库选型

**上下文**: 需要存储笔记、标签、用户数据，支持全文搜索

**选项评估**:

| 方案 | 优点 | 缺点 |
|------|------|------|
| PostgreSQL | JSONB 原生支持、全文搜索强、生态丰富 | 内存占用稍高 |
| MySQL 8.0 | 腾讯云熟悉度高、运维成本低 | JSON 支持弱于 PG |
| SQLite | 轻量、Local-First 友好 | 并发写入受限 |

**决定**: **PostgreSQL 15**

**理由**:
1. `json_content` 字段需要 JSONB 类型存储和查询
2. 全文搜索支持更好（后续可能需要搜索笔记内容）
3. GORM 对 PostgreSQL 支持完善
4. 符合章程 "Local-First" 原则（可自托管）

**备选方案**: MySQL 8.0（如果腾讯云成本更优）

---

### R2: AI 服务选型

**上下文**: 需要 OCR、语音识别(ASR)、文本摘要、标签生成

**选项评估**:

| 服务 | OCR | ASR | LLM | 成本 | 备注 |
|------|-----|-----|-----|------|------|
| 腾讯云 AI | ✅ 通用OCR | ✅ 实时语音 | ❌ | 按量计费 | 公司资源 |
| 阿里云 AI | ✅ 文字识别 | ✅ 语音识别 | ✅ 通义千问 | 按量计费 | |
| DeepSeek API | ❌ | ❌ | ✅ 成本极低 | ¥1/百万token | 纯文本任务 |
| Whisper (自部署) | ❌ | ✅ | ❌ | 算力成本 | 延迟可控 |

**决定**: **混合方案**

| 任务 | 服务选择 | 理由 |
|------|----------|------|
| OCR 文字识别 | 腾讯云 OCR | 公司资源、准确率高 |
| 语音识别 ASR | 腾讯云实时语音识别 | 中文识别准确率高 |
| 文本摘要/标签 | DeepSeek API | 成本极低、效果好 |
| 图片理解 | DeepSeek-VL 或 Qwen-VL | 多模态能力 |

**理由**:
1. 复用腾讯云资源降低成本
2. DeepSeek 性价比极高（是 GPT-4 的 1/100）
3. 可后续切换为自部署方案

---

### R3: 文件存储选型

**上下文**: 存储图片、音视频附件，需要 CDN 加速

**选项评估**:

| 方案 | 优点 | 缺点 |
|------|------|------|
| 腾讯云 COS | 公司资源、与腾讯云生态集成 | 成本 |
| 阿里云 OSS | Get笔记使用、成熟稳定 | 需要新开账号 |
| MinIO (自部署) | Local-First、完全可控 | 运维成本 |

**决定**: **腾讯云 COS**

**理由**:
1. 用户在腾讯工作，可能有内部资源
2. 与腾讯云 AI 服务集成更顺畅
3. 符合章程 "安全性" 原则（敏感数据可控）

**备注**: 后续可考虑 MinIO 实现 Local-First

---

### R4: Tiptap 扩展配置

**上下文**: 需要还原 Get笔记 编辑器功能

**研究结果**:

Get笔记 使用的 Tiptap 扩展（从 CSS 类名和功能逆向推断）:

```typescript
const extensions = [
  // 基础
  StarterKit,
  Placeholder.configure({ placeholder: '记录现在的想法...' }),
  
  // 文本格式
  Bold, Italic, Underline, Strike, Code,
  Highlight.configure({ multicolor: true }),
  TextStyle, Color,
  
  // 块级元素
  Heading.configure({ levels: [1, 2, 3] }),
  BulletList, OrderedList,
  TaskList, TaskItem.configure({ nested: true }),
  Blockquote, CodeBlock, HorizontalRule,
  
  // 媒体
  Image.configure({ inline: true }),
  Link.configure({ openOnClick: false, autolink: true }),
  
  // 表格
  Table.configure({ resizable: true }),
  TableRow, TableHeader, TableCell,
]
```

**决定**: 使用上述扩展配置，逐步验证和调整

---

### R5: shadcn/ui + Tailwind 最佳实践

**研究结果**:

参考 blinko 项目的最佳实践:

1. **组件组织**:
   ```
   src/
   ├── components/
   │   ├── ui/           # shadcn 原始组件
   │   ├── features/     # 业务组件
   │   └── layouts/      # 布局组件
   ```

2. **Tailwind 配置**:
   - 使用 CSS 变量支持主题切换
   - 扩展 Get笔记 配色方案

3. **Zustand 模式**:
   ```typescript
   // 按功能拆分 store
   useNoteStore     // 笔记状态
   useEditorStore   // 编辑器状态
   useUIStore       // UI 状态（侧边栏、弹窗等）
   ```

---

## 章程合规检查

| 章程原则 | 技术决策 | 合规 |
|----------|----------|------|
| Local-First | PostgreSQL 可自托管、数据存本地 | ✅ |
| Invisible AI | AI 自动生成标签/摘要，不打扰用户 | ✅ |
| 前后端分离 | Next.js + go-zero 独立部署 | ✅ |
| 安全性 | JWT + CSRF、敏感数据加密 | ✅ |
| 代码质量 | TypeScript + Go 强类型 | ✅ |

---

## 风险识别

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| Tiptap 扩展兼容性 | 中 | 逐步添加扩展，充分测试 |
| AI 服务延迟 | 低 | 异步处理 + 进度显示 |
| 乐观锁冲突频率 | 低 | 前端自动重试 + 用户提示 |
| 大文件上传 | 中 | 分片上传 + 断点续传 |

---

## 最终技术栈

### 前端
- **框架**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **状态**: Zustand
- **编辑器**: Tiptap 2.x
- **HTTP**: Axios / fetch

### 后端
- **框架**: Go 1.21 + go-zero
- **ORM**: GORM
- **数据库**: PostgreSQL 15
- **缓存**: Redis (可选)
- **消息队列**: 暂不需要

### AI 服务
- **OCR**: 腾讯云通用印刷体识别
- **ASR**: 腾讯云实时语音识别
- **LLM**: DeepSeek API
- **多模态**: DeepSeek-VL 或 Qwen-VL

### 存储
- **文件**: 腾讯云 COS
- **CDN**: 腾讯云 CDN

### 部署
- **容器**: Docker + Docker Compose
- **CI/CD**: GitHub Actions (待定)
