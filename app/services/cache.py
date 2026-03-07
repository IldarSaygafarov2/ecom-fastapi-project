import json
from typing import Any

from redis.asyncio import Redis

from app.core.config import settings

redis_client: Redis | None = None


async def init_redis_pool() -> None:
    global redis_client
    redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        await redis_client.ping()
    except Exception:
        redis_client = None


async def shutdown_redis_pool() -> None:
    if redis_client is not None:
        await redis_client.close()


async def get_json(key: str) -> Any | None:
    if redis_client is None:
        return None
    value = await redis_client.get(key)
    if not value:
        return None
    return json.loads(value)


async def set_json(key: str, payload: Any, ttl: int | None = None) -> None:
    if redis_client is None:
        return
    await redis_client.set(
        key,
        json.dumps(payload, default=str),
        ex=ttl or settings.CACHE_TTL_SECONDS,
    )


async def delete_by_prefix(prefix: str) -> None:
    if redis_client is None:
        return
    keys = await redis_client.keys(f"{prefix}*")
    if keys:
        await redis_client.delete(*keys)
