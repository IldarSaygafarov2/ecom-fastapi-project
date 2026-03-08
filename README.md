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

or with Docker:

```bash
cp .env.example .env
docker compose up -d --build
```

## API docs

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Deploy to Ubuntu VPS (Docker Compose)

### 1) Server setup

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl git ufw
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2) Configure project

```bash
git clone <REPO_URL> task_flow_api_2
cd task_flow_api_2
cp .env.example .env
```

Update `.env` values:
- `SECRET_KEY` (use a long random key)
- `CORS_ORIGINS` (your frontend domain(s))

### 3) Production profile

This repository includes `docker-compose.prod.yml`:
- closes external access to `db` and `redis`
- runs containers with `restart: unless-stopped`
- enables `nginx` on `80/443`

Start:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### 4) HTTPS (Let's Encrypt)

1. Create dirs:

```bash
mkdir -p deploy/certbot/www deploy/certbot/conf
```

2. Temporarily use ACME-only nginx config:

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.acme.yml \
  up -d --build nginx
```

3. Issue certificate:

```bash
docker run --rm \
  -v "$(pwd)/deploy/certbot/www:/var/www/certbot" \
  -v "$(pwd)/deploy/certbot/conf:/etc/letsencrypt" \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d api.yourdomain.com \
  --email you@example.com --agree-tos --no-eff-email
```

4. Set your real domain in `deploy/nginx.prod.conf` by replacing
   `api.yourdomain.com` in certificate paths.

5. Restart stack:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart nginx
```

### 5) Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```
