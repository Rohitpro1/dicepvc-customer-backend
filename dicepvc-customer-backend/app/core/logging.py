import logging
import json
import sys
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Capture extra custom context if passed (e.g., extra={"user_id": "usr_..."})
        if hasattr(record, "user_id"):
            log_entry["user_id"] = record.user_id
        if hasattr(record, "request_id"):
            log_entry["request_id"] = record.request_id
        if hasattr(record, "path"):
            log_entry["path"] = record.path
        if hasattr(record, "latency_ms"):
            log_entry["latency_ms"] = record.latency_ms

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)


def setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # Console Handler outputting to stdout
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    
    # Avoid duplicate handlers in case of reload
    if not logger.handlers:
        logger.addHandler(handler)
        
    # Silence third-party verbose logs
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("motor").setLevel(logging.WARNING)
