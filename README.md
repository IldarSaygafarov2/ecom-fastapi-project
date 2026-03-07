# Task Flow API 2

Async FastAPI backend for eCommerce with:
- PostgreSQL + SQLAlchemy async
- JWT auth + RBAC
- Redis cache + rate limiting
- BackgroundTasks + Celery
- Alembic migrations
- Docker and CI

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload
```

## API docs

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
