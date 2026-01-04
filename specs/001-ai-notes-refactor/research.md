# 研究: 同步、移动 UI 和地理位置

**状态**: 已完成
**功能**: `001-ai-notes-refactor`

## 1. 同步引擎策略

**背景**: 我们需要同步本地 SQLite (Capacitor) 与服务端 PostgreSQL。
**选项**:
1.  **ElectricSQL**: 实时同步，基于 CRDT。优点: 健壮。缺点: 设置复杂，引入新的基础设施组件。
2.  **PowerSync**: 类似于 Electric，专为 PG<->SQLite 设计。
3.  **自定义 REST 同步**: "最后写入者胜" 或基于时间戳的同步。

**决策**: **自定义 REST 同步 (基于时间戳)** 用于阶段 1。
**理由**:
- **简单性**: 在此阶段引入 CRDT (无冲突复制数据类型) 会增加不必要的复杂性。
- **数据性质**: 大多数生活日志数据是 "仅追加" 的 (位置、语音、日志)。冲突很少见。
- **控制权**: 允许我们在应用逻辑 (Python) 中处理冲突，而不是基础设施。
- **升级路径**: 如果冲突解决变得痛苦，我们可以在阶段 3/4 迁移到 PowerSync。

## 2. 移动端 UI 框架

**背景**: 需要使用 React 构建具有 "原生感" 的移动端 UI。
**选项**:
1.  **Ionic Framework**: Capacitor 的 "经典" 选择。优点: 原生模仿。缺点: 重，视觉风格与 Shadcn 不同。
2.  **Konsta UI**: 基于 Tailwind 的移动端 UI。
3.  **Shadcn/ui + CSS 微调**: 使用与 Web 相同的组件。

**决策**: **Shadcn/ui + Vaul (抽屉)**。
**理由**:
- **一致性**: Web 和移动端使用统一的设计系统。
- **速度**: 我们已经为 Web 选择了 Shadcn。
- **质量**: Shadcn 的质量足够高。`Vaul` 提供了定义现代移动应用的关键 "底部弹窗" 交互。

## 3. 后台地理位置

**背景**: 需要节省电池的后台追踪。
**选项**:
1.  `@capacitor/geolocation`: 标准插件。仅在前台工作。
2.  `@capacitor-community/background-geolocation`: 社区插件。
3.  `transistorsoft-react-native-background-geolocation`: "黄金标准" (商业/付费，但开发免费)。

**决策**: **@capacitor-community/background-geolocation**。
**理由**:
- **开源**: 符合我们的 "MIT/开源" 精神 (不像 Transistorsoft)。
- **足够用**: 能够进行 "静止" vs "移动" 状态检测，这正是 Spec v4 中定义的动态采样策略所需的。

## 4. 数据库 Schema 策略

**背景**: 如何在 PG 中处理多租户和混合数据。
**决策**:
- **表**: `users` (用户), `workspaces` (工作区), `workspace_members` (工作区成员)。
- **分区**: 所有数据表 (`notes`, `events`) 必须包含 `workspace_id`。
- **JSONB**: 在 `notes` 表中使用 `metadata` 列 (JSONB) 存储任意 AI 提取的属性 (例如 "calories", "sentiment")。
