import json
import logging

from services.logging_config import JsonFormatter, configure_logging


def test_json_formatter_includes_request_fields():
    record = logging.LogRecord(
        name="main",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="hello",
        args=(),
        exc_info=None,
    )
    record.request_id = "abc"
    record.method = "GET"
    record.path = "/api/health"
    record.status_code = 200
    record.duration_ms = 1.2

    payload = json.loads(JsonFormatter().format(record))
    assert payload["message"] == "hello"
    assert payload["request_id"] == "abc"
    assert payload["status_code"] == 200


def test_configure_logging_json_mode():
    configure_logging(environment="development", log_format="json")
    root = logging.getLogger()
    assert any(isinstance(h.formatter, JsonFormatter) for h in root.handlers)
    # Restore readable logs for the rest of the suite
    configure_logging(environment="development", log_format="text")
