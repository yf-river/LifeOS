# 代码风格与约定

## 总体原则

- **一致性**：保持与现有代码库一致的风格
- **可读性**：代码应易于理解和维护
- **类型安全**：充分利用 TypeScript 和 Python 类型系统
- **注释**：复杂逻辑需有注释，公共 API 需有文档

## 前端 (TypeScript/React/Next.js)

### 文件组织
- 使用 Next.js 14 App Router
- 页面组件放在 `src/app/` 目录下
- 通用组件放在 `src/components/` 目录下，按功能分类
- 工具函数放在 `src/lib/` 目录下
- 状态管理放在 `src/store/` 目录下

### 组件规范
1. **使用函数组件和 Hooks**
   ```tsx
   'use client';
   
   import { useState } from 'react';
   
   interface ComponentProps {
     // 定义 props 接口
   }
   
   export function ComponentName({ prop1, prop2 }: ComponentProps) {
     // 组件实现
   }
   ```

2. **Props 类型定义**
   - 使用 TypeScript 接口定义 props
   - 可选参数使用 `?` 标记
   - 复杂类型使用类型别名

3. **组件文档**
   - 组件顶部添加 JSDoc 注释
   - 说明组件用途、参数、示例
   ```tsx
   /**
    * 笔记卡片组件 - Get笔记风格深度还原
    * 
    * @param note - 笔记数据对象
    * @param onClick - 点击回调函数
    * @param isSelected - 是否选中状态
    */
   ```

4. **导入顺序**
   ```tsx
   // 1. React 相关
   import { useState } from 'react';
   
   // 2. 第三方库
   import { motion } from 'framer-motion';
   
   // 3. 项目组件
   import { LinkPreview } from './LinkPreview';
   
   // 4. 工具函数和样式
   import { cn } from '@/lib/utils';
   import { formatRelativeTime } from '@/lib/formatTime';
   ```

### 样式约定
1. **使用 Tailwind CSS**
   - 优先使用 Tailwind 实用类
   - 使用 `cn()` 函数合并类名
   ```tsx
   import { cn } from '@/lib/utils';
   
   <div className={cn(
     'bg-white rounded-2xl',
     isSelected && 'ring-2 ring-[#2a88ff]'
   )} />
   ```

2. **设计系统引用**
   - 参考 `素材/get笔记/styles.json` 中的颜色、间距、字体
   - 保持与 Get笔记一致的设计语言

### 状态管理
- 使用 Zustand 进行全局状态管理
- store 定义在 `src/store/` 目录下
- 按功能模块组织 store

### 路径别名
- 使用 `@/*` 指向 `src/*`
- 配置在 `tsconfig.json` 中

## 后端 (Python/FastAPI)

### 代码结构
```
backend/app/
├── api/v1/          # API 路由
├── core/            # 核心配置
├── models/          # SQLAlchemy 模型
├── schemas/         # Pydantic Schema
└── services/        # 业务服务
```

### 模型规范
1. **SQLAlchemy 2.0 声明式映射**
   ```python
   from sqlalchemy.orm import Mapped, mapped_column
   
   class Note(Base):
       __tablename__ = "notes"
       
       id: Mapped[str] = mapped_column(
           String(36), primary_key=True, default=lambda: str(uuid.uuid4())
       )
       title: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
   ```

2. **模型文档**
   - 类顶部添加 docstring
   - 重要字段添加注释
   ```python
   """笔记表"""
   
   # 纯文本，用于搜索
   content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
   ```

3. **序列化方法**
   - 提供 `to_dict()` 方法
   - 控制返回字段
   ```python
   def to_dict(self, include_tags: bool = True) -> dict:
       """转换为字典"""
       data = {
           "id": self.id,
           "title": self.title,
       }
       return data
   ```

### API 规范
1. **响应格式**
   ```json
   {
     "h": {
       "c": 0,          // 状态码，0=成功
       "e": "",         // 错误信息
       "s": "success",
       "t": 1234567890
     },
     "c": {}            // 业务数据
   }
   ```

2. **错误处理**
   - 使用 FastAPI 异常处理
   - 统一错误响应格式

### 格式化工具
- **Black**：行宽 100
- **Ruff**：用于代码检查和格式化
- **运行命令**：
  ```bash
  black .
  ruff check .
  ruff format .
  ```

## 通用约定

### 命名规范
- **变量/函数**：camelCase（JavaScript/TypeScript），snake_case（Python）
- **类/类型**：PascalCase
- **常量**：UPPER_SNAKE_CASE
- **文件/目录**：kebab-case

### 注释规范
1. **文件头注释**（可选）
   ```python
   #!/usr/bin/env python3
   # -*- coding: utf-8 -*-
   """
   模块描述
   """
   ```

2. **函数/方法注释**
   - 说明功能、参数、返回值
   - 复杂算法添加详细说明

3. **TODO/FIXME 注释**
   ```python
   # TODO: 优化性能
   # FIXME: 处理边界情况
   ```

### Git 提交规范
- 使用中文提交信息
- 清晰描述更改内容
- 遵循 conventional commits 风格（可选）

## 数据库

### 命名约定
- 表名：复数形式，snake_case
- 字段名：snake_case
- 外键：`{表名}_id`

### 索引策略
- 主键自动索引
- 外键字段添加索引
- 查询频繁字段添加索引

## 环境配置

### 环境变量
- 前端：`.env.local`
- 后端：`.env`
- 敏感信息使用环境变量
- 提供 `.env.example` 模板

### 配置文件
- 集中管理配置
- 区分开发/生产环境
- 使用 Pydantic Settings 进行配置管理

## 测试规范

### 前端测试
- E2E 测试使用 Playwright
- 运行命令：`npm run test:e2e`
- 测试覆盖核心用户流程

### 后端测试
- 使用 pytest
- 异步测试使用 pytest-asyncio
- 运行命令：`hatch run test`

## 代码审查要点

1. **功能正确性**
   - 实现是否符合需求
   - 边界情况处理

2. **代码质量**
   - 符合编码规范
   - 代码可读性
   - 性能考虑

3. **测试覆盖**
   - 是否有相应测试
   - 测试是否充分

4. **安全考虑**
   - 输入验证
   - 权限控制
   - 敏感信息处理