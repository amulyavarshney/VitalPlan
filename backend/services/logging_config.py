"""Configure human-readable (dev) or JSON (production) logging."""
from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any, Dict


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        for key in ("request_id", "method", "path", "status_code", "duration_ms"):
            if hasattr(record, key):
                payload[key] = getattr(record, key)
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def configure_logging(*, environment: str, log_format: str = "auto") -> None:
    """Set root logging handlers.

    log_format: auto | text | json
    auto uses JSON when environment == production.
    """
    use_json = log_format == "json" or (
        log_format == "auto" and environment == "production"
    )
    root = logging.getLogger()
    root.handlers.clear()
    handler = logging.StreamHandler(sys.stdout)
    if use_json:
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(
            logging.Formatter("%(asctime)s %(levelname)s [%(name)s] %(message)s")
        )
    root.addHandler(handler)
    root.setLevel(logging.INFO)
