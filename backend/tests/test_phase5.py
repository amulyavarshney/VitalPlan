from fastapi import HTTPException

from services.rate_limit import RateLimiter, reset_redis_client_for_tests


def test_health_includes_dependency_checks(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] in {"healthy", "degraded"}
    assert body["checks"]["database"]["status"] == "ok"
    assert body["checks"]["redis"]["status"] in {"ok", "unavailable", "disabled"}
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"


def test_memory_rate_limiter_blocks_excess(monkeypatch):
    reset_redis_client_for_tests()
    monkeypatch.setattr("services.rate_limit.settings.REDIS_URL", "")
    reset_redis_client_for_tests()

    limiter = RateLimiter(max_requests=2, window_seconds=60, name="test")
    limiter.check("client-a")
    limiter.check("client-a")
    try:
        limiter.check("client-a")
        assert False, "expected rate limit"
    except HTTPException as exc:
        assert exc.status_code == 429
