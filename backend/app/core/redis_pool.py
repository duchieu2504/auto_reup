"""
Centralized Redis connection pool — avoids creating new connections per request.
All modules should import from here instead of creating their own redis clients.
"""
import redis
import redis.asyncio as aioredis
from app.core.config import REDIS_URL

# Synchronous pool (for Celery tasks and sync endpoints)
_sync_pool = redis.ConnectionPool.from_url(REDIS_URL, decode_responses=False)
_sync_pool_decoded = redis.ConnectionPool.from_url(REDIS_URL, decode_responses=True)

# Async pool (for FastAPI async endpoints and SSE streams)
_async_pool = aioredis.ConnectionPool.from_url(REDIS_URL, decode_responses=True)


def get_sync_redis(decode_responses: bool = False) -> redis.Redis:
    """Get a sync Redis client backed by a shared connection pool."""
    pool = _sync_pool_decoded if decode_responses else _sync_pool
    return redis.Redis(connection_pool=pool)


def get_async_redis() -> aioredis.Redis:
    """Get an async Redis client backed by a shared connection pool."""
    return aioredis.Redis(connection_pool=_async_pool)
