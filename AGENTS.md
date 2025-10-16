# Agent Guidelines

- Use the helper scripts under `scripts/` when demonstrating cloud (no Docker) workflows: bootstrap, migrate, seed, run API, and run tests.
- Prefer the SQLite fallback (`SQLITE_URL`) for cloud commands; MySQL + Docker Compose remain for local usage.
- Configuration should never require `python-dotenv`; environment variables must work even when the package is missing.
- Keep documentation aligned with both cloud (SQLite) and local (Docker + MySQL) setups whenever instructions are updated.

## 本地（Docker + MySQL）快速步骤
1. `cp .env.example .env`
2. `docker-compose up -d`
3. `alembic upgrade head`
4. `python -m app.seed`
5. `uvicorn app.main:app --host 0.0.0.0 --port 8000`

数据库准备就绪后即可访问 `http://127.0.0.1:8000/docs` 调试接口。

## 云端（无 Docker，SQLite）一键步骤
1. `python -m venv .venv`
2. `source .venv/bin/activate || .\.venv\Scripts\activate`
3. `pip install --index-url https://pypi.org/simple --trusted-host pypi.org --trusted-host files.pythonhosted.org --no-cache-dir --timeout 180 -r api/requirements.txt || pip install --index-url https://pypi.org/simple --trusted-host pypi.org --trusted-host files.pythonhosted.org --no-cache-dir --timeout 180 -r requirements.txt`
4. `alembic upgrade head`
5. `python -m app.seed`
6. `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
7. `pytest -q`
