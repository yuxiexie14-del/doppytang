# 管理后台（Admin）

基于 [Vite](https://vitejs.dev/)、[React](https://react.dev/) 与 [Ant Design](https://ant.design/) 的单页管理后台，配合后端接口实现客户、合同、批次与养殖计划的日常维护。

## 本地启动

```bash
cd admin
cp .env.example .env
npm install
npm run dev
```

默认使用 `.env` 中的 `VITE_API_BASE` 调用真实后端接口，可通过在 `.env` 中将 `VITE_USE_MOCK` 设置为 `true` 启动内置 Mock 数据，便于在后端不可用时浏览与演示。

## 主要功能

- 登录页（预留 Token 存储结构，当前无需鉴权即可跳转）
- 客户管理：分页、关键字搜索、详情查看、新增/编辑/删除（抽屉表单）
- 合同管理：列表搜索，支持与客户关联的新增/编辑/删除，并可在抽屉内展示客户档案、发起价格试算
- 配送任务：列出待配送合同、登记配送数量/包装/备注，并支持查看历史配送记录
- 批次管理：列表与 CRUD，字段与后端 OpenAPI 一致
- 养殖计划管理：列表与 CRUD，可选择关联批次
- 通用表格组件支持分页、搜索、加载状态提示
- 统一请求封装，自动附加 JSON 头与 Token，并提供错误提示
- Mock 开关：后端不可用时使用内存数据源，同步实现 CRUD

## 构建与预览

```bash
npm run build
npm run preview
```

`npm run build` 将产出生产环境静态资源，`npm run preview` 用于本地验证构建结果。
