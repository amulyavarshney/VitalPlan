"""Rate limiting with Redis when available, in-memory fallback otherwise."""
from __future__ import annotations

import logging
import os
import time
from collections import defaultdict, deque
from typing import Deque, Dict

from fastapi import HTTPException, Request, status

from config import settings

logger = logging.getLogger(__name__)

# Used by Playwright/local E2E so parallel registrations are not blocked.
_RATE_LIMITS_DISABLED = os.getenv("E2E_DISABLE_RATE_LIMIT", "").lower() in {"1", "true", "yes"}

_redis_client = None
_redis_checked = False


def get_redis_client():
    """Lazy Redis client. Returns None when Redis is unavailable."""
    global _redis_client, _redis_checked
    if _redis_checked:
        return _redis_client

    _redis_checked = True
    if not settings.REDIS_URL:
        return None

    try:
        import redis

        client = redis.Redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=0.5,
            socket_timeout=0.5,
        )
        client.ping()
        _redis_client = client
        logger.info("Rate limiter using Redis at %s", settings.REDIS_URL)
    except Exception as exc:
        logger.warning("Redis unavailable for rate limiting (%s); using in-memory fallback", exc)
        _redis_client = None
    return _redis_client


def reset_redis_client_for_tests() -> None:
    """Clear cached Redis client (tests only)."""
    global _redis_client, _redis_checked
    _redis_client = None
    _redis_checked = False


class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int, *, name: str = "default"):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.name = name
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)

    def reset(self) -> None:
        """Clear in-memory buckets (tests only)."""
        self._hits.clear()

    def check(self, key: str) -> None:
        if _RATE_LIMITS_DISABLED:
            return
        redis_client = get_redis_client()
        if redis_client is not None:
            self._check_redis(redis_client, key)
            return
        self._check_memory(key)

    def _check_redis(self, redis_client, key: str) -> None:
        redis_key = f"vitalplan:rl:{self.name}:{key}"
        try:
            count = redis_client.incr(redis_key)
            if count == 1:
                redis_client.expire(redis_key, self.window_seconds)
            if count > self.max_requests:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again later.",
                )
        except HTTPException:
            raise
        except Exception as exc:
            logger.warning("Redis rate limit failed (%s); falling back to memory", exc)
            self._check_memory(key)

    def _check_memory(self, key: str) -> None:
        now = time.monotonic()
        window_start = now - self.window_seconds
        bucket = self._hits[key]
        while bucket and bucket[0] < window_start:
            bucket.popleft()
        if len(bucket) >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
            )
        bucket.append(now)


auth_rate_limiter = RateLimiter(max_requests=20, window_seconds=60, name="auth")
password_reset_limiter = RateLimiter(max_requests=5, window_seconds=300, name="password_reset")
# Expensive / AI-backed endpoints
ai_rate_limiter = RateLimiter(max_requests=10, window_seconds=60, name="ai")
order_rate_limiter = RateLimiter(max_requests=30, window_seconds=60, name="orders")


def client_key(request: Request, suffix: str = "") -> str:
    forwarded = request.headers.get("x-forwarded-for")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
    return f"{ip}:{suffix}" if suffix else ip


def redis_status() -> str:
    """Return ok | unavailable | disabled for health checks."""
    if not settings.REDIS_URL:
        return "disabled"
    client = get_redis_client()
    if client is None:
        return "unavailable"
    try:
        client.ping()
        return "ok"
    except Exception:
        return "unavailable"
