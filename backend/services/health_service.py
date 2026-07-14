"""Dependency health probes for readiness checks."""
from __future__ import annotations

import logging
from typing import Any, Dict

from sqlalchemy import text

from services.database import engine
from services.rate_limit import redis_status

logger = logging.getLogger(__name__)


def check_database() -> Dict[str, Any]:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception as exc:
        logger.exception("Database health check failed")
        return {"status": "error", "detail": str(exc)}


def build_health_report() -> Dict[str, Any]:
    database = check_database()
    redis = {"status": redis_status()}

    if database["status"] != "ok":
        overall = "unhealthy"
    elif redis["status"] == "unavailable":
        overall = "degraded"
    else:
        overall = "healthy"

    return {
        "status": overall,
        "message": "VitalPlan API is running",
        "checks": {
            "database": database,
            "redis": redis,
        },
    }
