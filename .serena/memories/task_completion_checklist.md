# 任务完成检查清单

完成代码修改后，请按以下步骤验证更改的正确性和质量。

## 1. 代码检查与格式化

### 前端 (TypeScript/React)
```bash
cd frontend

# 代码检查
npm run lint

# 如果有错误，需要修复后再继续
```

### 后端 (Python/FastAPI)
```bash
cd backend

# 代码格式化
black .

# 代码检查
ruff check .
ruff format .

# 如果有错误，需要修复后再继续
```

## 2. 运行测试

### 前端 E2E 测试
```bash
cd frontend

# 确保后端服务正在运行
# 运行 E2E 测试
npm run test:e2e

# 如果测试失败，需要：
# 1. 检查代码是否正确
# 2. 检查测试环境是否正常
# 3. 修复问题或更新测试
```

### 后端单元测试
```bash
cd backend

# 运行测试
hatch run test

# 生成覆盖率报告（可选）
hatch run test:cov

# 如果测试失败，需要：
# 1. 检查业务逻辑是否正确
# 2. 检查测试用例是否覆盖边界情况
# 3. 修复问题或更新测试
```

## 3. 本地功能验证

### 启动服务验证
```bash
# 使用 Docker Compose 启动所有服务
docker-compose up -d

# 或者分别启动
cd backend && hatch run dev
cd frontend && npm run dev
```

### 手动测试要点
1. **前端功能**
   - 页面加载是否正常
   - 交互是否流畅
   - 样式是否正确
   - 错误处理是否恰当

2. **后端 API**
   - 访问 API 文档：http://localhost:8080/docs
   - 测试相关 API 端点
   - 验证响应格式是否正确
   - 检查错误响应

3. **数据库操作**
   - CRUD 操作是否正常
   - 数据一致性检查
   - 迁移脚本（如果修改了模型）

## 4. 构建验证

### 前端生产构建
```bash
cd frontend

# 生产构建
npm run build

# 如果构建失败，需要：
# 1. 检查类型错误
# 2. 检查依赖问题
# 3. 修复构建配置
```

### 后端构建验证
```bash
cd backend

# 检查 Python 包是否可以正常导入
python -c "import app"

# 如果有新依赖，更新 requirements.txt
pip freeze > requirements.txt
```

## 5. 代码质量检查

### 提交前检查
1. **代码审查自查**
   - 代码是否符合项目规范
   - 是否有重复代码
   - 是否有未使用的导入
   - 变量/函数命名是否清晰

2. **性能考虑**
   - 是否有不必要的渲染/计算
   - 数据库查询是否优化
   - 内存使用是否合理

3. **安全性检查**
   - 输入验证是否充分
   - 敏感信息是否暴露
   - 权限控制是否到位

### 提交信息规范
- 使用中文提交信息
- 清晰描述更改内容
- 关联相关 issue/任务
- 遵循项目提交规范

## 6. 特殊注意事项

### 数据库迁移
如果修改了 SQLAlchemy 模型：
```bash
cd backend

# 生成迁移脚本
alembic revision --autogenerate -m "描述更改内容"

# 应用迁移
alembic upgrade head

# 验证迁移是否正确
```

### 环境变量
如果添加了新环境变量：
1. 更新 `.env.example` 文件
2. 更新相关文档
3. 通知团队成员

### 依赖更新
如果更新了依赖：
1. 更新 `package.json` 或 `requirements.txt`
2. 测试兼容性
3. 更新 Dockerfile（如果需要）

## 7. 最终确认清单

在提交代码前，确认以下事项：

- [ ] 代码检查通过（ESLint/Ruff）
- [ ] 代码格式化完成（Black/Prettier）
- [ ] 所有测试通过
- [ ] 本地功能验证完成
- [ ] 生产构建成功
- [ ] 数据库迁移正常（如果涉及）
- [ ] 提交信息符合规范
- [ ] 代码审查自查完成

## 8. 问题排查

### 常见问题及解决方案

1. **前端构建失败**
   - 检查 TypeScript 类型错误
   - 检查依赖版本冲突
   - 清理缓存：`npm run dev:clean`

2. **后端测试失败**
   - 检查数据库连接
   - 检查环境变量设置
   - 检查异步代码是否正确

3. **Docker 服务启动失败**
   - 检查端口冲突
   - 检查卷挂载权限
   - 查看日志：`docker-compose logs`

4. **API 响应格式错误**
   - 检查响应包装器
   - 检查异常处理
   - 验证 Swagger 文档

## 9. 后续步骤

完成所有检查后：

1. **创建 Pull Request**
   - 添加清晰的描述
   - 关联相关 issue
   - 添加测试结果截图

2. **代码审查**
   - 响应审查意见
   - 及时修复问题
   - 保持良好沟通

3. **部署验证**
   - 监控部署过程
   - 验证生产环境功能
   - 记录部署日志