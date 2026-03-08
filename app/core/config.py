from functools import cached_property
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from slowapi import Limiter
from slowapi.util import get_remote_address


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "Task Flow API 2"
    API_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/taskflow"
    ALEMBIC_DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/taskflow"
    TEST_DATABASE_URL: str = "sqlite+aiosqlite:///./test.db"

    SECRET_KEY: str = "change-me-in-prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL_SECONDS: int = 120

    CELERY_BROKER_URL: str = "redis://redis:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/1"
    ORDER_AUDIT_LOG_PATH: str = "./order_audit.log"

    CORS_ORIGINS: list[str] | str = ["http://localhost:3000", "http://localhost:5173"]
    DEFAULT_RATE_LIMIT: str = "100/minute"
    ADMIN_EMAIL: str = "admin@example.com"
    ADMIN_PASSWORD: str = "change-me-admin"
    ADMIN_FULL_NAME: str = "System Admin"
    MEDIA_ROOT: str = "./media"
    MEDIA_URL_PREFIX: str = "/media"
    MAX_IMAGE_UPLOAD_SIZE_MB: int = 5

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def normalize_origins(cls, value: Any) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        if isinstance(value, list):
            return value
        return []

    @cached_property
    def cors_origins(self) -> list[str]:
        return self.CORS_ORIGINS if isinstance(self.CORS_ORIGINS, list) else []

    @cached_property
    def rate_limiter(self) -> Limiter:
        return Limiter(key_func=get_remote_address, default_limits=[self.DEFAULT_RATE_LIMIT])


settings = Settings()
