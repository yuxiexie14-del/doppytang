# 客户定养管理系统后端

该项目基于 **FastAPI + SQLAlchemy + Alembic + MySQL** 实现客户定养业务后台，支持客户档案、合同、批次饲养计划及配送结算等数据的统一管理，并提供 Docker 一键启动能力。

## 功能概览
- 客户档案：遵循 2xxxx 编号规则，记录多联系电话、首次购买时间等信息。
- 合同与批次：跟踪套餐信息、鸡蛋余量、批次养殖状态及计划。
- 生产记录：支持饲喂、用药、称重等关键过程的记录。
- 配送登记：记录鸡蛋数量、包装、蔬菜及小礼品，自动扣减合同剩余鸡蛋。
- 结算管理：提供结算试算 `/settlements/trial` 和正式入账接口。
- 系统健康：`/health` 快速检测服务状态。

所有接口均可在 `http://127.0.0.1:8000/docs` 通过 OpenAPI 文档交互。

## 快速开始

### 云端环境（无 Docker，SQLite 模式）
云端环境无法使用 Docker 与 MySQL，项目会自动回退到 `SQLITE_URL` 指定的数据库（默认 `sqlite:///./dev.db`）。执行顺序如下：

```bash
cp .env.example .env  # 可选，如需覆盖默认配置
bash scripts/cloud_bootstrap.sh
bash scripts/cloud_migrate.sh
bash scripts/seed.sh        # 可选，导入示例数据
bash scripts/run_tests.sh   # 可选，运行 pytest
bash scripts/run_api.sh     # 启动 API，Ctrl+C 结束
```

完成后访问 `http://127.0.0.1:8000/health` 或 `http://127.0.0.1:8000/docs` 验证服务状态。

若需手动执行命令，可参考脚本中的步骤：

```bash
python -m venv .venv
source .venv/bin/activate || .\.venv\Scripts\activate
pip install \
  --index-url https://pypi.org/simple \
  --trusted-host pypi.org \
  --trusted-host files.pythonhosted.org \
  --no-cache-dir \
  --timeout 180 \
  -r api/requirements.txt || \
pip install \
  --index-url https://pypi.org/simple \
  --trusted-host pypi.org \
  --trusted-host files.pythonhosted.org \
  --no-cache-dir \
  --timeout 180 \
  -r requirements.txt
alembic upgrade head
python -m app.seed
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pytest -q
```

### 本地 / 生产环境（Docker + MySQL）
当具备 Docker 能力时，可按以下步骤运行 MySQL：

```bash
cp .env.example .env
docker-compose up -d
```

等待数据库就绪后执行迁移与种子数据（同样可以使用脚本，在激活虚拟环境后运行）：

```bash
alembic upgrade head
python -m app.seed
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

将 `DATABASE_URL` 指向 MySQL，若连接失败系统会自动回退到 `SQLITE_URL`，并在日志中给出提示。

## API 模块一览
| 模块 | 路径前缀 | 说明 |
| --- | --- | --- |
| 健康检查 | `/health` | 服务状态心跳 |
| 客户 | `/customers` | 客户档案增删改查 |
| 合同 | `/contracts` | 套餐合同管理，自动维护剩余鸡蛋 |
| 批次 | `/batches` | 批次信息管理 |
| 养殖计划 | `/rearing-plans` | 排产及日程计划 |
| 饲喂记录 | `/feedings` | 饲料投入记录 |
| 用药记录 | `/medications` | 药品投放记录 |
| 称重记录 | `/weighings` | 体重监测 |
| 配送 | `/deliveries` | 配送登记与剩余鸡蛋扣减 |
| 结算 | `/settlements` | 试算与正式结算 |

## 自动化测试
项目使用 `pytest` 覆盖 ≥10 个接口用例：

```bash
pytest -q
```

## 目录结构
- `app/main.py`：FastAPI 入口，注册全部路由与中间件。
- `app/models.py`：SQLAlchemy ORM 模型定义。
- `app/schemas.py`：Pydantic 请求/响应模型。
- `app/api/routes/`：REST 接口实现。
- `app/database.py`：数据库会话管理。
- `alembic/`：数据库迁移脚本。
- `app/seed.py`：示例数据初始化。
- `tests/`：端到端接口测试。

## 常见运维流程
1. `docker-compose up -d` 启动 MySQL 与 API。
2. `alembic upgrade head` 应用最新迁移。
3. `python -m app.seed` 导入种子数据（可重复执行，若已有数据会自动跳过）。
4. `pytest -q` 运行接口自动化测试。

如需面向生产部署，可将 `DATABASE_URL` 指向托管 MySQL，设置安全的 `JWT_SECRET` 并在 CORS 中限制允许的来源域名。
